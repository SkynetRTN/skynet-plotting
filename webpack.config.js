const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
  ],
  /**
   * NEVER MIND. After going down an endless rabbit hole of Googling I finally figured this
   * junk out. See the `import` section of `index.js`. 
   */
  // // Can't figure out a way to use jQuery without using this plugin... :-(
  // plugins: [ new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery',}) ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
};