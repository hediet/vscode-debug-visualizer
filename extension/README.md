# Debug Visualizer

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

A VS Code extension for visualizing data structures while debugging.
Like the VS Code's watch view, but with rich visualizations of the watched value.

![](../docs/demo.gif)

## [Visualization Playground](https://hediet.github.io/visualization/)

Click [here](https://hediet.github.io/visualization/) to explore all available visualizations.

## Supported Languages

See [demos](../demos/) for demos. These languages and debuggers are verified to work with this extension:

-   JavaScript/TypeScript/... using `node`/`node2`/`extensionHost`/`chrome`/`pwa-chrome`/`pwa-node` debug adapter: [⭐ Full Support](../demos/js)
-   Go using `go` (Delve) debug adapter: [✅ Rudimentary Support](../demos/golang)
-   Python using `python` debug adapter: [✅ Rudimentary Support](../demos/python)
-   C# using `coreclr` debug adapter: [✅ Rudimentary Support](../demos/csharp) (work in progress for Full Support)
-   PHP using `php` debug adapter: [✅ Rudimentary Support](../demos/php)
-   Java using `java` debug adapter: [✅ Rudimentary Support](../demos/java)
-   C++ using `cppdbg` debug adapter: [✅ Rudimentary Support](../demos/cpp)
-   Swift using `lldb` debug adapter: [✅ Rudimentary Support](../demos/swift)
-   Rust using `lldb` debug adapter: [✅ Rudimentary Support](../demos/rust)

All other languages and debuggers might work too.
For languages with _Rudimentary Support_, only JSON strings can be visualized - you must implement some logic that builds this JSON for your data structure!
Fully supported languages offer _Data Extractors_ which convert some well known data structures to json.

## Usage

After installing this extension, use the command `Debug Visualizer: New View` to open a new visualizer view.
In this view you can enter an expression that is evaluated and visualized while stepping through your application.
This view works the same as the watch view of VS Code, except that the resulting value is presented visually rather than textually and you can only watch one expression (but you can still open multiple windows).

Use the command `Debug Visualizer: Use Selection as Expression` _(Shift + F1)_ to use the currently selected text as expression
in the most recently opened debug visualizer.

## Supported Values

Not all values can be processed.
Visualizers consume specific JSON data. This extension uses [hediet/visualization](https://github.com/hediet/visualization), a generic visualization framework.
You can see in its [playground](https://hediet.github.io/visualization/) which data can be visualized and how the visualization looks like.

The currently watched expression should evaluate to a JSON Object string,
matching the [schema](https://hediet.github.io/visualization/docs/visualization-data-schema.json) of one of the supported visualizers. This JSON string may be surrounded by single or double quotation marks (or none at all) and must not be escaped.
A valid example is `"{ "kind": { "text": true }, "text": "some text\nmore text" }"`.
Use the watch window to see what an expression evaluates to. This extension simply interprets that result.

For some languages (TypeScript/JavaScript), runtime code is injected to support _Data Extractors_.
A Data Extractor lifts the requirement for the visualized value to be a JSON string
and acts as a bridge between custom data structures and the JSON data processed by the visualizers.
When multiple Data Extractors are applicable, a preferred one can be selected in the visualization view.

There is a [JSON Schema for all supported visualizations](https://hediet.github.io/visualization/docs/visualization-data-schema.json) and a [typescript declaration file](https://hediet.github.io/visualization/docs/visualization-data.ts).

## JavaScript/TypeScript Integrated Data Extractors

Data extractors convert arbitrary values into data consumable by visualizers.
They live in the debugee. The following data extractors are injected automatically into the debugee by this extension when using the `node`, `node2`, `extensionHost`, `chrome` or `pwa-chrome` debug adapter.
Custom data extractors can be registered too.
See the package `@hediet/debug-visualizer-data-extraction` and its [README](../data-extraction/README.md) for the implementation and its API.
Also, a global object of name `hedietDbgVis` with helper functions is injected.

-   **ToString**
    -   Just calls `.toString()` on values and treats the result as text.
-   **TypeScript AST**
    -   Direct Visualization of `ts.Node`s
    -   Visualization of `Record<string, ts.Node>` and `ts.Node[]`. If the record contains a key `fn`, its value is displayed for each node.
-   **As Is Data Extractor**
    -   Treats the data as direct input to the visualizer.
-   **Use Method 'getVisualizationData'**
    -   Calls `.getVisualizationData()` on values and treats the result as direct input to the visualizer.
-   **Plotly y-Values**
    -   Uses plotly to plot an array of numbers.
-   **Object Graph**
    -   Constructs a graph containing all objects reachable from object the expression evaluates to.
        Graph is constructed using a breadth search. Stops after 50 nodes.
-   **Array Grid**
    -   Creates Grid visualization data for an array.

## UI Features

-   **Multi-line Expressions**: Press `shift+enter` to add a new line and `ctrl+enter` to evaluate the expression.
    When only having a single line, `enter` submits the current expression,
    but when having multiple lines, `enter` inserts another line break.

    ![](../docs/multiline-expression.png)

## Configuration

This extension provides these configuration options:

-   `debugVisualizer.debugAdapterConfigurations`

    Allows to set expression templates for specific debug adapter types.
    Example:

    ```json
    "debugVisualizer.debugAdapterConfigurations": {
    	"lldb": {
    		"expressionTemplate": "script to_json(\"${expr}\")",
    		"context": "repl"
    	}
    }
    ```

    Configurations here overwrite the built-in support for the corresponding debug adapter type.

-   `debugVisualizer.useChromeKioskMode`

    Specifies whether to pop out Debug Visualization Views with Chrome in Kiosk Mode. Uses the default browser otherwise or if Chrome is not found. Defaults to `true`.

# See Also

This extension works very well together with my library [`@hediet/node-reload`](https://github.com/hediet/node-reload) for TypeScript/JavaScript.
Together, they provide an interactive playground.

![](../docs/demo-hot.gif)

# Contributing

Feel free to ping me on GitHub by opening an issue!
Having runtime infrastructures for languages other than JavaScript would be awesome and I happily accept PRs!
