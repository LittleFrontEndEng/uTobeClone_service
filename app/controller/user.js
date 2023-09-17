/**
 * @abstract 用户控制器
 * @author liumangtu
 */
const { Controller } = require('egg');

class UserController extends Controller {
  async create() {
    const { ctx } = this;
    // const User = ctx.model.User;
    // User.create({
    //   userName: 'lsy',
    //   password: '1234',
    // });
    const body = this.ctx.request.body;
    ctx.validate({
      username: { type: 'string' },
      email: { type: 'email' },
      password: { type: 'string' },
    }, body);

    const userService = this.service.user;

    // 校验用户是否存在
    if (await userService.findByUsername(body.username)) {
      this.ctx.throw(422, '用户已存在');
    }

    if (await userService.findByEmail(body.email)) {
      this.ctx.throw(422, '邮箱已存在');
    }
    // 保存用户
    const user = await userService.createUser(body);

    // 生成token
    const token = await userService.createToken({
      userId: user._id,
    });
    // 发送响应
    ctx.body = {
      status: 200,
      user: {
        email: user.email,
        token,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
      },
    };
  }

  async login() {
    const { ctx } = this;
    const body = ctx.request.body;
    // 基本数据验证
    ctx.validate({
      email: { type: 'email' },
      password: { type: 'string' },
    }, body);
    // 邮箱
    const userService = this.service.user;
    const user = await userService.findByEmail(body.email);
    if (!user) {
      this.ctx.throw(422, '用户不存在');
    }
    // 密码
    if (ctx.helper.md5(body.password) !== user.password) {
      this.ctx.throw(422, '密码不正确');
    }
    // 生成token
    const token = await userService.createToken({
      userId: user._id,
    });
    // 发送响应数据
    ctx.body = {
      status: 200,
      user: {
        email: user.email,
        token,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
      },
    };
  }

  async getCurrentUser() {
    const { ctx } = this;
    // const body = ctx.request.body;
    const user = ctx.user;
    ctx.body = {
      status: 200,
      user: {
        email: user.email,
        token: ctx.headers.authorization,
        username: user.username,
        channelDescription: user.channelDescription,
        avatar: user.avatar,
      },
    };
  }

  async update() {
    // 基本数据验证
    const { ctx } = this;
    const body = this.ctx.request.body;
    ctx.validate({
      username: { type: 'string', required: false },
      email: { type: 'email', required: false },
      password: { type: 'string', required: false },
      channelDescription: { type: 'string', required: false },
      avatar: { type: 'string', required: false },
    }, body);

    const userService = this.service.user;
    // 邮箱是否存在
    if (body.email) {
      if (body.email !== ctx.user.email && await userService.findByEmail(body.email)) {
        this.ctx.throw(422, '邮箱已存在');
      }
    }
    // 用户是否存在
    if (body.username) {
      if (body.username !== ctx.user.username && await userService.findByUsername(body.username)) {
        this.ctx.throw(422, '用户名已存在');
      }
    }

    if (body.password) {
      body.password = ctx.helper.md5(body.password);
    }

    // 更新用户信息
    const user = await userService.updateUser(body);
    // 返回新数据
    ctx.body = {
      status: 200,
      user: {
        ...ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'channelDescription',
        ]),
      },
    };
  }

  async subscribe() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const channelId = ctx.params.userId; // 视频频道用户ID
    // 用户不能订阅自己
    if (userId.equals(channelId)) {
      ctx.throw(422, '用户不能订阅自己');
    }
    // 添加订阅
    const user = await this.service.user.subscribe(userId, channelId);
    // 发送响应
    ctx.body = {
      status: 200,
      user: {
        ...ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'cover',
          'channelDescription',
          'subscribersCount',
        ]),
        isSubscribed: true,
      },
    };
  }

  async unsubscribe() {
    const { ctx } = this;
    const userId = ctx.user._id;
    const channelId = ctx.params.userId; // 视频频道用户ID

    if (userId.equals(channelId)) {
      ctx.throw(422, '用户不能订阅自己');
    }
    // 取消订阅
    const user = await this.service.user.unsubscribe(userId, channelId);
    // 发送响应
    ctx.body = {
      status: 200,
      user: {
        ...ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'cover',
          'channelDescription',
          'subscribersCount',
        ]),
        isSubscribed: true,
      },
    };
  }

  async getUser() {
    const { ctx } = this;
    // 获取订阅状态
    let isSubscribed = false;
    if (ctx.user) {
      // 获取订阅记录
      const record = await ctx.model.Subscription.findOne({
        user: ctx.user._id,
        channel: ctx.params.userId,
      });
      if (record) {
        isSubscribed = true;
      }
    }
    // 获取用户信息
    const user = await ctx.model.User.findById(ctx.params.userId);
    // 发送响应
    ctx.body = {
      status: 200,
      user: {
        ...ctx.helper._.pick(user, [
          'username',
          'email',
          'avatar',
          'cover',
          'channelDescription',
          'subscribersCount',
        ]),
        isSubscribed,
      },
    };
  }

  async getSubscriptions() {
    const { ctx } = this;
    const Subscription = ctx.model.Subscription;
    let subscriptions = await Subscription.find({
      user: ctx.params.userId,
    }).populate('channel'); // 映射出channel数据
    subscriptions = subscriptions.map(item => {
      return ctx.helper._.pick(
        item.channel,
        [ '_id', 'username', 'avatar' ]
      );
    });
    ctx.body = {
      subscriptions,
    };
  }
}

module.exports = UserController;
