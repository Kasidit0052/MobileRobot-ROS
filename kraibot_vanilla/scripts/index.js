const bodyParser = require("body-parser");

const localhost = "localhost";
var ros = new ROSLIB.Ros({});
const connected = false;
const setMode = 'manual'

function init() {

  const statusElem = document.querySelector(".connection-status");
  if(!ros.isConnected){ 
    ros.connect(`ws://${localhost}:9090`);
  }


  ros.on('connection', function(){
    console.log("Connected");
    handleMode('manual');
    statusElem.innerText = "Connected";
  })

  ros.on('error', function(){
     console.log("Error");
  })

  var viewer = new ROS2D.Viewer({
    divID : 'map',
    width : 600,
    height : 450
  });

    // Setup the map client.
  var gridClient = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : viewer.scene
  });
    // Scale the canvas to fit to the map
  gridClient.on('change', function(){
    viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
  });

  
}

function handleMode(mode) {
  const teleopElems = Array.from(document.querySelectorAll(".teleopBtn"));
  
  if (mode === 'manual') {
    teleopElems.forEach(teleopElem =>{
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = false;
  }
  else if (mode === 'nav') {
    teleopElems.forEach(teleopElem =>{
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = false;
  }
  else if (mode === 'init') {
    teleopElems.forEach(teleopElem =>{
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = true;
  }
  else if (mode === 'slam') {
    teleopElems.forEach(teleopElem =>{
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
  }
}


var vel_x = 0.0;
var angular_vel_z = 0.0;

  // initialozing turtletopic for teleop
var cmdVel = new ROSLIB.Topic({
  ros: ros,
  name: '/cmd_vel',
  messageType: 'geometry_msgs/Twist'
});

var twist = new ROSLIB.Message({
  linear : {
    x : 0.0,
    y : 0.0,
     z : 0.0
  },
  angular : {
    x : 0.0,
    y : 0.0,
    z : 0.0
  }
});

function handleTeleop(direction) {
  if(direction === 'forward') {
    //angular_vel_z = 0;
    vel_x += 0.1;
  }
  else if (direction === 'stop') {
    vel_x = 0.0;
    angular_vel_z = 0.0;
  }
  else if (direction === 'left') {
    //vel_x = 0;
    angular_vel_z += 0.1;
  }
  else if (direction === 'right') {
    //vel_x = 0;
    angular_vel_z -= 0.1;
  }
  else if (direction === 'back') {
    vel_x -= 0.1;
  }
  twist.linear.x = parseFloat(vel_x);
  twist.angular.z = parseFloat(angular_vel_z);
  console.log("Linear x:" + twist.linear.x + "Angular z:" +twist.angular.z);
  cmdVel.publish(twist);
}

// function handleCreatemap() {
//   const createMapElem = document.querySelector(".createMapBtn");
//   const state = "tosave";
//   // save map 
//   var mapName = prompt('SAVE MAP AS');
//   if (mapName === null) {
//     console.log('no'); 
//   }
//   else {
//     handleMode('slam');
//     const saveElem = document.createElement("button");
    
    
//   }
// }

