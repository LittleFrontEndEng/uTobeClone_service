'use strict';

const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const User = ctx.model.User;
    User.create({
      userName: 'lsy',
      password: '1234',
    });
    // await new User().save();
    ctx.body = 'hi, egg';
  }
}

module.exports = HomeController;
