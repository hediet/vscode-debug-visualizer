import * as webpack from "webpack";
import path = require("path");
import HtmlWebpackPlugin = require("html-webpack-plugin");
import MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
import ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { EnabledVisualizers } from "@hediet/visualization";

const r = (file: string) => path.resolve(__dirname, file);

const mode = process.argv.some(v => v === "--fast") ? "fast" : "default";

const enabledVisualizers: EnabledVisualizers =
	mode === "fast"
		? {
				VisJsGraphVisualizer: true,
				TreeVisualizer: false,
				GraphvizGraphVisualizer: false,
				SvgVisualizer: false,
				GraphvizDotVisualizer: false,
				TextVisualizer: false,
				PlotlyVisualizer: false,
				GridVisualizer: false,
				MonacoTextVisualizer: false,
				AstVisualizer: false,
		  }
		: {
				VisJsGraphVisualizer: true,
				TreeVisualizer: true,
				GraphvizGraphVisualizer: true,
				SvgVisualizer: true,
				GraphvizDotVisualizer: true,
				TextVisualizer: true,
				PlotlyVisualizer: true,
				GridVisualizer: true,
				MonacoTextVisualizer: true,
				AstVisualizer: true,
		  };

const stringifiedEnabledVisualizers: Record<string, string> = {};
for (const [key, val] of Object.entries(enabledVisualizers)) {
	stringifiedEnabledVisualizers[key] = JSON.stringify(val);
}

module.exports = {
	entry: [r("src/index.tsx")],
	output: {
		path: r("dist"),
		filename: "[name].js",
		chunkFilename: "[name]-[hash].js",
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
	},
	devtool: "eval", // "source-map",
	module: {
		rules: [
			{ test: /\.css$/, loader: "style-loader!css-loader" },
			{ test: /\.scss$/, loader: "style-loader!css-loader!sass-loader" },
			{
				test: /\.(jpe?g|png|gif|eot|ttf|svg|woff|woff2|md)$/i,
				loader: "file-loader",
			},
			{
				test: /\.tsx?$/,
				loader: "ts-loader",
				options: { transpileOnly: true },
			},
		],
	},
	node: {
		fs: "empty",
	},
	plugins: (() => {
		const plugins: any[] = [
			new HtmlWebpackPlugin({
				title: "Debug Visualizer",
			}),
			new ForkTsCheckerWebpackPlugin(),
			new CleanWebpackPlugin(),
			new webpack.DefinePlugin({
				ENABLED_VISUALIZERS: stringifiedEnabledVisualizers,
			}),
		];

		plugins.push(
			new MonacoWebpackPlugin({
				// Add more languages here once webworker issues are solved.
				languages: ["typescript"],
			})
		);

		return plugins;
	})(),
} as webpack.Configuration;
