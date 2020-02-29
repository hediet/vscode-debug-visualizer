# VS Code Debug Visualizer

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

See [here](./extension/README.md) for the readme of the extension.
You can get the extension in the [marketplace](https://marketplace.visualstudio.com/items?itemName=hediet.debug-visualizer).

![](./docs/doubly-linked-list-reverse-demo.gif)

This readme extends the [readme](./extension/README.md) of the extension with implementation details.

## Build Instructions

-   Clone the repository
-   Run `yarn` in the repository root
-   Run `yarn build`

## Dev Instructions

This project uses yarn workspaces and consists of the sub-projects _data-extraction_, _extension_ and _webview_.
To setup a dev environment, follow these steps:

-   Clone the repository
-   Run `yarn` in the repository root
-   Run `yarn build` initially (or `yarn dev` for every sub-project)
-   Run `yarn dev` for the sub-project (i.e. in its folder) you are working on.

For the _webview_ project, `yarn dev` will serve the react application on port 8080.
Certain query parameters need to be so that the UI can connect to the debug visualizer extension.

You can use VS Code to launch and debug the extension.
Chose the preconfigured `Run Extension (Dev UI)` as debug configuration
so that the extension loads the UI from the webpack server.
Otherwise, the extension will start a webserver on its own, hosting the `dist` folder of the _webview_ project.

## Publish Instructions

-   Follow the Build Instructions
-   `cd extension`
-   `yarn pub`

## Architecture

![](./docs/exported/main/Main.png)

### webview

Provides the UI and is hosted inside a webview in VS Code.

### extension

Creates the webview in VS Code, hosts a webserver and a websocket server.
The webserver serves the _webview_ project that is loaded by the webview.
After the webview is loaded, it connects to the websocket server.
The websocket server is used to evaluate expressions and is secured by a random token.

### data-extraction

Provides types and a JS runtime for data extraction.
