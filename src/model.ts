'use strict';

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


export type MessageThread = {
  msg: KernelMessage.IMessage;
  children: MessageThread[];
};


function isHeader(candidate: {} | KernelMessage.IHeader): candidate is KernelMessage.IHeader {
  return (candidate as any).msg_id !== undefined;
}


/**
 * Model for a kernel spy.
 */
export
class KernelSpyModel extends VDomModel {
  constructor(kernel: Kernel.IKernelConnection) {
    super();
    this._kernel = Private.patchKernel(kernel as DefaultKernel);
    this._kernel.iopubMessage.connect(this.onMessage, this);
    this._kernel.shellMessage.connect(this.onMessage, this);
    this._kernel.stdinMessage.connect(this.onMessage, this);
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
      return this.getThread(child_id);
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
  shellMessage: ISignal<this, KernelMessage.IShellMessage>;
  stdinMessage: ISignal<this, KernelMessage.IStdinMessage>;
}



namespace Private {
  export
  function patchKernel(kernel: DefaultKernel): IPatchedKernel {
    const patchable = kernel as any as IPatchedKernel;
    const shellMessage = new Signal(patchable);
    const stdinMessage = new Signal(patchable);
    patchable.shellMessage = new Signal(patchable);
    patchable.stdinMessage = new Signal(patchable);
    const origShell = kernel.sendShellMessage;
    const origStdin = kernel.sendInputReply;
    patchable.sendShellMessage = function(msg: KernelMessage.IShellMessage, expectReply=false, disposeOnDone=true) {
      shellMessage.emit(msg);
      return origShell.call(kernel, msg, expectReply, disposeOnDone);
    };
    patchable.sendInputReply = function(msg: KernelMessage.IInputReply) {
      stdinMessage.emit(msg);
      return origStdin.call(kernel, msg);
    };
    return patchable;
  }
}
