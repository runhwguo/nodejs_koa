import {User} from '../../tool/model';
import {cookie2user} from '../../tool/cookie';
import {session} from '../../tool/config';

const save = async ctx => {
  let name = ctx.request.body.name;
  let wx = ctx.request.body.wx;
  let tel = ctx.request.body.tel;
  let qq = ctx.request.body.qq;

  let schoolResourceShareCookie = ctx.cookies.get(session.userCookieName);
  let user = await cookie2user(schoolResourceShareCookie, session.userCookieName);
  let result = await User.update({
    wx: wx,
    name: name,
    tel: tel,
    qq: qq
  }, {
    where: {
      id: user.id
    }
  });
  ctx.rest({
    result: !!result
  });
};


module.exports = {
  'POST /api/save': save
};