import {User as User}  from '../../tools/model';
import {cookie2user as cookie2user} from '../../tools/cookie';
import {session as session} from '../../tools/config';
import tracer from 'tracer';

let logger = tracer.console();

let save = async ctx => {
    let name = ctx.request.body.name;
    let wx = ctx.request.body.wx;
    let tel = ctx.request.body.tel;
    let qq = ctx.request.body.qq;

    let schoolResourceShareCookie = ctx.cookies.get(session.cookieName);
    let user = await cookie2user(schoolResourceShareCookie);
    await User.update({
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
        user: user.dataValues
    });
};


module.exports = {
    'POST /api/save': save
};