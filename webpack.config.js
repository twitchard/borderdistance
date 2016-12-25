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
            use: 'babel-loader',
            query: {
                presets: [
                    ['es2015', { modules: false }]
                ]
            }
        }, {
            test: /\.html$/,
            exclude: /node_modules/,
            use: 'svelte-loader'
        }]
    },
    devtool: 'inline-source-map'
}
