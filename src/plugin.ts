'use strict';

import {
  JupyterLab, JupyterLabPlugin, ILayoutRestorer
} from '@jupyterlab/application';

import {
  Toolbar, ToolbarButton
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  INotebookModel, NotebookPanel, INotebookTracker
} from '@jupyterlab/notebook';

import {
  find
} from '@phosphor/algorithm';

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  Token
} from '@phosphor/coreutils';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  KernelSpyView
} from './widget';

import '../style/index.css';


/**
 * IDs of the commands added by this extension.
 */
namespace CommandIDs {
  export
  const newSpy = 'kernelspy:new';
}


/**
 * The token identifying the JupyterLab plugin.
 */
export
const IKernelSpyExtension = new Token<IKernelSpyExtension>('jupyter.extensions.nbdime');

export
type IKernelSpyExtension = DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>;


export
class KernelSpyExtension implements IKernelSpyExtension {
  /**
   *
   */
  constructor(commands: CommandRegistry) {
    this.commands = commands;
  }

  /**
   * Create a new extension object.
   */
  createNew(nb: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    // Add buttons to toolbar
    let buttons: ToolbarButton[] = [];
    let insertionPoint = -1;
    find(nb.toolbar.children(), (tbb, index) => {
      if (tbb.hasClass('jp-Notebook-toolbarCellType')) {
        insertionPoint = index;
        return true;
      }
      return false;
    });
    let i = 1;
    for (let id of [CommandIDs.newSpy]) {
      let button = Toolbar.createFromCommand(this.commands, id);
      if (button === null) {
        throw new Error('Cannot create button, command not registered!');
      }
      if (insertionPoint >= 0) {
        nb.toolbar.insertItem(insertionPoint + i++, this.commands.label(id), button);
      } else {
        nb.toolbar.addItem(this.commands.label(id), button);
      }
      buttons.push(button);
    }

    return new DisposableDelegate(() => {
      // Cleanup extension here
      for (let btn of buttons) {
        btn.dispose();
      }
    });
  }

  protected commands: CommandRegistry;
}


/**
 * Add the main file view commands to the application's command registry.
 */
function addCommands(app: JupyterLab, tracker: INotebookTracker): void {
  const { commands, shell } = app;

  /**
   * Whether there is an active notebook.
   */
  function hasKernel(): boolean {
    return (
      tracker.currentWidget !== null &&
      tracker.currentWidget.context.session.kernel !== null
    );
  }

  commands.addCommand(CommandIDs.newSpy, {
    label: 'New kernel spy',
    caption: 'Open a window to inspect messages sent to/from a kernel',
    iconClass: 'jp-kernelspyIcon',
    iconLabel: 'Spy',
    isEnabled: hasKernel,
    execute: (args) => {
      let current = tracker.currentWidget;
      if (!current) {
        return;
      }
      const widget = new KernelSpyView(current.context.session.kernel!);
      shell.addToMainArea(widget);
      if (args['activate'] !== false) {
        shell.activateById(widget.id);
      }
    }
  });

  // TODO: Also add to command palette
}



/**
 * Initialization data for the jupyterlab-kernelspy extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab-kernelspy',
  autoStart: true,
  requires: [ILayoutRestorer, INotebookTracker],
  provides: IKernelSpyExtension,
  activate: (app: JupyterLab, restorer: ILayoutRestorer, tracker: INotebookTracker) => {
    let {commands, docRegistry} = app;
    let extension = new KernelSpyExtension(commands);
    docRegistry.addWidgetExtension('Notebook', extension);

    // TODO: Recreate views from layout restorer

    addCommands(app, tracker);
    function refreshNewCommand() {
      commands.notifyCommandChanged(CommandIDs.newSpy);
    }
    // Update the command registry when the notebook state changes.
    tracker.currentChanged.connect(refreshNewCommand);

    let prevWidget: NotebookPanel | null = tracker.currentWidget;
    if (prevWidget) {
      prevWidget.context.session.kernelChanged.connect(refreshNewCommand);
    }
    tracker.currentChanged.connect((tracker) => {
      if (prevWidget) {
        prevWidget.context.session.kernelChanged.disconnect(refreshNewCommand);
      }
      prevWidget = tracker.currentWidget;
      if (prevWidget) {
        prevWidget.context.session.kernelChanged.connect(refreshNewCommand);
      }
    });
  }
};

export default extension;
