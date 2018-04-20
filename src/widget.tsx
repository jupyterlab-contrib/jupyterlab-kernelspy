'use strict'

import * as React from 'react';

import {
  VDomRenderer
} from '@jupyterlab/apputils';

import {
  KernelMessage, Kernel
} from '@jupyterlab/services';

import {
  KernelSpyModel
} from './model';



function Message(props: Message.IProperties): React.ReactElement<any> {
  return (
    <div className='jp-kernelspy-message'>
      <pre>
        { JSON.stringify(props.message, null, 2) }
      </pre>
    </div>
  );
}

namespace Message {
  export
  interface IProperties {
    message: KernelMessage.IMessage;
  }
}

/**
 * The main view for the kernel spy.
 */
export
class KernelSpyView extends VDomRenderer<KernelSpyModel> {
  constructor(kernel: Kernel.IKernelConnection) {
    super();
    this.model = new KernelSpyModel(kernel);
    this.addClass('jp-kernelspy-view');
    this.id = `kernelspy-${kernel.id}`;
    this.title.label = 'Kernel spy';
    this.title.closable = true;
  }

  /**
   * Render the extension discovery view using the virtual DOM.
   */
  protected render(): React.ReactElement<any>[] {
    const model = this.model!;
    let messages = [];
    for (let msg of model.log) {
      messages.push(
          <Message message={msg}/>
      );
    }
    return [
      <div>
        <header>Message log</header>
        {...messages}
      </div>
    ];

  }

}
