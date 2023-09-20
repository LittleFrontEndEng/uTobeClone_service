# utobeclone-service

## 创建项目
```shell
# 使用脚手架创建项目
create-egg 项目名称
```

## 目录结构
```shell
# app.js -应用入口文件[可选]
# app -应用文件夹
#  -router.js -路由文件
#  -controller -控制器文件夹
#  -services -业务逻辑层文件夹
#  -middleware -中间件文件夹
#  -public -静态资源文件夹
#  -model -数据模型文件夹
# config -应用配置文件夹
```

## 添加egg-mongoose
```js
  config.mongoose = {
    client: {
      url: 'mongodb://127.0.0.1:27017/utobeclone',
      options: {
        // dbName: '',
        // user: '',
        // pass: '',
        // useUnifiedTopology: true,
      },
      // mongoose global plugins, expected a function or an array of function and options
      plugins: [],
    },
  };
```