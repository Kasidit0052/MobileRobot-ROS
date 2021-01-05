//// Dependencies
var fs = require('fs');
var http = require('http');
var path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const { exec , spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 8000;
////////// ROSLIBJS Init
var ROSLIB = require('roslib');
const { json } = require('body-parser');
var ros = new ROSLIB.Ros();
////////// HTTP Configurations
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
////////// Current Directory
const current_path = process.cwd();



////////// Global variables of the mobile robot

// AMCL Pose
global.Pose;

// Odometry Pose
global.odomPose;

// Command Velocity
global.cmd_vel;

// Ros Connection Status
global.rosIsConnected = false;

// Current Navigation map name
global.navMapName = "";
//////////



////////// Set connect Interval for ROS

// add this handler before emitting any events
process.on('uncaughtException', function (err) {
    console.log('UNCAUGHT EXCEPTION - keeping process alive:', err); 
    ros = new ROSLIB.Ros();

    // Reinit Rostopic and ActionClients
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

    // Reattach Subscriber to callback functions
    odom_listener.subscribe(odom_callback);
    amcl_listener.subscribe(amcl_callback);
    cmd_vel_listener.subscribe(cmd_vel_callback);
});

// Attach function
function init_ros() {
  //ros.connect("ws://172.16.10.20:9090");
  ros.connect("ws://192.168.1.30:9090");
  if (ros.isConnected) {
    global.rosIsConnected = true;
  } else {
    global.rosIsConnected = false;
  }
}

// Set Interval
intervalid = setInterval(init_ros,1000);

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

// MobileRobot Movebase using Coordinate (usages=> {"CoordinateX" : 2.5 , "CoordinateY" ; 3.0})
app.post('/api/moveBaseCoordinate', (req, res) => {
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
    console.log(result);
  });
});

