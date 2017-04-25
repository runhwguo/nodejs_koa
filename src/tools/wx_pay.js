import md5 from "MD5";
import superagent from "superagent";
import charset from "superagent-charset";
import config from "./config";

import json2xml from "json2xml";
import xml2json from "xml2json";
import tracer from "tracer";

let logger = tracer.console();

charset(superagent);

const APP_ID = 'wx90eb6b04dcbf5fb2';
const APP_SECRET = '7e87a72a56080c466d9256387016c886';
const MCH_ID = '1462750902';
const TRADE_TYPE = 'JSAPI';
const MCH_KEY = 'guohaoweilovechengxihuiforeveruu';//key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置

const MCH_PAU_URL = 'https://api.mch.weixin.qq.com/';

const URL_UNIFIED_ORDER = `${ MCH_PAU_URL }pay/unifiedorder`;
const URL_REFUND = `${ MCH_PAU_URL }secapi/pay/refund`;

const URL_WX_OPEN_ID_ACCESS_TOKEN = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${ APP_ID }&secret=${ APP_SECRET }&code=CODE&grant_type=authorization_code`;


const _paySign = data => {
  let string = `${ _raw(data) }&key=${MCH_KEY}`;
  return md5(string).toUpperCase();
};

const _raw = args => {
  let keys = Object.keys(args);
  keys = keys.sort();
  let newArgs = {};
  keys.forEach(key => newArgs[key] = args[key]);

  let string = '';
  for (let k in newArgs) {
    string += `&${k}=${newArgs[k]}`;
  }
  string = string.substr(1);
  return string;
};

const _payApiRequest = async (data, url) => {
  let sign = _paySign(data);

  let formData = {
    xml: Object.assign(data, {sign: sign})
  };

  formData = json2xml(formData);

  let response = await superagent
    .post(url)
    .send(formData)
    .charset(config.common.char_set_utf8);

  logger.log(response.text);
  let result = xml2json.toJson(response.text);
  logger.log(result);

  return JSON.parse(result);
};


const unifiedOrder = async ctx => {
  let notify_url = 'http://i-sharing.xyz/api/wechat/order/notify';
  let total_fee = Number.parseInt(ctx.query.fee) || 1;
  let body = ctx.query.body || '下订单';
  let nonce_str = Math.random().toString();
  let openid = ctx.cookies.get(config.session.wxOpenId);
  let out_trade_no = '' + Date.now();
  let spbill_create_ip = ctx.ip;


  let data = {
    appid: APP_ID,// appid
    body: body,// 商品或支付单简要描述
    mch_id: MCH_ID,// 商户号
    nonce_str: nonce_str,// 随机字符串，不长于32位
    notify_url: notify_url,// 支付成功后微信服务器通过POST请求通知这个地址
    openid: openid,// 为微信用户在商户对应appid下的唯一标识
    out_trade_no: out_trade_no,//订单号
    spbill_create_ip: spbill_create_ip,//终端IP
    total_fee: total_fee,//金额
    trade_type: TRADE_TYPE,//NATIVE会返回code_url ，JSAPI不会返回
  };

  return _payApiRequest(data, URL_UNIFIED_ORDER);
};

const refund = async () => {
  let nonce_str = Math.random().toString();
  let out_trade_no = '' + Date.now();
  let total_fee = 1;
  let refund_fee = 1;
  let data = {
    appid: APP_ID,// appid
    mch_id: MCH_ID,// 商户号
    nonce_str: nonce_str,// 随机字符串，不长于32位
    op_user_id: MCH_ID,
    out_refund_no: out_trade_no,
    out_trade_no: out_trade_no,//订单号
    refund_fee: refund_fee,
    total_fee: total_fee,//金额
    transaction_id: ''
  };

  return _payApiRequest(data, URL_REFUND);
};

const getAccessTokenOpenId = async code => {
  let url = URL_WX_OPEN_ID_ACCESS_TOKEN.replace('CODE', code);

  let response = await superagent
    .get(url);
  let resObj = JSON.parse(response.text);
  return resObj.openid;
};

const getOnBridgeReadyRequest = async prepay_id => {

  let data = {
    appId: APP_ID,     //公众号名称，由商户传入
    timeStamp: '' + Math.round(Date.now() / 1000),         //时间戳，自1970年以来的秒数
    nonceStr: Math.random().toString(), //随机串
    package: `prepay_id=${ prepay_id }`,
    signType: 'MD5' //微信签名方式：
  };

  let paySign = _paySign(data);

  logger.log(paySign);


  let request = Object.assign(data, {
    paySign: paySign //微信签名
  });

  logger.log(request);

  return request;
};

export {
  unifiedOrder, getAccessTokenOpenId, getOnBridgeReadyRequest
};