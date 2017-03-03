import tracer from 'tracer';
import {Task}  from '../../tools/model';
import {TASK_STATE}  from '../../models/Task';
import {cookie2user} from '../../tools/cookie';
import {session} from '../../tools/config';
import {uploadFile} from '../../tools/upload';

let logger = tracer.console();

let completedTasks = async ctx => {

};

let getTasks = async ctx => {
  let offset = Number.parseInt(ctx.request.query.offset);
  let limit = Number.parseInt(ctx.request.query.limit);
  let result = await Task.findAll({
    attributes: ['type', 'deadline', 'detail', 'filename', 'reward'],
    where: {
      state: TASK_STATE.RELEASED_NOT_CLAIMED
    },
    offset: offset,
    limit: limit
  });
  let tasks = [];
  for (let item of result) {
    tasks.push(item.dataValues);
  }
  ctx.rest({
    result: tasks
  });
};

let publish = async ctx => {
  let schoolResourceShareCookie = ctx.cookies.get(session.cookieName);
  let user = await cookie2user(schoolResourceShareCookie);

  let userId = user.id;

  let serverFilePath = 'static/tmp';
  // 上传文件事件
  let getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
  let firstDir = getRandomInt(0, 9);
  let secondDir = getRandomInt(0, 9);
  let result = await uploadFile(ctx, {
    fileType: `taskImage/${firstDir}/${secondDir}`,
    path: serverFilePath
  });
  result['userId'] = userId;
  result['deadline'] = new Date(result['deadline']).getTime();
  logger.info(result);

  let createResult = await Task.create(result);
  logger.log(createResult);
};

module.exports = {
  'POST /api/completedTasks': completedTasks,
  'POST /api/publish': publish,
  'GET /api/getTasks': getTasks
};