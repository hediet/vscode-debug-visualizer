import { CleanWebpackPlugin } from "clean-webpack-plugin";
import * as CopyPlugin from "copy-webpack-plugin";
import { readFileSync } from "fs";
import * as path from "path";
import * as webpack from "webpack";

const r = (file: string) => path.resolve(__dirname, file);

module.exports = {
	target: "node",
	entry: r("./src/extension"),
	output: {
		path: r("./dist"),
		filename: "extension.js",
		libraryTarget: "commonjs2",
		devtoolModuleFilenameTemplate: "../[resource-path]",
	},
	devtool: "source-map",
	externals: {
		vscode: "commonjs vscode",
		"@hediet/debug-visualizer-data-extraction":
			"@hediet/debug-visualizer-data-extraction",
		"debug-visualizer-webview": "debug-visualizer-webview",
		fsevents: "require('fsevents')",
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
		],
	},
	node: {
		__dirname: false,
	},
	plugins: [
		new CleanWebpackPlugin(),
		includeDependency(r("../data-extraction/")),
		includeDependency(r("../webview/")),
	],
} as webpack.Configuration;

function includeDependency(location: string) {
	const content = readFileSync(path.join(location, "package.json"), {
		encoding: "utf8",
	});
	const pkgName = JSON.parse(content).name;

	return new CopyPlugin({
		patterns: [
			{
				from: location,
				to: r(`./dist/node_modules/${pkgName}`),
				globOptions: {
					ignore: ["**/node_modules/**/*"],
				},
			},
		],
	});
}
