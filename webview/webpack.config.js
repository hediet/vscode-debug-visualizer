var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var r = file => path.resolve(__dirname, file[0]);

module.exports = {
	entry: [ r`src/index.tsx` ],
	output: {
		path: r`dist`,
		filename: "[name]-[hash].js",
		chunkFilename: "[name]-[hash].js"
	},
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
	},
	devtool: 'source-map',
	module: {
		rules: [
			{ test: /\.css$/, loader: "style-loader!css-loader" },
			{ test: /\.scss$/, loader: "style-loader!css-loader!sass-loader" },
			{ test: /\.(jpe?g|png|gif)$/i, loader: "file-loader" },
			{ 
				test: /\.tsx?$/, loader: 'ts-loader',
				options: { transpileOnly: true }
			}
		]
	},
	plugins: [
		// generates an index.html
		new HtmlWebpackPlugin()
	]
};