const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = merge(common, {
    mode:'production',
    devtool: 'source-map',
    plugins: [
        new UglifyJSPlugin({
            sourceMap:true,
            uglifyOptions: {
                compress: {
                    warnings: false,
                    drop_debugger: true,
                    drop_console: true
                }
            }
        }),       
        new webpack.DefinePlugin({
             'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
});