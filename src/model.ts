'use strict';

import {
  IIterator
} from '@phosphor/algorithm';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  VDomModel
} from '@jupyterlab/apputils';

import {
  Kernel, KernelMessage
} from '@jupyterlab/services';

import {
  DefaultKernel
} from '@jupyterlab/services/lib/kernel/default';

import {
  deserialize
} from '@jupyterlab/services/lib/kernel/serialize';


export type MessageThread = {
  msg: KernelMessage.IMessage;
  children: MessageThread[];
};


function isHeader(candidate: {} | KernelMessage.IHeader): candidate is KernelMessage.IHeader {
  return (candidate as any).msg_id !== undefined;
}


export
class ThreadIterator implements IIterator<ThreadIterator.IElement> {
  constructor(threads: MessageThread[], collapsed: {[key: string]: boolean}) {
    this._threads = threads;
    this._collapsed = collapsed;
    this._index = -1;
    this._child = null;
  }

  iter() {
    return this;
  }

  next(): ThreadIterator.IElement | undefined {
    if (this._child) {
      let next = this._child.next();
      if (next !== undefined) {
        return next;
      }
      this._child = null;
    }
    // Move to next thread
    ++this._index
    if (this._index >= this._threads.length) {
      return undefined;
    }
    const entry = this._threads[this._index];
    if (entry.children.length > 0 && !this._collapsed[entry.msg.header.msg_id]) {
      // Iterate over children after this
      this._child = new ThreadIterator(entry.children, this._collapsed);
    }
    return {msg: entry.msg, hasChildren: entry.children.length > 0};
  }

  clone(): ThreadIterator {
    let r = new ThreadIterator(this._threads, this._collapsed);
    r._index = this._index;
    if (this._child) {
      r._child = this._child.clone();
    }
    return r;
  }

  private _index: number;
  private _child: ThreadIterator | null;

  private _threads: MessageThread[];
  private _collapsed: {[key: string]: boolean};
}

export
namespace ThreadIterator {
  export
  interface IElement {
    msg: KernelMessage.IMessage;
    hasChildren: boolean;
  }
}


/**
 * Model for a kernel spy.
 */
export
class KernelSpyModel extends VDomModel {
  constructor(kernel: Kernel.IKernelConnection) {
    super();
    this._kernel = Private.patchKernel(kernel as DefaultKernel);
    this._kernel.anyMessage.connect(this.onMessage, this);
  }

  clear() {
    this._log.splice(0, this._log.length);
    this._messages = {};
    this._childLUT = {};
    this._roots = [];
  }

  get kernel() {
    return this._kernel;
  }

  get log(): ReadonlyArray<KernelMessage.IMessage> {
    return this._log;
  }

  get tree(): MessageThread[] {
    return this._roots.map((root_id) => {
      return this.getThread(root_id, false);
    });
  }

  depth(msg: KernelMessage.IMessage | null): number {
    if (msg === null) {
      return -1;
    }
    let depth = 0;
    while (msg = this._findParent(msg)) {
      ++depth;
    }
    return depth;
  }

  getThread(msg_id: string, ancestors=true): MessageThread {
    const msg = this._messages[msg_id];
    if (ancestors) {
      // Work up to root, then work downwards
      let root = msg;
      let candidate;
      while (candidate = this._findParent(root)) {
        root = candidate;
      }
      return this.getThread(root.header.msg_id, false);
    }

    const childMessages = this._childLUT[msg_id] || [];
    let childThreads = childMessages.map((child_id) => {
      return this.getThread(child_id, false);
    });
    const thread: MessageThread = {
      msg: this._messages[msg_id],
      children: childThreads,
    }
    return thread;
  }

  protected onMessage(sender: IPatchedKernel, message: KernelMessage.IMessage) {
    this._log.push(message);
    this._messages[message.header.msg_id] = message;
    const parent = this._findParent(message);
    if (parent === null) {
      this._roots.push(message.header.msg_id);
    } else {
      this._childLUT[parent.header.msg_id] = this._childLUT[parent.header.msg_id] || [];
      this._childLUT[parent.header.msg_id].push(message.header.msg_id);
    }
    this.stateChanged.emit(undefined);
  }

  private _findParent(msg: KernelMessage.IMessage): KernelMessage.IMessage | null {
    if (isHeader(msg.parent_header)) {
      return this._messages[msg.parent_header.msg_id] || null;
    }
    return null;
  }

  private _log: KernelMessage.IMessage[] = [];

  private _kernel: IPatchedKernel;

  private _messages: {[key: string]: KernelMessage.IMessage} = {};
  private _childLUT: {[key: string]: string[]} = {};
  private _roots: string[] = [];
}


export
interface IPatchedKernel extends Kernel.IKernel {
  anyMessage: ISignal<this, KernelMessage.IMessage>;
}



namespace Private {
  export
  function patchKernel(kernel: DefaultKernel): IPatchedKernel {
    const patchable = kernel as any as IPatchedKernel;
    const anyMessage = new Signal<IPatchedKernel, KernelMessage.IMessage>(patchable);
    patchable.anyMessage = anyMessage;
    const origShell = kernel.sendShellMessage;
    const origStdin = kernel.sendInputReply;
    const origWSMessage = (kernel as any)._onWSMessage;
    patchable.sendShellMessage = function(msg: KernelMessage.IShellMessage, expectReply=false, disposeOnDone=true) {
      anyMessage.emit(msg);
      return origShell.call(kernel, msg, expectReply, disposeOnDone);
    };
    patchable.sendInputReply = function(content: KernelMessage.IInputReply) {
      let options: KernelMessage.IOptions = {
        msgType: 'input_reply',
        channel: 'stdin',
        username: this._username,
        session: this._clientId
      };
      let msg = KernelMessage.createMessage(options, content);
      anyMessage.emit(msg);
      return origStdin.call(kernel, content);
    };
    (patchable as any)._ws.onmessage = function(evt: MessageEvent) {
      origWSMessage.call(kernel, evt);
      let msg = deserialize(evt.data);
      anyMessage.emit(msg);
    }
    return patchable;
  }
}
