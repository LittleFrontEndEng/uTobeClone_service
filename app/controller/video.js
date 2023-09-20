
const { Controller } = require('egg');

class VideoController extends Controller {
  async createVideo() {
    const { ctx } = this;
    const body = ctx.request.body;
    const { Video } = ctx.model;
    ctx.validate({
      title: { type: 'string' },
      description: { type: 'string' },
      vodVideoId: { type: 'string' },
      cover: { type: 'string', required: false },
    }, body);
    body.user = ctx.user._id;
    const video = await Video.create(body);
    ctx.status = 201;
    ctx.body = {
      success: true,
      video,
    };
  }

  // 获取视频
  async getVideo() {
    const { ctx } = this;
    const { Video, VideoLike, Subscription } = ctx.model;
    const { videoId } = ctx.params;
    let video = await Video.findById(videoId).populate('user', '_id username avatar subscribersCount');

    if (!video) {
      ctx.throw(404, 'Video not found');
    }
    video = video.toJSON();

    video.isLiked = false;
    video.isDisliked = false;
    video.user.isSubscribed = false;

    if (ctx.user) {
      const userId = ctx.user._id;
      if (await VideoLike.findOne({ user: userId, video: videoId, like: 1 })) {
        video.isLiked = true;
      }
      if (await VideoLike.findOne({ user: userId, video: videoId, like: -1 })) {
        video.isDisliked = true;
      }

      if (await Subscription.findOne({ user: userId, channel: video.user._id })) {
        video.user.isSubscribed = true;
      }
    }

    ctx.body = {
      success: true,
      video,
    };
  }

  async getVideos() {
    const { ctx } = this;
    const { Video } = ctx.model;

    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = Number.parseInt(pageNum);
    pageSize = Number.parseInt(pageSize);
    const getVideos = Video.find().populate('user').sort({
      createdAt: -1,
    })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments();
    const [ videos, videosCount ] = await Promise.all([
      getVideos,
      getVideosCount,
    ]);
    ctx.body = {
      videos,
      videosCount,
    };
  }

  async getUserVideos() {
    const { ctx } = this;
    const { Video } = ctx.model;
    const { userId } = ctx.params;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = Number.parseInt(pageNum);
    pageSize = Number.parseInt(pageSize);
    const getVideos = Video.find({
      user: userId, // 查询这个用户id下的所有视频
    }).populate('user').sort({
      createdAt: -1,
    })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments({
      user: userId,
    });
    const [ videos, videosCount ] = await Promise.all([
      getVideos,
      getVideosCount,
    ]);
    ctx.body = {
      videos,
      videosCount,
    };
  }

