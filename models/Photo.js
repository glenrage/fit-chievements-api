'use strict'

const mongoose = require('mongoose');
const User = mongoose.model('User');

const PhotoSchema = new mongoose.Schema({
  // userId: {type: mongoose.Schema.Types.ObjectId, required: true},
  imageURI: {type: String, required: true, unique: true},
  objectKey: {type: String, required: true, unique: true},
  created: {type: Date, default: Date.now},
})

module.exports = mongoose.model('Photo', PhotoSchema)
