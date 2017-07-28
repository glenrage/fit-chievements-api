'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');
const User = mongoose.model('User');

const AchievementSchema = new mongoose.Schema({
  slug: {type: String, lowercase: true, unique: true},
  title: String,
  description: String,
  body: String,
  likesCount: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tagList: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
}, {timestamps: true});

AchievementSchema.plugin(uniqueValidator, {message: 'is already taken'});

AchievementSchema.pre('validate', function(next){
  if(!this.slug)  {
    this.slugify();
  }

  next();
});

AchievementSchema.methods.slugify = function() {
  this.slug = slug(this.title) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36);
};

AchievementSchema.methods.updateLikeCount = function() {
  let achievement = this;

  return User.count({likes: {$in: [achievement._id]}}).then(function(count){
    achievement.likesCount = count;

    return achievement.save();
  });
};

AchievementSchema.methods.toJSONFor = function(user){
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    liked: user ? user.isLike(this._id) : false,
    likesCount: this.likesCount,
    author: this.author.toProfileJSONFor(user)
  };
};

mongoose.model('Achievement', AchievementSchema);
