'use strict'

import * as React from 'react';

import {
  VDomRenderer
} from '@jupyterlab/apputils';

import {
  KernelMessage, Kernel
} from '@jupyterlab/services';

import {
  JSONValue
} from '@phosphor/coreutils';

import {
  ObjectInspector, ObjectLabel
} from 'react-inspector';

import {
  KernelSpyModel
} from './model';

import {
  ThreadNavigator
} from './threadnav';


import '../style/index.css';


const theme = {
  BASE_FONT_FAMILY: 'var(--jp-code-font-family)',
  BASE_FONT_SIZE: 'var(--jp-code-font-size)',
  BASE_LINE_HEIGHT: 'var(--jp-code-line-height)',

  BASE_BACKGROUND_COLOR: 'var(--jp-layout-color0)',
  BASE_COLOR: 'var(--jp-content-font-color0)',

  OBJECT_NAME_COLOR: 'var(--jp-content-font-color1)',
  OBJECT_VALUE_NULL_COLOR: 'var(--jp-mirror-editor-builtin-color)',
  OBJECT_VALUE_UNDEFINED_COLOR: 'var(--jp-mirror-editor-builtin-color)',
  OBJECT_VALUE_REGEXP_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_STRING_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_SYMBOL_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_NUMBER_COLOR: 'var(--jp-mirror-editor-number-color)',
  OBJECT_VALUE_BOOLEAN_COLOR: 'var(--jp-mirror-editor-builtin-color))',
  OBJECT_VALUE_FUNCTION_KEYWORD_COLOR: 'var(--jp-mirror-editor-def-color))',

  ARROW_COLOR: 'var(--jp-content-font-color1)',
  ARROW_MARGIN_RIGHT: 3,
  ARROW_FONT_SIZE: 12,

  TREENODE_FONT_FAMILY: 'var(--jp-code-font-family)',
  TREENODE_FONT_SIZE: 'var(--jp-code-font-size)',
  TREENODE_LINE_HEIGHT: 'var(--jp-code-line-height)',
  TREENODE_PADDING_LEFT: 12,
};

interface IRendererArgs {
  depth: number;
  name: string;
  data: JSONValue;
  isNonenumerable: boolean;
  expanded: boolean;
}

function msgNodeRenderer(args: IRendererArgs) {
  const {name, depth, isNonenumerable, data} = args;
  if (depth !== 0) {
    return <ObjectLabel name={name} data={data} isNonenumerable={isNonenumerable} />;
  }
  const msg = data as any as KernelMessage.IMessage;
  return (
    <span>
      {msg.channel}.{msg.header.msg_type}: {msg.header.msg_id}
    </span>
  );
}

function Message(props: Message.IProperties): React.ReactElement<any> {
  return (
    <div className='jp-kernelspy-message'>
      <ObjectInspector data={props.message} theme={theme} nodeRenderer={msgNodeRenderer}/>
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
    this.title.icon = '';
  }

  protected onToggleThreaded() {
    this.showThreads = !this.showThreads;
    this.update();
  } 

  /**
   * Render the extension discovery view using the virtual DOM.
   */
  protected render(): React.ReactElement<any>[] {
    const model = this.model!;
    const entries = [];
    if (this.showThreads) {
      // Show thread navigator
      entries.push(
        <ThreadNavigator threads={model.tree} key="thread-navigator"/>
      );
    }
    const messages = [];
    for (let msg of model.log) {
      messages.push(
        <Message message={msg} key={`message-${msg.header.msg_id}`} />
      );
    }
    entries.push(
      <div key="message-log" className="jp-kernelspy-messagelog">
        {...messages}
      </div>
    )
    return [
      <div>
        <div className="jp-kernelspy-toolbar">
          <button onClick={() => this.onToggleThreaded()}>Threaded</button>
        </div>
        <div className="jp-kernelspy-content">
          {...entries}
        </div>
      </div>
    ];

  }

  protected showThreads: boolean = false;

}
