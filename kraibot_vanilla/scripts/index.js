const localhost = "172.16.10.20";
var ros = new ROSLIB.Ros({});
var viewer = null;

setInterval(()=>{
  const statusElem = document.querySelector(".connection-status");
  if(!ros.isConnected){ 
    statusElem.innerText = "Disconnected";
    ros.connect(`ws://${localhost}:9090`)
  }
  else{
    statusElem.innerText = "Connected";
  };
  }, 1000);

function onResizemap() {
  let mapWidth  = Math.ceil(window.innerWidth);
  
  document.getElementById('map-canvas').style.width  = (mapWidth*0.5)+"px";
  document.getElementById('map-canvas').style.height = (mapWidth*0.3)+"px";
  //viewer.scaleToDimensions(2,2);

}
  
window.addEventListener("resize",onResizemap)

function mapselected(a){
  console.log(a.value)
}

function init() {

  handleMode('manual');

  viewer = new ROS2D.Viewer({
    divID : 'map',
    width :  Math.ceil(window.innerWidth*0.5),
    height : Math.ceil(window.innerWidth*0.3),
  });

    // Setup the map client.
  var gridClient = new ROS2D.OccupancyGridClient({
    ros : ros,
    rootObject : viewer.scene,
    continuous: true,
    // continuous: continuous,
  });
    // Scale the canvas to fit to the map
  gridClient.on('change', function(){
    viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
    viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
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

function handleCreatemap(){
  const createMapElem = document.querySelector(".createMapBtn");
  const saveMapElem = document.querySelector(".saveMapBtn");
  const deleteMapElem = document.querySelector(".deleteMapBtn");
  const mapName = prompt('SAVE MAP AS');
  if (!(mapName === null)) {
    handleMode('slam');
    createMapElem.disabled = true;
    saveMapElem.disabled = false;
    deleteMapElem.disabled = true;
  } 
}

function handleSavemap(){
  const createMapElem = document.querySelector(".createMapBtn");
  const saveMapElem = document.querySelector(".saveMapBtn");
  const deleteMapElem = document.querySelector(".deleteMapBtn");
  var mapSave = window.confirm("Save data?");
  if (mapSave) {
    // delete from database
    alert('map saved')
    handleMode('manual');
    createMapElem.disabled = false;
    saveMapElem.disabled = true;
    deleteMapElem.disabled = false;
  }
}

function handleDeletemap(){
  var deleteMap = window.confirm("Delete data?");
  if (deleteMap) {
    // delete from database
    alert('map deleted');
  }
}

