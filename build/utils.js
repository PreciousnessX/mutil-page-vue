'use strict'
const path = require('path')
const config = require('../config')

//这个plugin的作用是将打包后生成的css文件通过link的方式引入到html中，如果不适用这个插件css代码会
//放到head标签的style中
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const packageConfig = require('../package.json')

//process.env.NODE_ENV是一个环境变量，它是由webpack.dev/prod.conf.js这两个文件声明的;
//这里的意思是判断当前是否是开发环境，如果是就把config下index.js文件中build.assetsSubDirectory或
//dev.assetsSubDirectory的值赋给assetsSubDirectory 
exports.assetsPath = function (_path) {
  const assetsSubDirectory = process.env.NODE_ENV === 'production'
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory
  
//path.posix.join是path.join的一种兼容性写法，它的作用是路径的拼接，这里返回的是"static/_path"
  return path.posix.join(assetsSubDirectory, _path)
}

//cssLoaders的作用是导出一个供vue-loader的options使用的一个配置;
/** cssLoaders方法根据传进来的参数(options) 是否有extract属性来返回不同的值，
 * 如果你看了后面的代码你就会知道在生产模式下extract属性为true， 开发模式下为false。
 *  也就是说， 在生产模式下返回的是一个类似于这样的数组：
 *ExtractTextPlugin.extract({
 *   use: ["css-loader", "less-loader", "sass-loader"...],
 *   fallback: 'vue-style-loader'
 * })
 *
 * 而在开发模式下， cssLoaders返回的是：
 *["vue-style-loader", "css-loader", "less-loader", "sass-loader"...]
 */
exports.cssLoaders = function (options) {
  options = options || {}

  const cssLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

  const postcssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: options.sourceMap
    }
  }

 // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]

    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }

    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (options.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        fallback: 'vue-style-loader'
      })
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    less: generateLoaders('less'),
    sass: generateLoaders('sass', { indentedSyntax: true }),
    scss: generateLoaders('sass'),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus')
  }
}

 // Generate loaders for standalone style files (outside of .vue)
 // styleLoaders是用来给webpack提供所有和css相关的loader的配置，它也使用了cssLoaders()方法;
 /**
  * styleLoaders方法返回的值就简单了， 它返回的就是webpack中module里常用的配置格式：
  *[{
  *   test: /\.css$/,
  *   use: ['style-loader', 'css-loader']
  *  }，
  * ...
  * ]
  */
exports.styleLoaders = function (options) {
  const output = []
  const loaders = exports.cssLoaders(options)

  for (const extension in loaders) {
    const loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }

  return output
}

//'node-notifier'是一个跨平台系统通知的页面，当遇到错误时，它能用系统原生的推送方式给你推送信息
exports.createNotifierCallback = () => {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') return

    const error = errors[0]
    const filename = error.file && error.file.split('!').pop()

    notifier.notify({ // 直接在window平台推送消息 
      title: packageConfig.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}

/******************************定义两个函数,自动化配置多入口********************************/

// glob是webpack安装时依赖的一个第三方模块，还模块允许你使用 *等符号, 
// 例如lib/*.js就是获取lib文件夹下的所有js后缀名的文件
var glob = require('glob')
// 页面模板
var HtmlWebpackPlugin = require('html-webpack-plugin')
// 取得相应的页面路径，因为之前的配置，所以是src文件夹下的pages文件夹
var PAGE_PATH = path.resolve(__dirname, '../src/pages')
// 用于做相应的merge处理
var merge = require('webpack-merge')

// 多入口配置
// 通过glob模块读取pages文件夹下的所有对应文件夹下的js后缀文件，如果该文件存在
// 那么就作为入口处理
exports.entries = function () {
  var entryFiles = glob.sync(PAGE_PATH + '/*/*.js')
  var map = {}
  entryFiles.forEach((filePath) => {
    var filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.')) // 获取文件名
    map[filename] = filePath
  })
  console.log(map)
  return map // 返回一个对象,作为入口
}

//多页面输出配置
// 与上面的多页面入口配置相同，读取pages文件夹下的对应的html后缀文件，然后放入数组中
exports.htmlPlugin = function () {
  let entryHtml = glob.sync(PAGE_PATH + '/*/*.html')
  let arr = []
  entryHtml.forEach((filePath) => {
    let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
    let conf = {
      // 模板来源
      template: filePath,
      // 文件名称
      filename: filename + '.html',
      // 页面模板需要加对应的js脚本，如果不加这行则每个页面都会引入所有的js脚本
      chunks: ['manifest', 'vendor', filename],
      inject: true
    }
    if (process.env.NODE_ENV === 'production') { // 生产环境中的配置有所不同,miniy?......
      conf = merge(conf, {
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
        chunksSortMode: 'dependency'
      })
    }
    arr.push(new HtmlWebpackPlugin(conf))
  })
  console.log(arr)
  return arr // 返回一个数组  数组里面是实例化的 生成html文件的插件(因为是多页面应用,一个html是一个单页面)
}

/******************************结束:<定义两个函数,自动化配置多入口>********************************/
