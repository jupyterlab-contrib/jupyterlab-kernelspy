'use strict'

import * as React from 'react';

import {
  MessageThread
} from './model';


class ThreadNode extends React.Component<ThreadNode.IProperties, ThreadNode.IState> {
  constructor(props: ThreadNode.IProperties) {
    super(props);
    this.state = {
      collapsed: false,
    };
  }

  render(): React.ReactElement<any> {
    const {thread, depth} = this.props;
    const {msg} = thread;
    const entries = [];
    const collapsedStateClass = this.state.collapsed ?
      'jp-mod-collapsed' : '';
    const collapser = this.state.collapsed ? '+' : '-';
    entries.push(
      <div key="label">
        <span className={`jp-kernelspy-threadcollapser ${collapsedStateClass}`} >
          {collapser}
        </span>
        <span className="jp-kernelspy-threadlabel">
          {msg.header.msg_type}: {msg.header.msg_id.slice(0, 6)}
        </span>
      </div>
    )
    if (!this.state.collapsed) {
      const children = [];
      for (let child of thread.children) {
        children.push(
          <ThreadNode
            thread={child}
            depth={depth + 1}
            key={`thread-${child.msg.header.msg_id}`}
          />
        );
      }
      entries.push(
        <ol className="jp-kernelspy-threadlist" key="threadlist">
          {...children}
        </ol>
      );
    }
    return (
      <li className='jp-kernelspy-threadnode'>
        {...entries}
      </li>
    );
  }
}

namespace ThreadNode {
  export
  interface IProperties {
    thread: MessageThread;
    depth: number;
  }

  export
  interface IState {
    collapsed: boolean;
  }
}


export
class ThreadNavigator extends React.Component<ThreadNavigator.IProperties, ThreadNavigator.IState> {
  constructor(props: ThreadNavigator.IProperties) {
    super(props);
    this.state = {
      collapsed: {},
    };
  }

  render(): React.ReactElement<any> {
    const children = [];
    for (let child of this.props.threads) {
      children.push(
        <ThreadNode
          thread={child}
          depth={0}
          key={`thread-${child.msg.header.msg_id}`}
        />
      );
    }
    return ( 
      <nav className="jp-kernelspy-threadnav">
        <ol className='jp-kernelspy-threadlist'>
          {...children}
        </ol>
      </nav>
    );
  }
}

export
namespace ThreadNavigator {
  export
  interface IProperties {
    threads: MessageThread[];
  }

  export
  interface IState {
    collapsed: { [key: string]: boolean; };
  }
}