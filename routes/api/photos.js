'use strict'

const router = require('express').Router()
const createError = require('http-errors');
const multer = require('multer')
const fs = require('fs');
const del = require('del');
const path = require('path');
const auth = require('../auth');
const AWS = require('aws-sdk');
const Photo = require('../../models/Photo.js')
const User = require('../../models/User.js')

// Use bluebird implementation of Promise
// will add a .promise() to AWS.Request
AWS.config.setPromisesDependency(require('bluebird'))

// module constants
const s3 = new AWS.S3()
const dataDir =`${__dirname}/../../data`
const upload = multer({dest: dataDir })
const s3UploadPromise = require('../../config/s3-upload-promise.js')

router.post('/photo/', upload.single('file'), function(req, res, next){

  // if (!req.file) return createError(400, 'Resource required');
  //   if (!req.file.path) return createError(500, 'File not saved');
    let ext = path.extname(req.file.originalname);
    let params = {
      ACL: 'public-read',
      Bucket: process.env.AWS_BUCKET,
      Key: `${req.file.filename}${ext}`,
      Body: fs.createReadStream(req.file.path),
    };

    // return User.findById(req.payload.id)
    return s3UploadPromise(params)
    .then(s3Data => {
      del([`${dataDir}/*`]);
      let photoData = {
        // userId: req.payload.id,
        imageURI: s3Data.Location,
        objectKey: s3Data.Key,
      };
      return new Photo(photoData).save();
    })
    // .then(photo => {
    //   tempPhoto = photo;
    //   tempUser.photos.push(photo._id);
    //   return User.findByIdAndUpdate(req.user._id, tempUser, {new: true});
    // })
    .then((photo) => res.json(photo))
    .catch(err => res.send(err));
})
//
// router.delete('/api/gallery/:galleryID/pic/:picID', bearerAuth, function(req, res, next){
//   debug('DELETE /api/gallery/:galleryID/pic/:picID')
//
//
//   //check that the pic exists if not 404
//   //make sure there userID matches the pic.userID if not 401
//   //check that gallery id is correct if not 404
//   //remove the picID from the gallery
//   //delete the picture from aws
//   //delete the pic from mongo
//   //respond to the client
//   let tempPhoto
//   Photo.findById(req.params.picID) // 404
//   .then( pic => {
//     if(pic.userID.toString() !== req.user._id.toString())
//       return Promise.reject(createError(401, 'user not authtorized to delete this pic'))
//     tempPhoto = pic
//     return Gallery.findById(req.params.galleryID) // 404
//   })
//   .catch(err => err.status? Promise.reject(err) : Promise.reject(createError(404, err.message))) // if no pic or gal found
//   .then( gallery => {
//     gallery.pics = gallery.pics.filter( id => {
//       if (id === req.params.picID) return false
//       return true
//     })
//     return gallery.save() // 500 error
//   })
//   .then(() => {
//     let params = {
//       Bucket: process.env.AWS_BUCKET,
//       Key: tempPhoto.objectKey,
//     }
//     return s3.deleteObject(params).promise() // 500 error
//   })
//   .then(() => {
//     return Photo.findByIdAndRemove(req.params.picID) //500
//   })
//   .then(() => res.sendStatus(204))
//   .catch(next)
// })
//
// router.get('/api/public/pic', pageQuery, function(req, res, next){
//   let fields = ['username', 'name', 'desc']
//   let query = fuzzyQuery(fields, req.query)
//
//   Photo.find(query)
//   .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
//   .then(pics => res.json(pics))
//   .catch(next)
// })
//
//  // this route is private and only returns a users pictures
// router.get('/api/pic', bearerAuth, pageQuery, function(req, res, next){
//   let fuzzyFields = [ 'name', 'desc' ]
//   let query = fuzzyQuery(fuzzyFields, req.query)
//   query.userID = req.user._id.toString()
//   Photo.find(query)
//   .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
//   .then(pics => res.json(pics))
//   .catch(next)
// })

module.exports = router;
