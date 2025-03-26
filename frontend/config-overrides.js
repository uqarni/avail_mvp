const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "process": require.resolve("process/browser"),
    "zlib": require.resolve("browserify-zlib"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "url": require.resolve("url"),
    "assert": require.resolve("assert"),
    "timers": require.resolve("timers-browserify"),
    "path": false,
    "fs": false,
    "crypto": require.resolve("crypto-browserify")
  };

  // Add plugins to provide Node.js core modules
  const plugins = config.plugins || [];
  
  plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  );

  // Add process and buffer to resolve extensions
  plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /node:.*/, (resource) => {
        const mod = resource.request.replace(/^node:/, '');
        if (mod === 'buffer') {
          resource.request = 'buffer';
        } else if (mod === 'stream') {
          resource.request = 'stream-browserify';
        } else {
          resource.request = mod;
        }
      }
    )
  );

  // Fix for ESM modules
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false
    }
  });

  // Handle JSX runtime issues
  config.resolve.alias = {
    ...config.resolve.alias,
    'react/jsx-runtime': require.resolve('react/jsx-runtime'),
    'process/browser': require.resolve('process/browser')
  };

  config.plugins = plugins;

  return config;
}; 