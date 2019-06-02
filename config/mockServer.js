var fs = require('fs');
var path = require('path');
var net = require('net');

const Koa = require('koa');
const chalk = require('chalk');
const app = new Koa();

const Router = require('koa-router');
const router = new Router();

const { router: mockRouter, util } = require('../mock/util');
requireMockFiles();

portIsOccupied(3333, (err, port) => {
  
  router
    .use('/api', mockRouter.routes(), mockRouter.allowedMethods())
    .all('*', ctx => {
      ctx.status = 404;
      ctx.body = util.fail('访问的地址不存在', 404);
    });

  app.use(router.routes()).listen(port);

  app.on('error', err => {
    log.error('mock server error', err);
  });

  console.log('地址: ' + chalk.blue('http://localhost:' + port));
});

// 遍历文件列表
function readFileList(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((item, index) => {
    var fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      readFileList(path.join(dir, item), filesList); //递归读取文件
    } else {
      filesList.push(fullPath);
    }
  });
  return filesList;
}

// require mock文件
function requireMockFiles() {
  let filesList = [];
  readFileList(path.join(__dirname, '../mock'), filesList);
  let mockFile = filesList.filter(v => {
    return /\w+\.mock\.js$/.test(v);
  });

  mockFile.forEach(v => {
    require(v);
  });
}

// 检测端口占用情况，如果占用会递归增加prot知道最后返回一个有效的prot
function portIsOccupied(port, cb) {
  // 创建服务并监听该端口
  var server = net.createServer().listen(port);

  server.on('listening', function() {
    // 执行这块代码说明端口未被占用
    server.close(); // 关闭服务
    cb(false, port);
  });

  server.on('error', function(err) {
    if (err.code === 'EADDRINUSE') {
      // 端口已经被使用
      portIsOccupied(port + 1, cb);
    }
  });
}