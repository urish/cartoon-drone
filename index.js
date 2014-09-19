/* Copyright (C) 2014 Uri Shaked. License: MIT */

var arDrone = require('ar-drone');
var express = require('express');

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

app.get('/image.png', function(req, res) {
    if (lastImage) {
        res.write(lastImage);
    }
    res.end();
});