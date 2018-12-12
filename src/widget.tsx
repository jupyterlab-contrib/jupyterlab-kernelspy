'use strict';

import * as React from 'react';

import {
  VDomRenderer, Toolbar, ToolbarButton
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
  Message as PhosphorMessage
} from '@phosphor/messaging';

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

  ARROW_COLOR: 'var(--jp-content-font-color2)',
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
      key={`node-label`}
      name={name}
      data={data}
      isNonenumerable={isNonenumerable}
    />;
  }
  const msg = data as any as KernelMessage.IMessage;
  return (
    <span key={`node-label`}>
      {msg.header.msg_id}
    </span>
  );
}

function Message(props: Message.IProperties): React.ReactElement<any>[] {
  const msg = props.message;
  const msgId = msg.header.msg_id;
  const threadStateClass = props.collapsed ?
    'jp-mod-collapsed' : '';
  const hasChildrenClass = props.hasChildren ?
    'jp-mod-children' : '';
  const tabIndex = props.hasChildren ? 0 : -1;
  return [
    <div
      key={`threadnode-${msgId}`}
      className='jp-kernelspy-threadnode'
      onClick={() => { props.onCollapse(props.message); }}
    >
      <div style={{paddingLeft: 16 * props.depth}}>
        <button
          className={
            `jp-kernelspy-threadcollapser ${threadStateClass} ${hasChildrenClass}`
          }
          tabIndex={tabIndex}
        >
        </button>
        <span className='jp-kernelspy-threadlabel'>
          {msg.channel}.{msg.header.msg_type}
        </span>
      </div>
    </div>,
    <div key={`message-${msgId}`} className='jp-kernelspy-message'>
      <ObjectInspector data={msg} theme={theme} nodeRenderer={msgNodeRenderer}/>
    </div>
  ];
}

namespace Message {
  export interface IProperties {
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
export class MessageLogView extends VDomRenderer<KernelSpyModel> {
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

    elements.push(
      <span key='header-thread' className='jp-kernelspy-logheader'>Threads</span>,
      <span key='header-contents' className='jp-kernelspy-logheader'>Contents</span>,
      <span key='header-divider' className='jp-kernelspy-logheader jp-kernelspy-divider' />,
    );

    let threads = new ThreadIterator(model.tree, this.collapsed);

    let first = true;
    each(threads, ({args, hasChildren}) => {
      const depth = model.depth(args);
      if (depth === 0) {
        if (first) {
          first = false;
        } else {
          // Insert spacer between main threads
          elements.push(<span
            key={`'divider-${args.msg.header.msg_id}`}
            className='jp-kernelspy-divider'
          />);
        }
      }
      const collapsed = this.collapsed[args.msg.header.msg_id];
      elements.push(...Message({
        message: args.msg,
        depth,
        collapsed,
        hasChildren,
        onCollapse: (message) => { this.onCollapse(message); },
      }));
    });
    return elements;
  }

  collapseAll() {
    for (let args of this.model!.log) {
      this.collapsed[args.msg.header.msg_id] = true;
    }
    this.update();
  }

  expandAll() {
    this.collapsed = {};
    this.update();
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
export class KernelSpyView extends Widget {
  constructor(kernel: Kernel.IKernel) {
    super();
    this._model = new KernelSpyModel(kernel);
    this.addClass('jp-kernelspy-view');
    this.id = `kernelspy-${kernel.id}`;
    this.title.label = 'Kernel spy';
    this.title.closable = true;
    this.title.iconClass = 'jp-kernelspyIcon';

    let layout = this.layout = new BoxLayout();

    this._toolbar = new Toolbar();
    this._toolbar.addClass('jp-kernelspy-toolbar');

    this._messagelog = new MessageLogView(this._model);

    layout.addWidget(this._toolbar);
    layout.addWidget(this._messagelog);

    BoxLayout.setStretch(this._toolbar, 0);
    BoxLayout.setStretch(this._messagelog, 1);

    this.collapseAllButton = new ToolbarButton({
      onClick: () => {
        this._messagelog.collapseAll();
      },
      className: 'jp-kernelspy-collapseAll',
      iconClassName: 'jp-kernelspy-collapseIcon jp-Icon jp-Icon-16',
      tooltip: 'Collapse all threads',
    });
    this._toolbar.addItem('collapse-all', this.collapseAllButton);

    this.expandAllButton = new ToolbarButton({
      onClick: () => {
        this._messagelog.expandAll();
      },
      className: 'jp-kernelspy-expandAll',
      iconClassName: 'jp-kernelspy-expandIcon jp-Icon jp-Icon-16',
      tooltip: 'Expand all threads'
    });
    this._toolbar.addItem('expand-all', this.expandAllButton);
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: PhosphorMessage): void {
    if (!this.node.contains(document.activeElement)) {
      this.collapseAllButton.node.focus();
    }
  }

  get model(): KernelSpyModel {
    return this._model;
  }

  private _toolbar: Toolbar<Widget>;
  private _messagelog: MessageLogView;

  private _model: KernelSpyModel;

  protected expandAllButton: ToolbarButton;
  protected collapseAllButton: ToolbarButton;

}
