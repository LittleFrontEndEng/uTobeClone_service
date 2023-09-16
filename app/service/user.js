const Service = require('egg').Service;
const jwt = require('jsonwebtoken');

class UserService extends Service {
  get User() {
    return this.ctx.model.User;
  }
  findByUsername(username) {
    return this.User.findOne({
      username,
    });
  }

  findByEmail(email) {
    return this.User.findOne({
      email,
    }).select('+password');
  }

  createUser(data) {
    data.password = this.ctx.helper.md5(data.password);
    const user = this.User.create(data);
    return user;
  }

  createToken(data) {
    return jwt.sign(data, this.app.config.jwt.secret, {
      expiresIn: this.app.config.jwt.expiresIn,
    });
  }

  verifyToken(token) {
    return jwt.verify(token, this.app.config.jwt.secret);
  }

  updateUser(data) {
    return this.User.findByIdAndUpdate(this.ctx.user._id, data, {
      new: true,
    });
  }

  // 添加订阅
  async subscribe(userId, channelId) {
    const { Subscription, User } = this.ctx.model;
    // 检查是否已经订阅
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });
    // 找到被订阅的用户
    const channelUser = await User.findById(channelId);
    // 没有，进行添加
    if (!record) {
      await Subscription.create({
        user: userId,
        channel: channelId,
      });
      // 更新用户订阅数量
      channelUser.subscribersCount++;
      await channelUser.save();
    }
    // 有，直接返回
    return channelUser;
  }

  async unsubscribe(userId, channelId) {
    const { Subscription, User } = this.ctx.model;
    // 检查是否已经订阅
    const record = await Subscription.findOne({
      user: userId,
      channel: channelId,
    });
    // 找到被订阅的用户
    const channelUser = await User.findById(channelId);
    // 有，进行删除
    console.log('remove', Subscription.deleteOne);
    if (record) {
      await Subscription.deleteOne({
        user: userId,
        channel: channelId,
      });
      // 更新用户订阅数量
      channelUser.subscribersCount--;
      await channelUser.save();
    }
    // 没有，直接返回
    return channelUser;
  }
}

module.exports = UserService;
