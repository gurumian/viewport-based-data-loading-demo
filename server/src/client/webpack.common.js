const path = require('path');
const webpack = require('webpack');
const copyFiles = require('copy-webpack-plugin');

module.exports = {
  entry: './src/client/client.ts',
  target: ["web"],
  module: {
    rules: [
      {
        test: require.resolve('janus-gateway'),
        loader: 'exports-loader',
        options: {
          exports: 'Janus',
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [{
          loader: 'style-loader'
        },
        {
          loader: 'css-loader'
        }
        ]
      },
      {
        test: /\.(svg|ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [{
          loader: 'file-loader'
        }]
      },
      {
        test: /.(sass|scss)$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ]
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [{
          loader: 'file-loader'
        }]
      }
    ],
  },
  plugins: [
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
    new webpack.ProvidePlugin({
      adapter: ['webrtc-adapter', 'default']
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new copyFiles({
      patterns: [
        { from: './public/css', to: 'css' },
        { from: './public/images', to: 'images' },
        { from: './public/fonts', to: 'fonts' },
        { from: './public/favicon.ico', to: 'favicon.ico' },
        { from: './public/index.html', to: 'index.html' },
        { from: './public/sub.html', to: 'sub.html' }
      ]
    })
  ],
  resolve: {
    alias: {
      // three: path.resolve('./node_modules/three'),
      'react-native-fs': false
    },
    extensions: ['.tsx', '.ts', '.js'],
    // fallback: {
    //     "stream": false,
    //     "crypto": false,
    //     "dgram": false,
    // },
    // extensions: [ '.ts', '.js' ],
    fallback: {
      // "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "fs": false
      // "zlib": require.resolve("browserify-zlib"),
      // "https": require.resolve("https-browserify"),
      // "http": require.resolve("stream-http")

    }
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../../dist/client/'),
    libraryTarget: 'umd',
    // library: 'randomchatlib',
    // globalObject: 'this'
  }
};
