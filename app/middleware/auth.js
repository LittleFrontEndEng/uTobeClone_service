module.exports = (options = { required: true }) => {
  return async (ctx, next) => {
    // 获取请求头的token
    let token = ctx.headers.authorization;
    token = token ? token.split(' ')[1] : null;

    if (token) {
      try {
        // 有效 获取用户数据挂载到ctx
        const data = ctx.service.user.verifyToken(token);
        ctx.user = await ctx.model.User.findById(data.userId);
      } catch (error) {
        ctx.throw(401);
      }
    } else if (options.required) {
      ctx.throw(401);
    }

    // next 执行后续
    await next();
  };
};
