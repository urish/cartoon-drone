/* Copyright (C) 2014 Uri Shaked. License: MIT */
'use strict';

var arDrone = require('ar-drone');
var express = require('express');
var cv = require('opencv');
var fs = require('fs');

var app = express();
app.use(express.static('web'));
app.listen(9222);

var client = arDrone.createClient();
var pngStream = client.getPngStream();
var lastImage = null;
pngStream.on('data', function (buffer) {
    if (!lastImage) {
        console.log('ready!');
    }
    lastImage = buffer;
});

app.get('/image.png', function (req, res) {
    if (lastImage) {
        cv.readImage(lastImage, function (err, im) {
            im.convertGrayscale()
            im.save('temp.jpg');
            res.write(fs.readFileSync('temp.jpg'));
            res.end();
        });
    } else {
        res.end();
    }
});
