'use strict';

const { Controller } = require('egg');


class VodController extends Controller {
  async createUploadVideo() {
    const { ctx, app } = this;
    const query = ctx.query;
    ctx.validate({
      Title: { type: 'string' },
      FileName: { type: 'string' },
    }, query);
    ctx.body = await app.vodClient.request('CreateUploadVideo', query, {
      method: 'POST',
      formatParams: false,
    });
  }

  async refreshUploadVideo() {
    const { ctx, app } = this;
    const query = ctx.query;
    ctx.validate({
      VideoId: { type: 'string' },
    }, query);

    ctx.body = await app.vodClient.request('RefreshUploadVideo', query, {
      method: 'POST',
      formatParams: false,
    });
  }

  async getVideoPlayAuth() {
    const query = this.ctx.query;
    this.ctx.validate(
      {
        VideoId: { type: 'string' },
      },
      query
    );

    this.ctx.body = await this.app.vodClient.request('GetVideoPlayAuth', query, {
      method: 'POST',
      formatParams: false,
    });
  }
}

module.exports = VodController;
