import fs from 'fs';
import uuid from 'uuid';
import path from 'path';
import Superagent from 'superagent';
import AppRootDir from 'app-root-dir';
import charset from 'superagent-charset';
import Tracer from 'tracer';

import {cookie2user} from '../../tool/cookie';
import {session} from '../../tool/config';
import * as Common from '../../tool/common';
import {count} from '../../tool/user_task_dao';
import {mkDirsSync} from '../../tool/upload';
import * as Dao from '../../tool/dao';
import {Task} from '../../tool/model';
import {TASK_STATE} from '../../model/Task';
import * as wxPay from "../../tool/wx_pay";

const console = Tracer.console();

charset(Superagent);

const index = async ctx => {
  let code = ctx.query.code;
  let state = ctx.query.state;
  let openId = ctx.cookies.get(session.wxOpenId);
  // console.log('state = ' + state+ ', code = ' + code);

  if (code && !openId) {
    openId = await wxPay.getAccessTokenOpenId(code);
    ctx.cookies.set(session.wxOpenId, openId);
  }
  // console.log('openId = ' + openId);
  ctx.render(`index`, {
    title: '校园资源共享',
    where: 'index'
  });
};

const me = async ctx => {
  let user = ctx.state.user;
  let unfinishedBadge = await count(user.id, TASK_STATE.completing);
  let data = {
    title: '我的信息',
    username: user.name,
    gender: user.gender
  };
  if (unfinishedBadge) {
    data.unfinishedBadge = unfinishedBadge;
  }

  let unPaidBadge = await Dao.count(Task, {
    where: {
      userId: user.id,
      state: TASK_STATE.completed
    }
  });
  if (unPaidBadge) {
    data.unPaidBadge = unPaidBadge;
  }
  ctx.render(`my_info`, data);
};

const createTask = async ctx => {
  let schoolResourceShareCookie = ctx.cookies.get(session.userCookieName);
  let user = await cookie2user(schoolResourceShareCookie, session.userCookieName);
  ctx.render(`task/create_task`, {
    title: '发布任务',
    user: user
  });
};

const login = async ctx => {
  const UJS_MAIN_URL = 'http://my.ujs.edu.cn/';
  const captchaGenerateUrl = `${UJS_MAIN_URL}captchaGenerate.portal`;
  const idPng = uuid.v4() + '.png';
  const codeDir = `static/tmp/verificationCode/${ Common.getRandomInt() }/${ Common.getRandomInt() }`;
  const codeRealDir = path.join(AppRootDir.get(), codeDir);
  if (!mkDirsSync(codeRealDir)) {
    console.error('create ' + codeRealDir + ' dir fail!');
  }
  const verificationCodePicture = path.join(codeRealDir, idPng),
    verificationCodePictureUrl = path.join(codeDir, idPng);

  let response = await Superagent.get(captchaGenerateUrl);
  if (response.ok) {
    console.log('验证码图片获取成功');
    let cookie = response.header['set-cookie'][0].split(';')[0];
    console.log('ujs cookie = ' + cookie);
    ctx.cookies.set(session.ujsCookieName, cookie, {
        maxAge: session.maxAge * 1000
      }
    );
    fs.writeFileSync(verificationCodePicture, response.body, 'binary');
    ctx.render('login', {
      title: '教务处身份验证',
      verificationCodePictureUrl: verificationCodePictureUrl
    });
  }
};

const userInfo = async ctx => {
  let schoolResourceShareCookie = ctx.cookies.get(session.userCookieName);
  let user = await cookie2user(schoolResourceShareCookie, session.userCookieName);
  let where = ctx.query.where;
  ctx.render(`user_info`, {
    title: '完善用户信息',
    user: user,
    where: where
  });
};

module.exports = {
  'GET /': index,
  'GET /me': me,
  'GET /createTask': createTask,
  'GET /login': login,
  'GET /userInfo': userInfo
};