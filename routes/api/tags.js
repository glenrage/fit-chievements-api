'use strict';

const router = require('express').Router();
const mongoose = require('mongoose');
const Achievement = mongoose.model('Achievement');

//return a list of tags
router.get('/', function(req, res, next) {
  Achievement.find().distinct('tagList').then(function(tags){
    return res.json({tags: tags});
  }).catch(next);
});

module.exports = router;
