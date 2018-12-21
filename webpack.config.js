var FS = require('fs');
var Path = require('path');
var Webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var DefinePlugin = Webpack.DefinePlugin;
var SourceMapDevToolPlugin = Webpack.SourceMapDevToolPlugin;
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var event = process.env.npm_lifecycle_event;

module.exports = {
    context: Path.resolve('./src'),
    entry: './main',
    output: {
        path: Path.resolve('./www'),
        filename: 'front-end.js',
    },
    resolve: {
        extensions: [ '.js', '.jsx' ],
        modules: [ Path.resolve('./src'), Path.resolve('./node_modules') ]
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: [
                        'env',
                        'react',
                        'stage-0',
                    ],
                    plugins: [
                        'syntax-async-functions',
                        'syntax-class-properties',
                        'transform-regenerator',
                        'transform-runtime',
                    ]
                }
            },
            {
                test: /\.(jpeg|jpg|png|gif|mp4)$/,
                loader: 'file-loader',
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ]
            },
        ]
    },
    plugins: [
        new SourceMapDevToolPlugin({
            filename: '[file].map',
        }),
        new HtmlWebpackPlugin({
            template: Path.resolve(`./src/index.html`),
            filename: Path.resolve(`./www/index.html`),
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: (event === 'build') ? 'static' : 'disabled',
            reportFilename: `report.html`,
        }),
    ],
    devtool: (event === 'build') ? false : 'inline-source-map',
    devServer: {
        inline: true,
    }
};

if (event === 'build') {
    console.log('Optimizing JS code');

    // set NODE_ENV to production
    var plugins = module.exports.plugins;
    var constants = {
        'process.env.NODE_ENV': '"production"',
    };
    plugins.unshift(new DefinePlugin(constants));

    // use Uglify to remove dead-code
    plugins.unshift(new UglifyJSPlugin({
        uglifyOptions: {
            compress: {
                drop_console: true,
            }
        }
    }));
}

// copy webpack.resolve.js into webpack.debug.js to resolve Babel presets
// and plugins to absolute paths, required when linked modules are used
if (FS.existsSync('./webpack.debug.js')) {
    require('./webpack.debug.js')(module.exports);
}
