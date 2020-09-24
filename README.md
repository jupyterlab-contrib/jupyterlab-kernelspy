# jupyterlab-kernelspy

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/vidartf/jupyterlab-kernelspy/master?urlpath=%2Flab)

A JupyterLab extension for inspecting messages to/from a kernel.

![screenshot](screenshot.png)

## Prerequisites

* JupyterLab

## Installation

```bash
pip install jupyterlab-kernelspy
```

## Update

From JupyterLab 3.0 onwards, extensions are distributed as Python packages. Use the same Python
package manager you used to install the extension to update it.

For JupyterLab 0.34 - 2.2.x, you can update the extension to the latest compatible version with:

```bash
jupyter labextension update jupyterlab-kernelspy
```

## Usage

Once the extension is installed, it should add a button to your notebook toolbar (a yellow `{:}` icon).
Click this button to open a log view for that notebook.

## Contributing

### Development

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-kernelspy directory (python package dir)
# Install the package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

### Uninstall

```bash
pip uninstall jupyterlab-kernelspy
jupyter labextension uninstall jupyterlab-kernelspy
```
