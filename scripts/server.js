//// Dependencies
var fs = require("fs");
var path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const app = express();
const port = process.env.PORT || 8000;
////////// ROSLIBJS Init
var ROSLIB = require("roslib");
const { json } = require("body-parser");
var ros = new ROSLIB.Ros();
////////// HTTP Configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
////////// Current Directory
const current_path = process.cwd();

////////// Set connect Interval for ROS

// Attach function
function init_ros() {
  ros.connect("ws://localhost:9090");
  if (ros.isConnected) {
    global.rosIsConnected = true;
  } else {
    global.rosIsConnected = false;
  }
}
// Set Interval
intervalid = setInterval(init_ros, 100);

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
  ros: ros,
  serverName: "/move_base",
  actionName: "move_base_msgs/MoveBaseAction",
});

// Init Odometry listener
var odom_listener = new ROSLIB.Topic({
  ros: ros,
  name: "/odom",
  messageType: "nav_msgs/Odometry",
});

// Init AMCL listener
var amcl_listener = new ROSLIB.Topic({
  ros: ros,
  name: "/amcl_pose",
  messageType: "geometry_msgs/PoseWithCovarianceStamped",
});

// Init Cmd_Vel listener
var cmd_vel_listener = new ROSLIB.Topic({
  ros: ros,
  name: "/cmd_vel",
  messageType: "geometry_msgs/Twist",
});

//////////

////////// Callback Functions

// Odometry callback function
function odom_callback(message) {
  global.odomPose = message.pose.pose;
  //console.log(`Received position:${JSON.stringify(global.odomPose)}`);
}

// AMCL callback function
function amcl_callback(message) {
  global.Pose = message.pose.pose;
  //console.log(`Received position:${JSON.stringify(global.Pose)}`);
}

