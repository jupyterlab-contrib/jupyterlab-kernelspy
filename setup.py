"""
jupyterlab-kernelspy setup
"""
import json
import os

from jupyter_packaging import (
    create_cmdclass, install_npm, ensure_targets,
    combine_commands,
)
import setuptools

HERE = os.path.abspath(os.path.dirname(__file__))

# The name of the project
name="jupyterlab-kernelspy"

# Get our version
with open(os.path.join(HERE, "package.json")) as pf:
    pdata = json.load(pf)
version = pdata['version']

lab_path = os.path.join(HERE, name, "static")

# Representative files that should exist after a successful build
jstargets = [
    os.path.join(HERE, "lib", "plugin.js"),
    os.path.join(HERE, name, "static", "package.json"),
]

package_data_spec = {
    name: [
        "*"
    ]
}

labext_name = "jupyterlab-kernelspy"

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, lab_path, "*.*"),
]

cmdclass = create_cmdclass("jsdeps",
    package_data_spec=package_data_spec,
    data_files_spec=data_files_spec
)

cmdclass["jsdeps"] = combine_commands(
    install_npm(HERE, build_cmd="build", npm=["jlpm"]),
    ensure_targets(jstargets),
)

with open("README.md", "r") as fh:
    long_description = fh.read()

setup_args = dict(
    name=name,
    version=version,
    url="https://github.com/vidartf/jupyterlab-kernelspy.git",
    author="Vidar Tonaas Fauske",
    description="A Jupyter Lab extension for inspecting messages to/from a kernel",
    long_description=long_description,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=[],  # do not dist package, only use the package for loca dev
    install_requires=[
        "jupyterlab~=3.0.0b6",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6",
    license="BSD-3-Clause",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab"],
    classifiers=[
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Framework :: Jupyter",
    ],
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
