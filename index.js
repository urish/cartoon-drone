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
var lowerThreshold = [53, 50, 50];
var upperThreshold = [90, 255, 255];

var feedback = false;
var feedbackWait = false;
var feedbackDirection = '';

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
    if (feedback && !feedbackWait) {
        cloudFeedback(contours.boundingRect(contourLengths[0][1]));
    }

    matrix.save('web/processed.jpg');
});

function cloudFeedback(rect) {
    var centerX = rect.x + rect.width / 2;
    var centerY = rect.y + rect.height / 2;
    var factor = 1.5;
    // 640x360
    var deltaX = 320 - centerX;
    var deltaY = 180 - centerY;
    var errorX = Math.abs(deltaX / 180.0);
    var errorY = Math.abs(deltaY / 180.0);
    feedbackDirection = '';

    if (deltaY > 10) {
        client.front(errorY/factor);
        feedbackDirection = ' front';
    }
    if (deltaY < -10) {
        client.back(errorY/factor);
        feedbackDirection += ' back';
    }

    if (deltaX > 10) {
        client.left(errorX/factor);
        feedbackDirection += ' left';
    }

    if (deltaX < -10) {
        client.right(errorX/factor);
        feedbackDirection += ' right';
    }

//    if (errorY > errorX) {
//        if (deltaY > 10) {
//            client.front(feedbackSpeed);
//            feedbackDirection = 'front';
//        } else if (deltaY < -10)
//        {
//            client.back(feedbackSpeed);
//            feedbackDirection = 'back';
//        }
//    } else {
//        if (deltaX < -10) {
//            client.right(feedbackSpeed);
//            feedbackDirection = 'right';
//        } else if (deltaX > 10) {
//            client.left(feedbackSpeed);
//            feedbackDirection = 'left';
//        }
//    }

    if (!feedbackDirection) {
        client.stop();
    }

    feedbackWait = true;
    setTimeout(function () {
        feedbackWait = false;
        client.stop();
    }, 100);
}

app.get('/drone/takeoff', function (req, res) {
    client.takeoff();
    res.end();
});

app.get('/drone/land', function (req, res) {
    feedback = false;
    client.land();
    res.end();
});

app.get('/drone/stop', function (req, res) {
    feedback = false;
    client.stop();
    res.end();
});

app.get('/drone/clockwise', function (req, res) {
    client.clockwise(0.5);
    res.end();
});

app.get('/drone/up', function (req, res) {
    client.up(0.5);
    res.end();
});

app.get('/drone/cloud', function (req, res) {
    feedback = true;
    res.end();
});

app.get('/drone/feedbackDirection', function (req, res) {
    res.send(feedbackDirection);
});

client.createRepl();