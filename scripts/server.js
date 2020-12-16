var fs = require('fs');
var path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { exec, spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 8000;

// ROSLIBJS
var ROSLIB = require('roslib');
const { Console } = require('console');
var ros = new ROSLIB.Ros();

// Initializing turtleActionLibClient for Navigation
var turtleClient = new ROSLIB.ActionClient({
  ros : ros,
  serverName : '/ROS_Actionlib_server',
  actionName : 'turtle_controller/PathAction'
});

// HTTP Configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/admin',(req, res) => {
  var EXTENSION = '.yaml';
  var dirPath = '/home/parallels/map';
  fs.readdir(dirPath, function(err, files){
    var targetFiles = files.filter(function(file) {
      return path.extname(file).toLowerCase() === EXTENSION;
    });
    res.json({mapList : targetFiles});
  });
});

global.MapProcess;
app.post('/api/getMap', (req, res) => {

  var map_file = '';
  var EXTENSION = '.yaml';
  var dirPath = '/home/parallels/map';
  fs.readdir(dirPath, function(err, files){
    var targetFiles = files.filter(function(file) {
      return path.extname(file).toLowerCase() === EXTENSION;
    });

    if(req.body.mapServer_Status != 'NA')
    {
      if(global.MapProcess){global.MapProcess.kill();}
      map_file = targetFiles[parseInt(req.body.mapServer_Status)];
      var absoluteDir = dirPath+"/" + map_file;
      global.MapProcess = spawn('rosrun',['map_server', 'map_server', absoluteDir],{stdio: 'inherit'})
    }
    else
    {
      if(global.MapProcess){global.MapProcess.kill();}
    } 

  });
});

app.post('/api/deleteMap', (req, res) => {
  var EXTENSION = '.yaml';
  var dirPath = '/home/parallels/map';
  fs.readdir(dirPath, function(err, files){
    var targetFiles = files.filter(function(file) {
      return path.extname(file).toLowerCase() === EXTENSION;
    });
    if(typeof targetFiles[parseInt(req.body.deleteMap_Name)] !== "undefined")
    {
      fileNametoDelete = targetFiles[parseInt(req.body.deleteMap_Name)].replace('.yaml','');

      fs.unlink(path.join(dirPath,fileNametoDelete.concat(".yaml")), (err) => {
        if (err) {
          console.error(err)
          return
        }
        //file removed
      })

      fs.unlink(path.join(dirPath,fileNametoDelete.concat(".pgm")), (err) => {
        if (err) {
          console.error(err)
          return
        }
        //file removed
      })

      fs.readdir(dirPath, function(err, files){
        var targetFiles = files.filter(function(file) {
          return path.extname(file).toLowerCase() === EXTENSION;
        });
        res.json({mapList : targetFiles});
      });
      
    }

  });

});

/*
app.post('/api/coordinate', (req, res) => {
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.coordX},${req.body.coordY}`,
  );

  // Initializing Goal and Moving Turtlebot
  var goal = new ROSLIB.Goal({
    actionClient : turtleClient,
    goalMessage : {
        newPosition: [parseInt(req.body.coordX),parseInt(req.body.coordY)]
    }
  });
  goal.send();

});
*/

app.listen(port, () => console.log(`Listening on port ${port}`));