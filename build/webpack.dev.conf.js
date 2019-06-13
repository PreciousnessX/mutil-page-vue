'use strict'
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')

//一个负责拷贝资源的插件
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

//一个更友好的展示webpack错误提示的插件
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
//一个自动检索端口的包
const portfinder = require('portfinder')

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

console.log('执行开发环境的配置')
const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.dev.cssSourceMap,
      usePostCSS: true
    })
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  // devServer的配置 看文档就好了 
  devServer: {
    clientLogLevel: 'warning',
    historyApiFallback: {
      rewrites: [{
        from: /.*/,
        to: path.posix.join(config.dev.assetsPublicPath, 'index.html')
      }, ],
    },
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    overlay: config.dev.errorOverlay ?
      {
        warnings: false,
        errors: true
      } :
      false,
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.dev.poll,
    }
  },
  plugins: [
    //还记得之前说的生产环境和开发环境的变量在哪儿定义的吗？对，就是这里    
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
  /*************************************************************************注释掉for多页面 */
    
    // new HtmlWebpackPlugin({
    //   filename: 'index.html',
    //   template: 'index.html',
    //   inject: true
    // }),

     /*************************************************************************注释掉for多页面 */
    // copy custom static assets
    // 将static文件夹和里面的内容拷贝到开发模式下的路径,比如static下有个img文件夹，里面有张图片
    // 我们可以这样访问：localhost:8080/static/img/logo.png  
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '../static'),
      to: config.dev.assetsSubDirectory,
      ignore: ['.*']
    }])
  ].concat(utils.htmlPlugin()) // 多页面html模版
})

//这里主要是做端口的检索以及npm run dev后对错误的处理，我们可以看这里使用了前面引入的
//'friendly-errors-webpack-plugin'插件
module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => { // 这个工具会从basePort向上找,知道找到可用的port,在回调函数中处理可用的port
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors ?
          utils.createNotifierCallback() :
          undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})