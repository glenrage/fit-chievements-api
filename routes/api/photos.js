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

AWS.config.setPromisesDependency(require('bluebird'))

// module constants
const s3 = new AWS.S3()
const dataDir =`${__dirname}/../../data`
const upload = multer({dest: dataDir })
const s3UploadPromise = require('../../config/s3-upload-promise.js')
var multipart=require('connect-multiparty');

router.post('/photo/', upload.single('file'), function(req, res, next){
    console.dir('2nd TEST: ' + JSON.stringify(req.file));
    console.dir('REQUEST OBJECT : ' + req.body.file)

    let ext = path.extname(req.body.file);
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
    .then((photo) => res.json(photo))
    .catch(err => res.send(err));
})

module.exports = router;