// Cmd_Vel callback function
function cmd_vel_callback(message) {
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
app.get("/api/getPose", (req, res) => {
  // return stringify AMCL pose
  res.send(JSON.stringify(global.Pose));
});

// get Velocity
app.get("/api/getVel", (req, res) => {
  // return stringify cmd_vel
  res.send(JSON.stringify(global.cmd_vel));
});

// get Connections
app.get("/api/getConnection", (req, res) => {
  // return ros connection status
  res.send(JSON.stringify(global.rosIsConnected));
});

// MobileRobot Movebase using Coordinate (usages=> {"CoordinateX" : 2.5 , "CoordinateY" ; 3.0})
app.post("/api/moveBaseCoordinate", (req, res) => {
  // Initializing Goal
  var positionVec3 = new ROSLIB.Vector3(null);
  var orientation = new ROSLIB.Quaternion({ x: 0, y: 0, z: 0, w: 1.0 });
  positionVec3.x = parseFloat(req.body.CoordinateX);
  positionVec3.y = parseFloat(req.body.CoordinateY);
  positionVec3.z = 0;

  var pose = new ROSLIB.Pose({
    position: positionVec3,
    orientation: orientation,
  });

  var goal = new ROSLIB.Goal({
    actionClient: actionClient,
    goalMessage: {
      target_pose: {
        header: {
          frame_id: "map",
        },
        pose: pose,
      },
    },
  });

  // Send Goal
  goal.send();

  // Check for Feedback
  goal.on("feedback", function (feedback) {
    //console.log(feedback);
  });

  // Check for result and stop actionclient
  goal.on("result", function (result) {
    actionClient.cancel();
    //console.log(result);
  });
});

// cancel MobileRobot Goal (usages=> no input required)
app.post("/api/robot_cancel", (req, res) => {
  console.log("robot just cancelled");
  actionClient.cancel();
});

// Receive Point and save as Json File
// Usages:
// {
//   "name":"Robotic Lab",
//   "poseMessage":
//   {
//       "targetPose":
//       {
//           "header":{"frame_id":"map"},
//           "Pose":
//           {
//               "position":{"x":"0.2","y":"0.1","z":"0.3"},
//               "orientation":{"x":"1","y":"2","z":"3","w":"4"}
//           }
//       }
//   }
// }
app.post("/api/savePoint", (req, res) => {
  // location name variable
  const location_name = req.body.name;

  // location poseMessage variable
  const location_poseMessage = req.body.poseMessage;

  // path to  persistent_database
  const filepath = path.join(current_path, "/scripts/persistent_data.txt");

  // check if files exist or not
  if (fs.existsSync(filepath)) {
    // check json structure
    if (
      typeof location_name != "undefined" &&
      typeof location_poseMessage != "undefined"
    ) {
      // read json file
      fs.readFile(filepath, "utf8", function (err, data) {
        if (err) throw err;
        obj = JSON.parse(data);
        // append new point to an existing json object
        obj.push(req.body);

        // rewrite the json file
        fs.writeFile(filepath, JSON.stringify(obj), function (err) {
          if (err) throw err;
          res.json("File writed successfully.");
        });
      });
    } else {
      res.json("wrong format");
    }
  } else {
    // Initialize Json file
    fs.writeFile(filepath, "[]", function (err) {
      if (err) throw err;
    });

    // check json structure
    if (
      typeof location_name != "undefined" &&
      typeof location_poseMessage != "undefined"
    ) {
      // read json file
      fs.readFile(filepath, "utf8", function (err, data) {
        if (err) throw err;
        obj = JSON.parse(data);
        // append new point to an existing json object
        obj.push(req.body);

        // rewrite the json file
        fs.writeFile(filepath, JSON.stringify(obj), function (err) {
          if (err) throw err;
          res.json("File writed successfully.");
        });
      });
    } else {
      res.json("wrong format");
    }
  }
});

// Send lists of location
app.get("/api/loadPoint", (req, res) => {
  // path to  persistent_database
  const filepath = path.join(current_path, "/scripts/persistent_data.txt");

  // Check whether file is exist or not
  if (fs.existsSync(filepath)) {
    // read and return location lists
    fs.readFile(filepath, "utf8", function (err, data) {
      if (err) throw err;
      obj = JSON.parse(data);

      var response_array = [];
      for (var key in obj) {
        response_array.push(obj[key].name);
      }

      res.json(response_array);
    });
  } else {
    res.json("no point to load");
  }
});

// MobileRobot Movebase using Location (usages=> {"location_index" : key_valuekey_value(0,1,2,3)})
app.post("/api/moveBasePoint", (req, res) => {
  // path to  persistent_database
  const filepath = path.join(current_path, "/scripts/persistent_data.txt");

  // Check whether file is exist or not
  if (fs.existsSync(filepath)) {
    // read and Instaitiate Actionlib Goal
    fs.readFile(filepath, "utf8", function (err, data) {
      // throw error
      if (err) throw err;

      // load JSON string to javascript object
      obj = JSON.parse(data);

      // reference Goal Pose from json object
      reference_pose =
        obj[parseInt(req.body.location_index)].poseMessage.targetPose.Pose;

      // Initializing ROSLIB Goal Pose
      var positionVec3 = new ROSLIB.Vector3(null);
      var orientation = new ROSLIB.Quaternion({ x: 0, y: 0, z: 0, w: 1.0 });

      // Assign the reference Goal Pose to ROSLIB Goal Pose
      positionVec3.x = parseFloat(reference_pose.position.x);
      positionVec3.y = parseFloat(reference_pose.position.y);
      positionVec3.z = parseFloat(reference_pose.position.z);
      orientation.x = parseFloat(reference_pose.orientation.x);
      orientation.y = parseFloat(reference_pose.orientation.y);
      orientation.z = parseFloat(reference_pose.orientation.z);
      orientation.w = parseFloat(reference_pose.orientation.w);

      var pose = new ROSLIB.Pose({
        position: positionVec3,
        orientation: orientation,
      });

      // Initializing Goal
      var goal = new ROSLIB.Goal({
        actionClient: actionClient,
        goalMessage: {
          target_pose: {
            header: {
              frame_id: "map",
            },
            pose: pose,
          },
        },
      });

      // Send Goal
      goal.send();

      // Check for Feedback
      goal.on("feedback", function (feedback) {
        //console.log(feedback);
      });

      // Check for result and stop actionclient
      goal.on("result", function (result) {
        actionClient.cancel();
        //console.log(result);
      });

      res.json("robot move sucessfully");
    });
  } else {
    res.json("no point to load");
  }
});

// get Map Lists (Experimental)
app.get("/api/getMapList", (req, res) => {
  // File filtering Argument
  var EXTENSION = ".yaml";
  var dirPathtoMapFolder = "/home/parallels/map";

  // Read Directory and return list of file
  fs.readdir(dirPathtoMapFolder, function (err, files) {
    var targetFiles = files.filter(function (file) {
      return path.extname(file).toLowerCase() === EXTENSION;
    });
    res.json({ mapLists: targetFiles });
  });
});

// Open specific map (usages=> {"map_index" : key_value(0,1,2,3)}) (Experimental)
global.MapProcess;
app.post("/api/getMap", (req, res) => {
  // selectedMap Filename
  var map_file = "";

  // File filtering Argument
  var EXTENSION = ".yaml";
  var dirPathtoMapFolder = "/home/parallels/map";

  console.log(req.body);
  // Read Directory and return list of file
  fs.readdir(dirPathtoMapFolder, function (err, files) {
    var targetFiles = files.filter(function (file) {
      return path.extname(file).toLowerCase() === EXTENSION;
    });

    if (req.body.map_index != "NA") {
      // Kill and Create new Map Server Child Process
      if (global.MapProcess) {
        global.MapProcess.kill();
      }
      console.log(req.body);
      map_file = targetFiles[parseInt(req.body.map_index)];
      var absoluteDir = dirPathtoMapFolder + "/" + map_file;
      global.MapProcess = spawn(
        "rosrun",
        ["map_server", "map_server", absoluteDir],
        { stdio: "inherit" }
      );
    } else {
      // Close Map Server Child Process
      if (global.MapProcess) {
        global.MapProcess.kill();
      }
    }
  });
});

// Delete specific map (usages=> {"map_index" : key_value(0,1,2,3)}) (Experimental)
app.post("/api/deleteMap", (req, res) => {
  // File filtering Argument
  var EXTENSION = ".yaml";
  var dirPathtoMapFolder = "/home/parallels/map";

  // Kill Current Map Process (prepare to delete)
  if (global.MapProcess) {
    global.MapProcess.kill();
  }

  // Read Directory and return list of file
  fs.readdir(dirPathtoMapFolder, function (err, files) {
    var targetFiles = files.filter(function (file) {
      return path.extname(file).toLowerCase() === EXTENSION;
    });

    // Check whether the file is exist or not
    if (typeof targetFiles[parseInt(req.body.map_index)] !== "undefined") {
      fileNametoDelete = targetFiles[parseInt(req.body.map_index)].replace(
        ".yaml",
        ""
      );

      // Remove Both map.pgm and map.yaml
      fs.unlink(
        path.join(dirPathtoMapFolder, fileNametoDelete.concat(".yaml")),
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
        }
      );
      fs.unlink(
        path.join(dirPathtoMapFolder, fileNametoDelete.concat(".pgm")),
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
        }
      );

      // Return new Maplist to users
      fs.readdir(dirPathtoMapFolder, function (err, files) {
        var targetFiles = files.filter(function (file) {
          return path.extname(file).toLowerCase() === EXTENSION;
        });
        res.json({ mapLists: targetFiles });
      });
    }
  });
});
//////////

////////// Specific listening port
app.listen(port, () => console.log(`Listening on port ${port}`));
