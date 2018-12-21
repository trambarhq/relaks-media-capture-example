## package.json

This is the configuration file of [npm](https://docs.npmjs.com/cli/npm), a package manager used to manage third-party JavaScript libraries. It contains information about our package and a list of libraries it depends on. Running `npm install` install them.

The following are the libraries used and the reason behind their inclusion:

* **babel-core** - allows us to use advanced JavaScript features by translating them into older version of JavaScript compatible with existing browsers
* **babel-loader** - Babel-Webpack integration
* **babel-plugin-syntax-async-functions** - Babel plugin that permits the use of async/await syntax
* **babel-plugin-syntax-class-properties** - Babel plugin that permits properties to be set within class definition
* **babel-plugin-transform-regenerator** - dependency needed by babel-preset-stage-0
* **babel-plugin-transform-runtime** - dependency needed by babel-preset-stage-0
* **babel-preset-env** - Babel configuration preset
* **babel-preset-react** - Babel configuration preset for React JSX
* **babel-preset-stage-0** - Babel configuration preset for non-yet-standardized features 
* **css-loader** - for processing CSS files through WebPack
* **html-webpack-plugin** - used to stick a script tag into a HTML file (and that's it)
* **node-sass** - SASS processor
* **preact** - Preact library code
* **regenerator-runtime** - dependency needed by babel-preset-stage-0
* **relaks** - Relaks library code
* **sass-loader** - for processing SASS files through WebPack
* **style-loader** - for loading CSS stylesheet using JavaScript
* **uglifyjs-webpack-plugin** - optimizes JavaScript code to make it smaller and faster
* **webpack** - bundles everything together and handles loading at runtime
* **webpack-bundle-analyzer** - used to generates a nice map detailing the sizes of JavaScript modules
* **webpack-dev-server** - hosts a development version of the app, with instant updates

## webpack.config.js

This is the configuration file of [WebPack](https://webpack.js.org/). It describes how our example app is put together.

This line set the base folder to `./src`, using `Path.resolve()` to obtain an absolute path:
```javascript
    context: Path.resolve('./src'),
```

Indicates that `main.js` is the entry point of our app:
```javascript
    entry: './main',
```

Set the output folder to `./www` and the name of our app to `app.js`:
```javascript
    output: {
        path: Path.resolve('./www'),
        filename: 'app.js',
    },
```

Look for source files in `./src`, then `./node_modules` (third party libraries):
```javascript
    resolve: {
        extensions: [ '.js', '.jsx' ],
        modules: [ Path.resolve('./src'), Path.resolve('./node_modules') ]
    },
```

Configure Babel to process `.js` and `.jsx` files, employing necessary presets and plugins:
```javascript
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
```        

SASS stylesheets to CSS and load the results through WebPack:
```javascript
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ]
            },
```

Generate source-maps so we can debug our code:
```javascript
    plugins: [
        new SourceMapDevToolPlugin({
            filename: '[file].map',
        }),
```

Stick a script tag that loads our app (`app.js`) into `index.html` (yeah, that's it):
```javascript
        new HtmlWebpackPlugin({
            template: Path.resolve(`./src/index.html`),
            filename: Path.resolve(`./www/index.html`),
        }),
```

Generate a cool-looking map detailing the size of each JavaScript library, mainly so we know how large our app is after gzip compression:
```javascript    
        new BundleAnalyzerPlugin({
            analyzerMode: (event === 'build') ? 'static' : 'disabled',
            reportFilename: `report.html`,
        }),  
```

Don't generate source-maps when we're building for production environment:
```javascript
    devtool: (event === 'build') ? false : 'inline-source-map',
```    

Tell WebPack Dev Server to run in inline mode instead of utilizing an iframe:
```javascript
    devServer: {
        inline: true,
    }
```

When building for production environment, use the Define Plugin to replace all instances of `process.env.NODE_ENV` with `"production"`, so that expressions like `process.env.NODE_ENV !== 'production'` are false at compile time:

```javascript
    var plugins = module.exports.plugins;
    var constants = {
        'process.env.NODE_ENV': '"production"',
    };
    plugins.unshift(new DefinePlugin(constants));
```

Use UglifyJS to remove code that's would never run due to the always-false expressions created by the set-up above:

```javascript
    plugins.unshift(new UglifyJSPlugin({
        uglifyOptions: {
            compress: {
                drop_console: true,
            }
        }
    }));
```
