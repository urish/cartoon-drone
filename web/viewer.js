/* Copyright (C) 2014 Uri Shaked. License: MIT */

var i = 0;

setInterval(function() {
    document.getElementById('image1').src = '/image.png?t=' + i++;
}, 100);