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
  }

  get log(): ReadonlyArray<KernelMessage.IMessage> {
    return this._log;
  }

  protected onMessage(sender: IPatchedKernel, message: KernelMessage.IMessage) {
    this._log.push(message);
    this.stateChanged.emit(undefined);
  }

  private _log: KernelMessage.IMessage[] = [];

  private _kernel: IPatchedKernel;
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
