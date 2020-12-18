//// Dependencies
var fs = require('fs');
var path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 8000;
////////// ROSLIBJS Init
var ROSLIB = require('roslib');
var ros = new ROSLIB.Ros();
////////// HTTP Configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



////////// Set connect Interval for ROS

// Attach function
function init_ros() {
  ros.connect('ws://172.16.10.20:9090');
  if(ros.isConnected){global.rosIsConnected = true;}
  else{global.rosIsConnected = false;}
}
// Set Interval
intervalid = setInterval(init_ros,1000);

//////////



////////// Global variables of the mobile robot

// AMCL Pose
global.Pose;

// Odometry Pose
global.odomPose;

// Command Velocity
global.cmd_vel;

// Ros Connection Status
global.rosIsConnected = false;

//////////



////////// Init RosTopic and ActionClients

// Init MoveBase Client
var actionClient = new ROSLIB.ActionClient({
  ros : ros,
  serverName : '/move_base',
  actionName : 'move_base_msgs/MoveBaseAction'
});

// Init Odometry listener
var odom_listener = new ROSLIB.Topic({
  ros : ros,
  name : '/odom',
  messageType : 'nav_msgs/Odometry'
});

// Init AMCL listener
var amcl_listener = new ROSLIB.Topic({
  ros : ros,
  name : '/amcl_pose',
  messageType : 'geometry_msgs/PoseWithCovarianceStamped'
});

// Init Cmd_Vel listener
var cmd_vel_listener = new ROSLIB.Topic({
  ros : ros,
  name : '/cmd_vel',
  messageType : 'geometry_msgs/Twist'
});

//////////



////////// Callback Functions

// Odometry callback function
function odom_callback(message) 
{
  global.odomPose = message.pose.pose;
  //console.log(`Received position:${JSON.stringify(global.odomPose)}`);
}

// AMCL callback function
function amcl_callback(message) 
{
  global.Pose = message.pose.pose;
  //console.log(`Received position:${JSON.stringify(global.Pose)}`);
}

// Cmd_Vel callback function
function cmd_vel_callback(message) 
{
  global.cmd_vel = message;
  //console.log(`Received velocity:${JSON.stringify(global.cmd_vel)}`);
}

//////////



////////// Attach Subscriber to callback functions
odom_listener.subscribe(odom_callback);
amcl_listener.subscribe(amcl_callback);
cmd_vel_listener.subscribe(cmd_vel_callback);
//////////



////////// APIS

// get Position 
app.get('/api/getPose', (req, res) => {
  // return stringify AMCL pose
  res.send(JSON.stringify(global.Pose));
});

// get Velocity
app.get('/api/getVel', (req, res) => {
  // return stringify cmd_vel
  res.send(JSON.stringify(global.cmd_vel));
});

// get Connections
app.get('/api/getConnection', (req, res) => {
  // return ros connection status
  res.send(JSON.stringify(global.rosIsConnected));
});

// MobileRobot ActionClient (usages=> {"CoordinateX" : 2.5 , "CoordinateY" ; 3.0})
app.post('/api/coordinate', (req, res) => {
  // Initializing Goal 
  var positionVec3 = new ROSLIB.Vector3(null);
  var orientation = new ROSLIB.Quaternion({x:0, y:0, z:0, w:1.0});
  positionVec3.x = parseFloat(req.body.CoordinateX);
  positionVec3.y = parseFloat(req.body.CoordinateY);
  positionVec3.z = 0;
  
  var pose = new ROSLIB.Pose({
    position : positionVec3,
    orientation : orientation
  });
  
  var goal = new ROSLIB.Goal({
      actionClient : actionClient,
      goalMessage : {target_pose : {
        header : {
          frame_id : 'map'
        },
          pose : pose
        }
      }
  });

  // Send Goal
  goal.send();

  // Check for Feedback
  goal.on('feedback',function(feedback)
  {
    //console.log(feedback);
  });

  // Check for result and stop actionclient
  goal.on('result',function(result)
  {
    actionClient.cancel();
    //console.log(result);
  });
});

// cancel MobileRobot Goal (usages=> no input required)
app.post('/api/robot_cancel', (req, res) => {
  console.log("robot just cancelled");
  actionClient.cancel();
});

// get Map lists
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

// open specific map
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

// deleter specific map
app.post('/api/deleteMap', (req, res) => {
  var EXTENSION = '.yaml';
  var dirPath = '/home/parallels/map';
  if(global.MapProcess){global.MapProcess.kill();}
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
      })

      fs.unlink(path.join(dirPath,fileNametoDelete.concat(".pgm")), (err) => {
        if (err) {
          console.error(err)
          return
        }
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
//////////



////////// Specific listening port
app.listen(port, () => console.log(`Listening on port ${port}`));