# jupyterlab-kernelspy

An extension for inspecting messages to/from a kernel in Jupyter Lab.

![screenshot](screenshot.png)

## Prerequisites

* JupyterLab

## Installation

```bash
jupyter labextension install jupyterlab-kernelspy
```

## Update

From JupyterLab 0.34 onwards, you can update the extension to the latest compatible version with:

```bash
jupyter labextension update jupyterlab-kernelspy
```

## Usage

Once the extension is installed, it should add a button to your notebook toolbar (a yellow `{:}` icon).
Click this button to open a log view for that notebook.


## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension install .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```
