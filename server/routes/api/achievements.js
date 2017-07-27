'use strict';

const router = require('express').Router();
const mongoose = require('mongoose');
const Achievement = mongoose.model('Achievement');
const Comment = mongoose.model('Comment');
const User = mongoose.model('User');
const auth = require('../auth');

// Preload achievement objects on routes with ':achievement'
router.param('achievement', function(req, res, next, slug) {
  Achievement.findOne({ slug: slug})
    .populate('author')
    .then(function (achievement) {
      if (!achievement) { return res.sendStatus(404); }

      req.achievement = achievement;

      return next();
    }).catch(next);
});

router.param('comment', function(req, res, next, id) {
  Comment.findById(id).then(function(comment){
    if(!comment) { return res.sendStatus(404); }

    req.comment = comment;

    return next();
  }).catch(next);
});

router.get('/', auth.optional, function(req, res, next) {
  let query = {};
  let limit = 20;
  let offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  if( typeof req.query.tag !== 'undefined' ){
    query.tagList = {"$in" : [req.query.tag]};
  }

  Promise.all([
    req.query.author ? User.findOne({username: req.query.author}) : null,
    req.query.liked ? User.findOne({username: req.query.liked}) : null
  ]).then(function(results){
    let author = results[0];
    let liker = results[1];

    if(author){
      query.author = author._id;
    }

    if(liker){
      query._id = {$in: liker.likes};
    } else if(req.query.liked){
      query._id = {$in: []};
    }

    return Promise.all([
      Achievement.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({createdAt: 'desc'})
        .populate('author')
        .exec(),
      Achievement.count(query).exec(),
      req.payload ? User.findById(req.payload.id) : null,
    ]).then(function(results){
      let achievements = results[0];
      let achievementsCount = results[1];
      let user = results[2];

      return res.json({
        achievements: achievements.map(function(achievement){
          return achievement.toJSONFor(user);
        }),
        achievementsCount: achievementsCount
      });
    });
  }).catch(next);
});

router.get('/feed', auth.required, function(req, res, next) {
  let limit = 20;
  let offset = 0;

  if(typeof req.query.limit !== 'undefined'){
    limit = req.query.limit;
  }

  if(typeof req.query.offset !== 'undefined'){
    offset = req.query.offset;
  }

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    Promise.all([
      Achievement.find({ author: {$in: user.following}})
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author')
        .exec(),
      Achievement.count({ author: {$in: user.following}})
    ]).then(function(results){
      let achievements = results[0];
      let achievementsCount = results[1];

      return res.json({
        achievements: achievements.map(function(achievement){
          return achievement.toJSONFor(user);
        }),
        achievementsCount: achievementsCount
      });
    }).catch(next);
  });
});

router.post('/', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    let achievement = new Achievement(req.body.achievement);

    achievement.author = user;

    return achievement.save().then(function(){
      console.log(achievement.author);
      return res.json({achievement: achievement.toJSONFor(user)});
    });
  }).catch(next);
});

// return a achievement
router.get('/:achievement', auth.optional, function(req, res, next) {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.achievement.populate('author').execPopulate()
  ]).then(function(results){
    let user = results[0];

    return res.json({achievement: req.achievement.toJSONFor(user)});
  }).catch(next);
});

// update achievement
router.put('/:achievement', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(req.achievement.author._id.toString() === req.payload.id.toString()){
      if(typeof req.body.achievement.title !== 'undefined'){
        req.achievement.title = req.body.achievement.title;
      }

      if(typeof req.body.achievement.description !== 'undefined'){
        req.achievement.description = req.body.achievement.description;
      }

      if(typeof req.body.achievement.body !== 'undefined'){
        req.achievement.body = req.body.achievement.body;
      }

      if(typeof req.body.achievement.tagList !== 'undefined'){
        req.achievement.tagList = req.body.achievement.tagList
      }

      req.achievement.save().then(function(achievement){
        return res.json({achievement: achievement.toJSONFor(user)});
      }).catch(next);
    } else {
      return res.sendStatus(403);
    }
  });
});

// delete achievement
router.delete('/:achievement', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    if(req.achievement.author._id.toString() === req.payload.id.toString()){
      return req.achievement.remove().then(function(){
        return res.sendStatus(204);
      });
    } else {
      return res.sendStatus(403);
    }
  }).catch(next);
});

// Like an achievement
router.post('/:achievement/like', auth.required, function(req, res, next) {
  let achievementId = req.achievement._id;

  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    return user.like(achievementId).then(function(){
      return req.achievement.updateLikeCount().then(function(achievement){
        return res.json({achievement: achievement.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// Unlike an achievement
router.delete('/:achievement/like', auth.required, function(req, res, next) {
  let achievementId = req.achievement._id;

  User.findById(req.payload.id).then(function (user){
    if (!user) { return res.sendStatus(401); }

    return user.unlike(achievementId).then(function(){
      return req.achievement.updateLikeCount().then(function(achievement){
        return res.json({achievement: achievement.toJSONFor(user)});
      });
    });
  }).catch(next);
});

// return an achievement's comments
router.get('/:achievement/comments', auth.optional, function(req, res, next){
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function(user){
    return req.achievement.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function(achievement) {
      return res.json({comments: req.achievement.comments.map(function(comment){
        return comment.toJSONFor(user);
      })});
    });
  }).catch(next);
});

// create a new comment
router.post('/:achievement/comments', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if(!user){ return res.sendStatus(401); }

    let comment = new Comment(req.body.comment);
    comment.achievement = req.achievement;
    comment.author = user;

    return comment.save().then(function(){
      req.achievement.comments.push(comment);

      return req.achievement.save().then(function(achievement) {
        res.json({comment: comment.toJSONFor(user)});
      });
    });
  }).catch(next);
});

router.delete('/:achievement/comments/:comment', auth.required, function(req, res, next) {
  if(req.comment.author.toString() === req.payload.id.toString()){
    req.achievement.comments.remove(req.comment._id);
    req.achievement.save()
      .then(Comment.find({_id: req.comment._id}).remove().exec())
      .then(function(){
        res.sendStatus(204);
      });
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
