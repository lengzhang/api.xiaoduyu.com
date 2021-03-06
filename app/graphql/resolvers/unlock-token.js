
import { Account, Phone, User, Captcha } from '../../modelsa';

// tools
import To from '../../common/to';
import CreateError from './errors';
import JWT from '../../common/jwt';

// graphql
import { getQuery, getOption, getUpdateQuery, getUpdateContent, getSaveFields } from '../config';
let [ query, mutation, resolvers ] = [{},{},{}];


// 获取解锁令牌
query.getUnlockToken = async (root, args, context, schema) => {

  const { user, role, ip, jwtTokenSecret } = context;

  // 未登陆用户
  if (!user) throw CreateError({ message: '请求被拒绝' });

  let err, res, fields, result;

  // [ err, fields ] = getSaveFields({ args, model:'unlock-token', role });

  // if (err) throw CreateError({ message: err });

  const { type, captcha } = args;

  let query = {}

  if (type == 'phone') {

    query.type = 'phone-unlock-token';

    [ err, result ] = await To(Phone.findOne({ query: { user_id: user._id } }));

    if (err) throw CreateError({ message: err });
    if (!result) throw CreateError({ message: '未绑定手机' });

    query.phone = result.phone;
    // query.area_code = result.area_code;

  } else if (type == 'email') {

    query.type = 'email-unlock-token';

    [ err, result ] = await To(Account.findOne({ query: { user_id: user._id } }));

    if (err) throw CreateError({ message: err });
    if (!result) throw CreateError({ message: '未绑定邮箱' });

    query.email = result.email;

  } else {
    throw CreateError({ message: 'type 不匹配' });
  }

  // 验证验证码
  [ err, res ] = await To(Captcha.findOne({ query }));

  if (err) throw CreateError({ message: '查询失败' });
  if (!res || res.captcha != captcha) throw CreateError({ message: '无效的验证码' });

  // 删除该用户所有的手机手机验证码
  [ err, res ] = await To(Captcha.remove({
    query: { user_id: user._id }
  }));

  let jwt = JWT.encode(jwtTokenSecret, user._id, user.access_token, ip, 1000*60*60, { type:'unlock-ticket' });

  return {
    unlock_token: jwt.access_token
  }

}


exports.query = query
exports.mutation = mutation
exports.resolvers = resolvers