  async getUserFeedVideos() {
    const { ctx } = this;
    const { Video, Subscription } = ctx.model;
    const userId = ctx.user._id;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = Number.parseInt(pageNum);
    pageSize = Number.parseInt(pageSize);
    const channels = await Subscription.find({
      user: userId,
    }).populate('channel');
    const getVideos = Video.find({
      user: {
        $in: channels.map(item => item.channel._id),
      }, // 查询这个用户id下的所有视频
    }).populate('user').sort({
      createdAt: -1,
    })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);
    const getVideosCount = Video.countDocuments({
      user: {
        $in: channels.map(item => item.channel._id),
      },
    });
    const [ videos, videosCount ] = await Promise.all([
      getVideos,
      getVideosCount,
    ]);
    ctx.body = {
      videos,
      videosCount,
    };
  }

  async updateVideo() {
    const { ctx } = this;
    const { Video } = ctx.model;
    const { videoId } = ctx.params;
    const body = ctx.request.body;
    const userId = ctx.user._id;
    ctx.validate({
      title: { type: 'string', required: false },
      description: { type: 'string', required: false },
      vodVideoId: { type: 'string', required: false },
      cover: { type: 'string', required: false },
    }, body);

    // 查询视频
    const video = await Video.findById(videoId);

    if (!video) {
      // 视频不存在
      ctx.throw(404, 'Video not found');
    }

    // 视频作者判断
    if (!video.user.equals(userId)) {
      ctx.throw(403, 'Not Author');
    }

    Object.assign(video, ctx.helper._.pick(body, [ 'title', 'description', 'vodVideoId', 'cover' ]));

    await video.save();

    ctx.body = {
      video,
    };
  }

  async deleteVideo() {
    const { ctx } = this;
    const { Video } = ctx.model;
    const { videoId } = ctx.params;
    const userId = ctx.user._id;
    const video = await Video.findById(videoId);

    if (!video) {
      // 视频不存在
      ctx.throw(404, 'Video not found');
    }

    // 视频作者判断
    if (!video.user.equals(userId)) {
      ctx.throw(403, 'Not Author');
    }
    // await Video.deleteOne({
    //   _id: videoId,
    // });
    await video.deleteOne();

    ctx.status = 204;
  }

  async createComment() {
    const { ctx } = this;
    const { Video, VideoComment } = ctx.model;
    const { videoId } = ctx.params;
    const body = ctx.request.body;

    ctx.validate({
      content: 'string',
    }, body);

    const video = await Video.findById(videoId);

    if (!video) {
      // 视频不存在
      ctx.throw(404, 'Video not found');
    }

    const comment = await VideoComment.create({
      content: body.content,
      user: ctx.user._id,
      video: videoId,
    });

    video.commentsCount = await VideoComment.countDocuments({
      video: videoId,
    });

    await video.save();

    // 映射评论所属用户和视频字段数据
    await comment.populate('user');
    await comment.populate('video');

    ctx.body = {
      comment,
    };
  }

  async getVideoComment() {
    const { ctx } = this;
    const { VideoComment } = ctx.model;
    const { videoId } = ctx.params;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = Number.parseInt(pageNum);
    pageSize = Number.parseInt(pageSize);

    const getComments = VideoComment.find({
      video: videoId,
    })
      .populate('user')
      .populate('video')
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    const getCommentsCount = VideoComment.countDocuments({
      video: videoId,
    });

    const [ comments, commentsCount ] = await Promise.all([ getComments, getCommentsCount ]);

    ctx.body = {
      comments,
      commentsCount,
    };
  }

  async deleteVideoComment() {
    const { ctx } = this;
    const { Video, VideoComment } = ctx.model;
    const { videoId, commentId } = ctx.params;
    const userId = ctx.user._id;
    const video = await Video.findById(videoId);

    if (!video) {
      // 视频不存在
      ctx.throw(404, 'Video not found');
    }

    const comment = await VideoComment.findById(commentId);

    if (!comment) {
      // 视频不存在
      ctx.throw(404, 'Comment not found');
    }

    // 评论作者判断
    if (!comment.user.equals(userId)) {
      ctx.throw(403, 'Not Author');
    }

    await comment.deleteOne();

    video.commentsCount = await VideoComment.countDocuments({
      video: videoId,
    });

    await video.save();

    ctx.status = 204;
  }

  async likeVideo() {
    const { ctx } = this;
    const { Video, VideoLike } = ctx.model;
    const { videoId } = ctx.params;
    const userId = ctx.user._id;
    const video = await Video.findById(videoId);

    if (!video) {
      // 视频不存在
      ctx.throw(404, 'Video not found');
    }

    const doc = await VideoLike.findOne({
      user: userId,
      video: videoId,
    });

    let isLiked = true;

    if (doc && doc.like === 1) {
      await doc.deleteOne(); // 删除记录 取消点赞
      isLiked = false;
    } else if (doc && doc.like === -1) {
      doc.like = 1;
      await doc.save();
    } else {
      await VideoLike.create({
        user: userId,
        video: videoId,
        like: 1,
      });
    }

    video.likesCount = await VideoLike.countDocuments({
      video: videoId,
      like: 1,
    });

    video.dislikesCount = await VideoLike.countDocuments({
      video: videoId,
      like: -1,
    });

    await video.save();

    ctx.body = {
      video: {
        ...video.toJSON(),
        isLiked,
      },
    };
  }

  async dislikeVideo() {
    const { ctx } = this;
    const { Video, VideoLike } = ctx.model;
    const { videoId } = ctx.params;
    const userId = ctx.user._id;
    const video = await Video.findById(videoId);

    if (!video) {
      // 视频不存在
      ctx.throw(404, 'Video not found');
    }

    const doc = await VideoLike.findOne({
      user: userId,
      video: videoId,
    });

    let isDisLiked = true;

    if (doc && doc.like === -1) {
      await doc.deleteOne(); // 删除记录 取消点赞
      isDisLiked = false;
    } else if (doc && doc.like === 1) {
      doc.like = -1;
      await doc.save();
    } else {
      await VideoLike.create({
        user: userId,
        video: videoId,
        like: -1,
      });
    }

    video.likesCount = await VideoLike.countDocuments({
      video: videoId,
      like: 1,
    });

    video.dislikesCount = await VideoLike.countDocuments({
      video: videoId,
      like: -1,
    });

    await video.save();

    ctx.body = {
      video: {
        ...video.toJSON(),
        isDisLiked,
      },
    };
  }

  async getUserLikedVideos() {
    const { ctx } = this;
    const { Video, VideoLike } = ctx.model;
    const userId = ctx.user._id;
    let { pageNum = 1, pageSize = 10 } = ctx.query;
    pageNum = Number.parseInt(pageNum);
    pageSize = Number.parseInt(pageSize);

    const filterDoc = {
      user: userId,
      like: 1,
    };

    const likes = await VideoLike.find(filterDoc).sort({
      createdAt: -1,
    }).skip((pageNum - 1) * pageSize)
      .limit(pageSize);

    const getVideos = Video.find({
      _id: {
        $in: likes.map(item => item.video),
      },
    }).populate('user');

    const getVideosCount = VideoLike.countDocuments(filterDoc);
    const [ videos, videosCount ] = await Promise.all([ getVideos, getVideosCount ]);

    ctx.body = {
      videos,
      videosCount,
    };
  }
}

module.exports = VideoController;
