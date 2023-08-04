import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the jupyterlab-kernelspy extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-kernelspy:plugin',
  description:
    'A Jupyter Lab extension for inspecting messages to/from a kernel',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension jupyterlab-kernelspy is activated!');
  }
};

export default plugin;
