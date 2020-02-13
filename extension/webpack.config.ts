import * as webpack from "webpack";
import path = require("path");
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import CopyPlugin = require("copy-webpack-plugin");

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
		new CopyPlugin([
			{
				from: r("../data-extraction/"),
				to: r("./dist/data-extraction/"),
				ignore: ["**/node_modules/**/*"],
			},
		]),
	],
} as webpack.Configuration;
