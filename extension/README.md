# Debug Visualizer (Preview)

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

Provides infrastructure to visualize values while debugging.

This extension is still in development. Some VS Code APIs are still missing for the best experience.

![](docs/demo.gif)

## Usage

Install this extension and the extension `Node Debug With Pause Events`
which is required for technical reasons for now.
Then use a debug configuration like this:

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"type": "node2-with-pause-event",
			"request": "launch",
			"name": "Launch Program",
			"program": "${workspaceFolder}\\dist\\index.js",
			"outFiles": ["${workspaceFolder}/dist/**/*.js"],
			"preLaunchTask": "npm: dev"
		}
	]
}
```

Use the command `Open a new Debug Visualizer View` to open a new visualizer view.
There you can enter an expression that is visualized when debugging your application.

## Integrated Visualizers

Visualizers present preprocessed data.
They are mostly React-Components and live in the webview.

These visualizers are integrated:

-   Tree Viewer

![](./docs/tree-viewer.png)

-   Svg Viewer
-   Dot Graph Viewer
-   Graph Viewer

![](./docs/graph-viewer.png)

-   Text Viewer
    -   Plain Text
    -   Monaco

## Integrated Data Extractors

Data extractors convert arbitrary values into visualizable data.
They live in the debugee.

These visualizers are integrated:

-   ToString Text Extractor
-   TypeScript Ast to Tree Data
    -   Direct Visualization of `ts.Node`s
    -   Visualization of `Record<string, ts.Node>` and `[ts.Node]`. If the record contains a key `fn`, its value is displayed for each node.

![](./docs/ast-viewer.png)

-   As Is Data Extractor. Allows to return data directly.

## Limitations

Currently, only JavaScript (and thus TypeScript) values can be visualized and only a few visualizations are supported.

# See Also

This extension works very well together with my library [`@hediet/node-reload`](https://github.com/hediet/node-reload):

![](./docs/demo-hot.gif)