// cancel MobileRobot Goal (usages=> no input required)
app.get('/api/robot_cancel', (req, res) => {
  console.log("robot just cancelled");
  actionClient.cancel();
  res.json("robot just cancelled");
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
app.post('/api/savePoint', (req, res) => {

  // location name variable
  const location_name = req.body.name;

  // location poseMessage variable
  const location_poseMessage = req.body.poseMessage;

  // path to  persistent_database
  const filepath = path.join(current_path,'/scripts/persistent_data.txt');           
  
  // check if files exist or not
  if(fs.existsSync(filepath)){

      // both point name and pose are presented
      if( typeof location_name != "undefined" &&  typeof location_poseMessage != "undefined")
      {
        // read json file
        fs.readFile(filepath, 'utf8', function (err,data) {
          if (err) throw err;
          obj = JSON.parse(data);

          // add mapName to Javascript object
          newPoint = req.body;
          newPoint.navMapName = global.navMapName;

         // append new point to an existing json object
         obj.push(newPoint);
          
         // append new point to an existing json object{"frame_id":"map"}
          fs.writeFile(filepath, JSON.stringify(obj) , function (err) {
            if (err) throw err;
            res.json('File writed successfully.');
          });
        });
      } 

      // Added Case (only point name)
      else if(typeof location_name != "undefined"){
        // read json file
        fs.readFile(filepath, 'utf8', function (err,data) {
          if (err) throw err;
          obj = JSON.parse(data);

          // create a targetPose instance
          targetPose = new Object();
          targetPose.header = {frame_id:"map"};
          targetPose.Pose = global.Pose;

          // create a poseMessage instance
          poseMessage = new Object();
          poseMessage.targetPose = targetPose;

          // add mapName and current point to Javascript object
          newPoint = req.body;
          newPoint.poseMessage = poseMessage;
          newPoint.navMapName = global.navMapName;
          
         // append new point to an existing json object
          obj.push(newPoint);

          // rewrite the json file
          fs.writeFile(filepath, JSON.stringify(obj) , function (err) {
            if (err) throw err;
            res.json('File writed successfully.');
          });
        });
      }
      
      else
      {
        res.json("wrong format"); 
      } 
  }
  else{
      // Initialize Json file
      fs.writeFile(filepath, '[]', function (err) {
        if (err) throw err;
      });

      // both point name and pose are presented
      if( typeof location_name != "undefined" &&  typeof location_poseMessage != "undefined")
      {
        // read json file
        fs.readFile(filepath, 'utf8', function (err,data) {
          if (err) throw err;
          obj = JSON.parse(data);

          // add mapName to Javascript object
          newPoint = req.body;
          newPoint.navMapName = global.navMapName;
          
         // append new point to an existing json object
         obj.push(newPoint);

          // rewrite the json file
          fs.writeFile(filepath, JSON.stringify(obj) , function (err) {
            if (err) throw err;
            res.json('File writed successfully.');
          });
        });
      }

      // Added Case
      else if(typeof location_name != "undefined"){
        // read json file
        fs.readFile(filepath, 'utf8', function (err,data) {
          if (err) throw err;
          obj = JSON.parse(data);

          // create a targetPose instance
          targetPose = new Object();
          targetPose.header = {frame_id:"map"};
          targetPose.Pose = global.Pose;

          // create a poseMessage instance
          poseMessage = new Object();
          poseMessage.targetPose = targetPose;

          // add mapName and current point to Javascript object
          newPoint = req.body;
          newPoint.poseMessage = poseMessage;
          newPoint.navMapName = global.navMapName;
          
         // append new point to an existing json object
          obj.push(newPoint);

          // rewrite the json file
          fs.writeFile(filepath, JSON.stringify(obj) , function (err) {
            if (err) throw err;
            res.json('File writed successfully.');
          });
        });

      }
      
      else
      {
        res.json("wrong format"); 
      } 
  }
});

// Send lists of location
app.get('/api/loadPoint', (req, res) => {
  // path to  persistent_database
  const filepath = path.join(current_path,'/scripts/persistent_data.txt'); 

  // Check whether file is exist or not
  if(fs.existsSync(filepath)){
    // read and return location lists
    fs.readFile(filepath, 'utf8', function (err,data) {
      if (err) throw err;
      obj = JSON.parse(data);

      // filter value by navMapname 
      var filtered_obj = obj.filter(function(el) {
        return el.navMapName === global.navMapName;
      });

      var response_array = [];
      for(var key in filtered_obj){response_array.push(filtered_obj[key].name);}
      res.json(response_array);
    });
  }
  else{
    res.json("no point to load");
  }
});

// MobileRobot Movebase using Location (usages=> {"location_index" : key_valuekey_value(0,1,2,3)})
app.post('/api/moveBasePoint', (req, res) => {

  // path to  persistent_database
  const filepath = path.join(current_path,'/scripts/persistent_data.txt'); 

  // Check whether file is exist or not
  if(fs.existsSync(filepath))
  {
    // read and Instaitiate Actionlib Goal
    fs.readFile(filepath, 'utf8', function (err,data) {

      // throw error 
      if (err) throw err;

      // load JSON string to javascript object
      obj = JSON.parse(data);
      
      // filter value by navMapname 
      var filtered_obj = obj.filter(function(el) {
        return el.navMapName === global.navMapName;
      });

      // reference Goal Pose from json object
      reference_pose = filtered_obj[parseInt(req.body.location_index)].poseMessage.targetPose.Pose;


      // Initializing ROSLIB Goal Pose
      var positionVec3 = new ROSLIB.Vector3(null);
      var orientation = new ROSLIB.Quaternion({x:0, y:0, z:0, w:1.0});

      // Assign the reference Goal Pose to ROSLIB Goal Pose
      positionVec3.x = parseFloat(reference_pose.position.x);
      positionVec3.y = parseFloat(reference_pose.position.y);
      positionVec3.z = parseFloat(reference_pose.position.z);
      orientation.x = parseFloat(reference_pose.orientation.x);
      orientation.y = parseFloat(reference_pose.orientation.y);
      orientation.z = parseFloat(reference_pose.orientation.z);
      orientation.w = parseFloat(reference_pose.orientation.w);
      
      var pose = new ROSLIB.Pose({
        position : positionVec3,
        orientation : orientation
      });
  
      // Initializing Goal 
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

      res.json("robot move sucessfully");
    });
  }
  else{
    res.json("no point to load");
  }
});

// get Map Lists (Experimental)
app.get('/api/getMapList',(req, res) => {
  // Folder filtering Argument
  const mapPath = path.join(current_path,'map'); 
  var result = []; //this is going to contain paths

  if(fs.existsSync(mapPath))
  {
    fs.readdir(mapPath, function (err, filesPath) {
      if (err) throw err;
      result = filesPath.map(function (filePath) {
          return filePath;
      });
      res.json({mapLists : result});
    });
  }
  else
  {
    fs.mkdirSync(mapPath);
    res.json("No Map");
  }
});

// Open specific map (usages=> {"map_index" : key_value(0,1,2,3)}) (Experimental)
global.mapProcess;
app.post('/api/getMap', (req, res) => {

  // Folder filtering Argument
  const EXTENSION = '.yaml';
  var map_folder_name = "";
  const mapPath = path.join(current_path,'map'); 
  var result = []; //this is going to contain paths

  if(fs.existsSync(mapPath))
  {
    // Read Directories
    fs.readdir(mapPath, function (err, filesPath) {

        if (err) throw err;
        result = filesPath.map(function (filePath) {
            return filePath;
        });

        if(req.body.map_index != 'NA')
        {
          // Kill and Create new Map Server Child Process
          if(global.mapProcess){global.mapProcess.kill();}

          map_folder_name = result[parseInt(req.body.map_index)];
          map_file_name = result[parseInt(req.body.map_index)];

          const currentMapPath = path.join(mapPath,map_folder_name,map_file_name + EXTENSION); 
          global.mapProcess = spawn('rosrun',['map_server', 'map_server', currentMapPath],{stdio: 'inherit'})
          res.json(currentMapPath);

        }
        else
        {
          console.log("passed");
          // Close Map Server Child Process
          if(global.mapProcess){global.mapProcess.kill();}
        } 

    });
  }
  else
  {
    fs.mkdirSync(mapPath);
  }

});

// Delete specific map (usages=> {"map_index" : key_value(0,1,2,3)}) (Experimental)
app.post('/api/deleteMap', (req, res) => {
  // Kill Current Map Process (prepare to delete)
  if(global.mapProcess){global.mapProcess.kill();}

  // Folder filtering Argument
  const mapPath = path.join(current_path,'map'); 
  var result = []; //this is going to contain paths

  fs.readdir(mapPath, function (err, filesPath) {
    if (err) throw err;
    result = filesPath.map(function (filePath) {
        return filePath;
    });

    // Check whether the file is exist or not
    if(typeof result[parseInt(req.body.map_index)] !== "undefined")
    {
      const map_folder_name = result[parseInt(req.body.map_index)];
      const path_to_mapFolder = path.join(mapPath,map_folder_name);
      fs.rmdirSync(path_to_mapFolder, { recursive: true });
      res.json("File is sucessfully deleted");
    }
    else{
      res.json("File is Not existed");
    }
  });

});

// Mobile Robot Slam API (Experimental) (usages=> {"map_name" : "Test"}) (Experimental)
global.slamProcess;
global.mapName = "";
app.post('/api/createMap',(req, res) => {
  // path to  map_database
  const mapPath = path.join(current_path,'map'); 
  if(!fs.existsSync(mapPath))
  {
    fs.mkdirSync(mapPath);
    fs.mkdirSync(path.join(mapPath,req.body.map_name));
    global.mapName = req.body.map_name;
    global.slamProcess = spawn('roslaunch',['turtlebot3_slam', 'turtlebot3_slam.launch'],{stdio: 'inherit'});
    res.json("Directory created");
  }
  else
  {
    fs.mkdirSync(path.join(mapPath,req.body.map_name));
    global.mapName = req.body.map_name;
    global.slamProcess = spawn('roslaunch',['turtlebot3_slam', 'turtlebot3_slam.launch'],{stdio: 'inherit'})
    res.json("Directory existed");
  }
});

// Mobile Robot map saver API (Experimental) (usages=> {"confirm" : "YES/NO"}) (Experimental)
app.post('/api/saveMap',(req, res) => {
  console.log(req.body);
  // path to  map_database
  const mapPath = path.join(current_path,'map'); 
  if(req.body.confirm == "YES")
  {
    exec(`rosrun map_server map_saver -f ${path.join(mapPath,global.mapName,global.mapName)}`, (error, stdout, stderr) => {
      if (error) {
          console.error(`exec error: ${error}`);
          return;
      }
      console.log("kill process");
      global.slamProcess.kill();
      res.json("Save map");
    });
  }
  if(req.body.confirm == "NO")
  {
    fs.rmdirSync(path.join(mapPath,global.mapName));
    global.slamProcess.kill();
    res.json("Discard map");
  }
});



// Mobile Robot NAV API (Experimental) (usages=> {"map_index" : key_value(0,1,2,3)}) (Experimental)
global.navProcess;
global.navStatus = false;
app.post('/api/mapNavigation',(req, res) => {

  // path to  map_database
  const EXTENSION = '.yaml';
  const mapPath = path.join(current_path,'map'); 

  fs.readdir(mapPath, function (err, filesPath) {
    if (err) throw err;
    result = filesPath.map(function (filePath) {
        return filePath;
    });

    // Check whether the file is exist or not
    if(typeof result[parseInt(req.body.map_index)] !== "undefined")
    {
      const map_folder_name = result[parseInt(req.body.map_index)];
      const map_file_name =  result[parseInt(req.body.map_index)];
      const path_to_mapFolder = path.join(mapPath,map_folder_name);
      const path_to_mapFile = path.join(path_to_mapFolder,map_file_name.concat(EXTENSION));

      if(!global.navStatus)
      { 
        //Spawn Navigation Process
        global.navProcess = spawn('roslaunch',['turtlebot3_navigation', 'turtlebot3_navigation.launch', 'map_file:='.concat(path_to_mapFile)],{stdio: 'inherit'});
        res.json("Navigation process sucessfully open");

        // define global variable for map name
        global.navMapName = map_folder_name;

        // change navigation status
        global.navStatus = true;
      }
      else
      {
        //Kill Navigation Process
        global.navProcess.kill();
        res.json("Navigation process sucessfully closed");

        // reset global variable for map name
        global.navMapName = "";

        // change navigation status
        global.navStatus = false;
      }
    }
    else{
      res.json("File is Not existed");
    }
  });
});


// Admin Page Refresh Startup
app.get('/api/adminStartUp',(req, res) => {
  if(global.navProcess){global.navProcess.kill();global.navStatus = false;}
  if(global.slamProcess){global.slamProcess.kill();}
  if(global.mapProcess){global.mapProcess.kill();}
  res.json("Hello world");
});

//////////



////////// Specific listening port
app.listen(port, () => console.log(`Listening on port ${port}`));


////////// Host HTTP website
const publicDirectoryPath = path.join(__dirname, '/kraibot_vanilla');
app.use(express.static(publicDirectoryPath));

// default URL for website
app.use('/', function(req,res){
    res.sendFile(path.join(publicDirectoryPath+'/index.html'));
    //__dirname : It will resolve to your project folder.
});const server = http.createServer(app);
