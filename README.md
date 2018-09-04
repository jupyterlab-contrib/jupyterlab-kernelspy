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
