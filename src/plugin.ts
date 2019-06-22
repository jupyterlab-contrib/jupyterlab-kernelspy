'use strict';

import {
  JupyterFrontEndPlugin, JupyterFrontEnd
} from '@jupyterlab/application';

import {
  ICommandPalette, CommandToolbarButton
} from '@jupyterlab/apputils';

import {
  DocumentRegistry
} from '@jupyterlab/docregistry';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

import {
  INotebookModel, NotebookPanel, INotebookTracker
} from '@jupyterlab/notebook';

import {
  Kernel
} from '@jupyterlab/services';

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
const IKernelSpyExtension = new Token<IKernelSpyExtension>('jupyter.extensions.kernelspy');

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
    let buttons: CommandToolbarButton[] = [];
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
      let button = new CommandToolbarButton({id, commands: this.commands});
      button.addClass('jp-kernelspy-nbtoolbarbutton')
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
function addCommands(
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    palette: ICommandPalette,
    menu: IMainMenu
    ): void {
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
    iconClass: 'jp-Icon jp-Icon-16 jp-kernelspyIcon',
    isEnabled: hasKernel,
    execute: (args) => {
      let current = tracker.currentWidget;
      if (!current) {
        return;
      }
      const widget = new KernelSpyView(current.context.session.kernel! as Kernel.IKernel);
      shell.add(widget, 'main');
      if (args['activate'] !== false) {
        shell.activateById(widget.id);
      }
    }
  });

  palette.addItem({
    command: CommandIDs.newSpy,
    category: 'Kernel',
  });

  menu.kernelMenu.addGroup([
    { command: CommandIDs.newSpy },
  ]);
}



/**
 * Initialization data for the jupyterlab-kernelspy extension.
 */
const extension: JupyterFrontEndPlugin<IKernelSpyExtension> = {
  id: 'jupyterlab-kernelspy',
  autoStart: true,
  requires: [INotebookTracker, ICommandPalette, IMainMenu],
  provides: IKernelSpyExtension,
  activate: (
      app: JupyterFrontEnd,
      tracker: INotebookTracker,
      palette: ICommandPalette,
      mainMenu: IMainMenu,
      ) => {
    let {commands, docRegistry} = app;
    let extension = new KernelSpyExtension(commands);
    docRegistry.addWidgetExtension('Notebook', extension);

    // TODO: Recreate views from layout restorer

    addCommands(app, tracker, palette, mainMenu);
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
    return extension;
  }
};

export default extension;
