const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        // app: './src/index.js'//for project with ui
        app: './src/libs/AMRTViewer.js'//for SDK
        // app: './src/indexYuZong.js'//for SDK
    },
    output: {
        filename: "[name].[hash].js",
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /three\/examples\/js!libs\/extrajs/,//用于导入位于threejs模块目录下examples/js或位于libs/extrajs的本地额外的库文件(一般是按需修改过的依赖THREE的库，未修改统一使用threejs安装目录下的，这样可保持最新)
                use: 'imports-loader?THREE=three'
            },
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    resolve: {
        alias: {
            'three-examples': path.join(__dirname, './node_modules/three/examples/js'),//threejs模块目录下examples/js路径别名
            'extrajs':path.join(__dirname, './src/libs/extrajs')//本地额外库目录libs/extrajs的路径别名
        }
    },
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        inline:true,
        port:8000,
        hot: true
      },
    plugins: [
      new CleanWebpackPlugin(['dist'],{exclude: [ 'css', 'js', 'img', 'sound', 'u3d', 'iframe.html', 'index.html', 'fonts']}),
      new HtmlWebpackPlugin({
          template: __dirname + "/src/helishi.html"
      }),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.ProvidePlugin({
          THREE:'three'
      })
    ]
};