#!/usr/bin/env node

// Connecting to ROS 
var ROSLIB = require('roslib');

var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

ros.on('connection', function() {
console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
console.log('Connection to websocket server closed.');
});

// Publishing a Topic
// ------------------
var turtleClient = new ROSLIB.ActionClient({
    ros : ros,
    serverName : '/path_server',
    actionName : 'turtle_controller/Path'
  });

var goal = new ROSLIB.Goal({
    actionClient : turtleClient,
    goalMessage : {
        newPosition: [10.0,-10.0]
    }
});

goal.on('feedback', function(feedback) {
    console.log('Feedback: ' + feedback.sequence);
});

goal.on('result', function(result) {
    console.log('Final Result: ' + result.sequence);
});

goal.send();