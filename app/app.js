require('dotenv').load();

/**
 //  app.js
 //  PhotoUploader
 //
 //  Copyright © 2017 NGINX Inc. All rights reserved.
 */

var promise = require('bluebird');
var rp = require('request-promise');

var aws = require('aws-sdk');
var express = require('express');
var multer = require('multer');
var multerS3 = require('multer-s3');
var uuid = require('node-uuid');
var path = require('path');

var app = express();

process.setuid("me");
// Configure AWS information:
// - Access key ID
// - Secret access key
// - S3 bucket endpoint
// - AWS region
aws.config.update({
    s3ForcePathStyle: true,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_URL,
    region: process.env.AWS_REGION
});

var s3 = new aws.S3();

// Define variable for image upload to S3
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET,
        key: function (req, file, cb) {
            cb(null, 'uploads/photos/' + uuid.v4() + '/original' + path.extname(file.originalname));
        }
    })
});

// Call resizer service via POST request
// Send url of image located within S3
// @return: resized images mapped as JSON
var resize = function (url) {
    var options = {
        method: 'POST',
        uri: process.env.RESIZER_URL,
        form: {
            url: url
        },
        json: true
    };

    return rp(options);
};

// Call album manager service via POST request
// Adds image to specified album based on album_id
// @return: response from album manager request
var createImage = function( user_id, album_id, image) {
    image.album_id = album_id;

    var options = {
        method: 'POST',
        uri: process.env.ALBUM_MANAGER_URL + '/images',
        form: {
            image: image
        },
        headers: {
            'Auth-ID': user_id
        },
        json: true
    };

    return rp(options);
};

// Service endpoint listening to /
// @return: string "Hello World!"
app.get('/', function (req, res) {
    res.send('Hello World!');
});

// Service endpoint listening to /image
// Uploads image to S3 bucket using upload variable
// @return: image, then adds it to album
app.post('/image', upload.single('image'), function (req, res) {
    if (req.file) {
        resize(decodeURIComponent(req.file.location))
            .then(function (result) {
                return createImage(req.headers['auth-id'], req.body.album_id, result);
            })
            .then(function (result) {
                res.setHeader('Content-Type', 'application/json');
                res.send(result);
            })
            .catch(function (e) {
                res.send(e);
            });
    } else {
        res.send("Missing image file/s");
    }
});

// Service endpoint listening to /image/uploads/photos/:uuid
// Delete all variations of image within S3 based on uuid
// @return: status of image deletion
app.delete('/image/uploads/photos/:uuid', function (req, res) {
    var params = {
        Bucket: process.env.S3_BUCKET,
        Key: 'uploads/photos/' + req.params.uuid
    };

    // Check if data deleted successfully
    s3.deleteObject(params, function (err, data) {
        if (err) {
            console.log("Delete image failure");

            if (this.httpResponse.body) {
                console.log(this.httpResponse.body.toString());
            }

            console.log(err, err.stack);
            res.send("ERROR DELETING FILES");
        } else {
            console.log('Successfully deleted image');
            res.send("Images deleted successfully");
        }
    });
});

// Server listening on default port 3000
var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Listening at http://%s:%s', host, port);
});
