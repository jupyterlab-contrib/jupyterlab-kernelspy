'use strict'

import * as React from 'react';

import {
  VDomRenderer, Toolbar
} from '@jupyterlab/apputils';

import {
  KernelMessage, Kernel
} from '@jupyterlab/services';

import {
  each
} from '@phosphor/algorithm';

import {
  JSONValue
} from '@phosphor/coreutils';

import {
  Widget, BoxLayout
} from '@phosphor/widgets';

import {
  ObjectInspector, ObjectLabel
} from 'react-inspector';

import {
  KernelSpyModel, ThreadIterator
} from './model';


import '../style/index.css';


const theme = {
  BASE_FONT_FAMILY: 'var(--jp-code-font-family)',
  BASE_FONT_SIZE: 'var(--jp-code-font-size)',
  BASE_LINE_HEIGHT: 'var(--jp-code-line-height)',

  BASE_BACKGROUND_COLOR: 'var(--jp-layout-color0)',
  BASE_COLOR: 'var(--jp-content-font-color1)',

  OBJECT_NAME_COLOR: 'var(--jp-mirror-editor-attribute-color)',
  OBJECT_VALUE_NULL_COLOR: 'var(--jp-mirror-editor-builtin-color)',
  OBJECT_VALUE_UNDEFINED_COLOR: 'var(--jp-mirror-editor-builtin-color)',
  OBJECT_VALUE_REGEXP_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_STRING_COLOR: 'var(--jp-mirror-editor-string-color)',
  OBJECT_VALUE_SYMBOL_COLOR: 'var(--jp-mirror-editor-operator-color)',
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
    return <ObjectLabel
      name={name}
      depth={depth+1}
      data={data}
      isNonenumerable={isNonenumerable}
    />;
  }
  const msg = data as any as KernelMessage.IMessage;
  return (
    <span>
      {msg.header.msg_id}
    </span>
  );
}

function Message(props: Message.IProperties): React.ReactElement<any>[] {
  const msg = props.message;
  const msg_id = msg.header.msg_id;
  const threadStateClass = props.collapsed ?
    'jp-mod-collapsed' : '';
  const threadCollapser = props.hasChildren ? props.collapsed ? '+ ' : '- ' : '';
  return [
    <div
      key={`threadnode-${msg_id}`}
      className='jp-kernelspy-threadnode' 
      onClick={() => { props.onCollapse(props.message); }}
    >
      <div style={{paddingLeft: 16 * props.depth}}>
        <span className={`jp-kernelspy-threadcollapser ${threadStateClass}`}>
          {threadCollapser}
        </span>
        <span className="jp-kernelspy-threadlabel">
          {msg.channel}.{msg.header.msg_type}
        </span>
      </div>
    </div>,
    <div key={`message-${msg_id}`} className='jp-kernelspy-message'>
      <ObjectInspector data={msg} theme={theme} nodeRenderer={msgNodeRenderer}/>
    </div>
  ];
}

namespace Message {
  export
  interface IProperties {
    message: KernelMessage.IMessage;
    depth: number;
    collapsed: boolean;
    hasChildren: boolean;
    onCollapse: (message: KernelMessage.IMessage) => void;
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
    this.addClass('jp-kernelspy-messagelog');
  }

  /**
   * Render the extension discovery view using the virtual DOM.
   */
  protected render(): React.ReactElement<any>[] {
    const model = this.model!;
    const elements: React.ReactElement<any>[] = [];
    
    let threads = new ThreadIterator(model.tree, this.collapsed)

    each(threads, ({msg, hasChildren}) => {
      const depth = model.depth(msg);
      const collapsed = this.collapsed[msg.header.msg_id];
      elements.push(...Message({
        message: msg,
        depth,
        collapsed,
        hasChildren,
        onCollapse: (message) => { this.onCollapse(message)}
      }));
    });
    return elements;
  }

  onCollapse(msg: KernelMessage.IMessage) {
    const id = msg.header.msg_id;
    this.collapsed[id] = !this.collapsed[id];
    this.update();
  }

  protected collapsed: {[key: string]: boolean} = {};
}


/**
 * The main view for the kernel spy.
 */
export
class KernelSpyView extends Widget {
  constructor(kernel: Kernel.IKernelConnection) {
    super();
    this._model = new KernelSpyModel(kernel);
    this.addClass('jp-kernelspy-view');
    this.id = `kernelspy-${kernel.id}`;
    this.title.label = 'Kernel spy';
    this.title.closable = true;
    this.title.icon = '';
    
    let layout = this.layout = new BoxLayout();

    this._toolbar = new Toolbar();
    this._toolbar.addClass('jp-kernelspy-toolbar');

    this._messagelog = new MessageLogView(this._model);

    layout.addWidget(this._toolbar);
    layout.addWidget(this._messagelog);

    BoxLayout.setStretch(this._toolbar, 0);
    BoxLayout.setStretch(this._messagelog, 1);
  }

  get model(): KernelSpyModel {
    return this._model;
  }

  private _toolbar: Toolbar<Widget>;
  private _messagelog: VDomRenderer<KernelSpyModel>;

  private _model: KernelSpyModel;

}
