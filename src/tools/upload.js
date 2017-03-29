import path from "path";
import appRootDir from "app-root-dir";
import fs from "fs";
import Busboy from "busboy";
import uuid from "uuid";
import {inspect} from "util";

/**
 * 同步创建文件目录
 * @param  {string} dirname 目录绝对地址
 * @return {boolean}        创建目录结果
 */
const mkDirsSync = dirname => {
  if (fs.existsSync(dirname)) {
    return true;
  } else if (mkDirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
    return true;
  }
};

/**
 * 获取上传文件的后缀名
 * @param  {string} fileName 获取上传文件的后缀名
 * @return {string}          文件后缀名
 */
const _getSuffixName = fileName => {
  let nameList = fileName.split('.');
  return nameList[nameList.length - 1];
};

/**
 * 上传文件
 * @param  {object} ctx     koa上下文
 * @param  {object} options 文件上传参数 fileType文件类型， path文件存放路径
 * @return {Promise}
 */
const uploadFile = async (ctx, options) => {
  let req = ctx.req;
  let busboy = new Busboy({headers: req.headers});

  // 获取类型
  let fileType = options.fileType || 'common';
  let filePath = path.join(options.path, fileType);
  if (!mkDirsSync(filePath)) {
    console.log('创建文件目录失败');
  }


  return new Promise((resolve, reject) => {
    console.log('文件上传中...');
    console.dir(req.headers['content-type']);
    let result = {
      success: false,
      data: {}
    };

    // 解析请求文件事件
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log('file...');
        let fileName = uuid.v4() + '.' + _getSuffixName(filename);
        let _uploadFilePath = path.join(filePath, fileName);
        let saveTo = path.join(appRootDir.get(), _uploadFilePath);
        // 文件保存到制定路径
        file.pipe(fs.createWriteStream(saveTo));

        // 文件写入事件结束
        file.on('end', () => {
          if (filename) {
            result.data.filename = `${path.sep}${path.join(filePath, fileName)}`;
          }

          console.log('文件上传成功！');
          resolve(result);
        })
      }
    );

    busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
      result.data[fieldname] = val;
    });

    // 解析结束事件
    busboy.on('finish', () => {
      result.success = true;
      console.log('文件上结束');
      resolve(result);
    });

    // 解析错误事件
    busboy.on('error', err => {
      console.log('文件上出错' + err);
      reject(result);
    });
    req.pipe(busboy);
  })
};

export {
  uploadFile, mkDirsSync
};