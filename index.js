/* Copyright (C) 2014 Uri Shaked. License: MIT */
'use strict';

var arDrone = require('ar-drone');
var express = require('express');
var cv = require('opencv');

var app = express();
app.use(express.static('web'));
app.listen(9222);

var client = arDrone.createClient();
var pngStream = client.getPngStream();

var openCV = new cv.ImageStream();
pngStream.pipe(openCV);

var ready = false;
var lowerThreshold = [0, 0, 30];
var upperThreshold = [50, 50, 255];

openCV.on('data', function (matrix) {
    if (!ready) {
        console.log('ready!');
        ready = true;
    }
    matrix.save('web/original.jpg');
    matrix.inRange(lowerThreshold, upperThreshold);
    matrix.save('web/processed.jpg');
});

