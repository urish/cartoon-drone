/* Copyright (C) 2014 Uri Shaked. License: MIT */
'use strict';

(function () {
    var i = 0;

    setInterval(function () {
        document.getElementById('imageOriginal').src = '/original.jpg?t=' + i++;
        document.getElementById('imageProcessed').src = '/processed.jpg?t=' + i++;
    }, 100);

})();

angular.module('droneUI', []).
    controller('DroneClientCtrl', function ($scope, $http, $interval) {
        $scope.droneControl = function (cmd) {
            $http.get('/drone/' + cmd);
        };

        $interval(function () {
            $http.get('/drone/feedbackDirection').success(function (result) {
                $scope.feedbackDirection = result;
            });
        }, 100);
    });