module.exports = {
    entry: {
        'index': [ './src/index' ]
    },
    resolve: {
        extensions: [ '.js', '.html', '.json' ]
    },
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js',
    },
    module: {
        rules: [{
            test: /\.(html|js)$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        ['es2015', { modules: false }]
                    ]
                }
            }
        }, {
            test: /\.html$/,
            exclude: /node_modules/,
            use: {
                loader: 'svelte-loader'
            }
        }]
    },
    devtool: 'inline-source-map'
}
