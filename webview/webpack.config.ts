import { CleanWebpackPlugin } from "clean-webpack-plugin";
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import * as webpack from "webpack";
import ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
import MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const r = (file: string) => path.resolve(__dirname, file);

module.exports = {
	entry: [r("src/index.tsx")],
	output: {
		path: r("dist"),
		filename: "[name].js",
		chunkFilename: "[name]-[hash].js",
		devtoolModuleFilenameTemplate: (info: any) => {
			let result = info.absoluteResourcePath.replace(/\\/g, "/");
			if (!result.startsWith("file:")) {
				// Some paths already start with the file scheme.
				result = "file:///" + result;
			}
			return result;
		},
	},
	resolve: {
		extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.less$/,
				use: ["style-loader", "css-loader", "less-loader"],
			},
			{ test: /\.css$/, use: ["style-loader", "css-loader"] },
			{ test: /\.scss$/, use: ["style-loader", "css-loader", "sass-loader"] },
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
	/*node: {
		fs: "empty",
	},*/
	plugins: (() => {
		const plugins: any[] = [
			new HtmlWebpackPlugin({
				title: "Debug Visualizer",
			}),
			new ForkTsCheckerWebpackPlugin(),
			new CleanWebpackPlugin(),
			new webpack.DefinePlugin({
				"process.env": JSON.stringify(process.env),
			}),
			/*new MonacoWebpackPlugin({
				// Add more languages here once webworker issues are solved.
				languages: ["typescript"],
			}),*/
		];

		return plugins;
	})(),
} as webpack.Configuration;
