const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, './dist'),
    },
    hot: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PORT': JSON.stringify('30101')
    })
  ]
})