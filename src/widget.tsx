'use strict'

import * as React from 'react';

import {
  VDomRenderer, Toolbar, ToolbarButton
} from '@jupyterlab/apputils';

import {
  KernelMessage, Kernel
} from '@jupyterlab/services';

import {
  JSONValue
} from '@phosphor/coreutils';

import {
  Panel, SplitPanel, Widget
} from '@phosphor/widgets';

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
class ThreadView extends VDomRenderer<KernelSpyModel> {
  constructor(model: KernelSpyModel) {
    super();
    this.model = model;
    this.id = `kernelspy-threadnav-${model.kernel.id}`;
  }

  /**
   * Render the extension discovery view using the virtual DOM.
   */
  protected render(): React.ReactElement<any>[] {
    const model = this.model!;
    // Show thread navigator
    return [
      <ThreadNavigator threads={model.tree} key="thread-navigator"/>
    ];
  }

}


/**
 * The main view for the kernel spy.
 */
export
class MessageLogView extends VDomRenderer<KernelSpyModel> {
  constructor(model: KernelSpyModel) {
    super();
    this.model = model;
    this.id = `kernelspy-messagelog-${model.kernel.id}`;
  }

  /**
   * Render the extension discovery view using the virtual DOM.
   */
  protected render(): React.ReactElement<any>[] {
    const model = this.model!;
    const messages = [];
    for (let msg of model.log) {
      messages.push(
        <Message message={msg} key={`message-${msg.header.msg_id}`} />
      );
    }
    return [
      <div key="message-log" className="jp-kernelspy-messagelog">
        {...messages}
      </div>
    ];
  }
}


/**
 * The main view for the kernel spy.
 */
export
class KernelSpyView extends Panel {
  constructor(kernel: Kernel.IKernelConnection) {
    super();
    this._model = new KernelSpyModel(kernel);
    this.addClass('jp-kernelspy-view');
    this.id = `kernelspy-${kernel.id}`;
    this.title.label = 'Kernel spy';
    this.title.closable = true;
    this.title.icon = '';

    this._toolbar = new Toolbar();
    this._toolbar.addClass('jp-kernelspy-toolbar');
    let threads = new ToolbarButton({onClick: () => this.onToggleThreaded()})
    this._toolbar.addItem('Threaded', threads);

    this._content = new SplitPanel();
    this._content.addClass('jp-kernelspy-content');

    this._threads = new ThreadView(this._model);
    this._messagelog = new MessageLogView(this._model);

    this._content.addWidget(this._threads);
    this._content.addWidget(this._messagelog);

    this.addWidget(this._toolbar);
    this.addWidget(this._content);


  }

  get model(): KernelSpyModel {
    return this._model;
  }

  protected onToggleThreaded() {
    this.showThreads = !this.showThreads;
    this._threads.hide();
  }

  private _toolbar: Toolbar<Widget>;
  private _content: SplitPanel;
  private _threads: VDomRenderer<KernelSpyModel>;
  private _messagelog: VDomRenderer<KernelSpyModel>;

  protected showThreads: boolean = false;

  private _model: KernelSpyModel;

}
