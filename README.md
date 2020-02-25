# VS Code Debug Visualizer

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

See the [extension](extension) directory for the extension readme.
You can get the extension in the [marketplace](https://marketplace.visualstudio.com/items?itemName=hediet.debug-visualizer).

![](./docs/doubly-linked-list-reverse-demo.gif)

## Build Instructions

-   Clone the repository
-   Run `yarn` in the repository root
-   Run `yarn build`

## Dev Instructions

-   Clone the repository
-   Run `yarn` in the repository root
-   Run `yarn build` initially (or `yarn dev` for every project)
-   Run `yarn dev` **inside** the project you are working on.

For the UI, `yarn dev` will start a webserver that you can access on port 8080.
You can use VS Code do launch and debug the extension.
Chose `Run Extension (Dev UI)` as debug configuration so that the extension loads the UI from the webpack server.

## Publish Instructions

-   Follow the Build Instructions
-   `cd extension`
-   `yarn pub`
