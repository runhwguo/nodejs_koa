// 公用环境的配置
export default {
  session: {
    userCookieName: 'schoolResourceShare',
    adminCookieName: 'adminCookie',
    ujsCookieName: 'JSESSIONID',
    wxOpenId: 'openid',
    headImgUrl: 'headImgUrl',
    cookieKey: 'fuckQ',
    maxAge: 86400//1天
  },
  admin: {
    username: 'admin',
    password: 'admin'
  },
  project: {
    isProduction: process.env.NODE_ENV === 'production',
    port: 8080
  },
  common: {
    char_set_utf8: 'utf8'
  }
};