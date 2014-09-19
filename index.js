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
var lowerThreshold = [110, 50, 50];
var upperThreshold = [130, 255, 255];

openCV.on('data', function (matrix) {
    if (!ready) {
        console.log('ready!');
        ready = true;
    }
    matrix.save('web/original.jpg');

    matrix.convertHSVscale();
    matrix.inRange(lowerThreshold, upperThreshold);

    var cloned = matrix.clone();
    var contours = cloned.findContours();
    var contourLengths = [];
    for (var i = 0; i < contours.size(); i++) {
        contourLengths.push([contours.arcLength(i, true), i]);
    }
    contourLengths.sort(function (left, right) {
        return right[0] - left[0];
    });

    matrix.cvtColor('CV_GRAY2BGR');
    var colors = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255]
    ];
    for (i = 0; i < Math.min(3, contourLengths.length); i++) {
        var rect = contours.boundingRect(contourLengths[i][1]);
        matrix.drawContour(contours, contourLengths[i][1], colors[i]);
        matrix.rectangle([rect.x, rect.y], [rect.width, rect.height], colors[i], 3);
    }

    matrix.save('web/processed.jpg');
});

