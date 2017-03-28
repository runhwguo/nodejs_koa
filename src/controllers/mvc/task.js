import {Task, User} from "../../tools/model";
import * as Dao from "../../tools/dao";
import {TASK_STATE, TASK_TYPE} from "../../models/Task";

const unfinishedTasks = async ctx => {
  let data = await Dao.findAll(Task, {
    attributes: ['id', 'type', 'deadline', 'detail', 'filename', 'reward'],
    where: {
      state: TASK_STATE.COMPLETING
    }
  });

  ctx.render(`my_task_list`, {
    title: '未完成任务',
    data: data
  })
};
const completedTasks = async ctx => {
  let data = await Dao.findAll(Task, {
    attributes: ['id', 'type', 'deadline', 'detail', 'filename', 'reward'],
    where: {
      state: TASK_STATE.COMPLETED,
      receiveTaskUserId: ctx.state.user.id
    }
  });

  ctx.render(`my_task_list`, {
    title: '已完成的任务',
    data: data
  })
};
const publishedTasks = async ctx => {
  let data = await Dao.findAll(Task, {
    attributes: ['id', 'type', 'deadline', 'detail', 'filename', 'reward'],
    where: {
      publishUserId: ctx.state.user.id
    },
    limit: 5
  });

  ctx.render(`my_task_list`, {
    title: '发布的任务',
    data: data
  })
};
let myInfo = async ctx => {
  let user = await User.findById(ctx.state.user.id);

  ctx.render(`completedTasks`, {
    title: '已完成的任务',
    data: user
  })
};

const detail = async ctx => {
  let id = ctx.params.id;
  let task = await Task.findOne({
    where: {id: id},
    attributes: {exclude: ['version', 'updatedAt', 'createdAt']}
  });
  task = task.dataValues;
  let user = await User.findOne({
    where: {id: task.publishUserId},
    attributes: ['name', 'tel']
  });
  user = user.dataValues;
  task.type = TASK_TYPE[task.type];
  let data = Object.assign({}, task, user);
  ctx.render(`task_detail`, {
    title: '任务详情',
    data: data
  })
};

const taskList = async ctx => {
  let where = ctx.query.where;
  ctx.render(`take_task_list`, {
    title: TASK_TYPE[where],
    where: where
  })
};

module.exports = {
  'GET /unfinishedTasks': unfinishedTasks,
  'GET /completedTasks': completedTasks,
  'GET /publishedTasks': publishedTasks,
  'GET /taskList': taskList,
  'GET /myInfo': myInfo,
  'GET /task/detail/:id': detail
};