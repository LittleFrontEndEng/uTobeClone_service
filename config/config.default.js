/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1694680182387_1312';

  // add your middleware config here
  config.middleware = [
    'errorHandler',
  ];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/utobeclone',
      options: {
        // user: 'lsy',
        // proxyUsername: 'lsy',
        // proxyPassword: 'lsy1234!!',
        // dbName: 'utobeclone',
        // user: 'lsy',
        // pass: 'lsy1234!!',
        // useUnifiedTopology: true,
      },
      // mongoose global plugins, expected a function or an array of function and options
      plugins: [],
    },
  };

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.cors = {
    origin: '*',
    // {string|Function} origin: '*',
    // {string|Array} allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH'
  };

  config.jwt = {
    secret: '6799ee6c-7e03-4c61-aa40-f84c16653f5a',
    expiresIn: '1d',
  };

  return {
    ...config,
    ...userConfig,
  };
};
