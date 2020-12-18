const localhost = "172.16.10.20";
var ros = new ROSLIB.Ros({});
var viewer = null;
var zoomView = null;
var panView = null;
var gridClient = null;

var maplist = null;
var pose_listener_amcl = null;

setInterval(() => {
  const statusElem = document.querySelector(".connection-status");
  if (!ros.isConnected) {
    statusElem.innerText = "Disconnected";
    ros.connect(`ws://${localhost}:9090`);
  } else {
    statusElem.innerText = "Connected";
  }
}, 1000);

// function onResizemap() {
//   let mapWidth  = Math.ceil(window.innerWidth);

//   document.getElementById('map-canvas').style.width  = (mapWidth*0.5)+"px";
//   document.getElementById('map-canvas').style.height = (mapWidth*0.3)+"px";
//   //viewer.scaleToDimensions(2,2);

// }

window.addEventListener("resize", function () {
  let mapWidth = Math.ceil(window.innerWidth);

  document.getElementById("map-canvas").style.width = mapWidth * 0.5 + "px";
  document.getElementById("map-canvas").style.height = mapWidth * 0.3 + "px";
  //viewer.scaleToDimensions(2,2);
});

function init() {
  handleMode("manual");

  viewer = new ROS2D.Viewer({
    divID: "map",
    width: Math.ceil(window.innerWidth * 0.5),
    height: Math.ceil(window.innerWidth * 0.3),
  });

  zoomView = new ROS2D.ZoomView({
    rootObject: viewer.scene,
  });

  panView = new ROS2D.PanView({
    rootObject: viewer.scene,
  });

  // Setup the map client.
  gridClient = new ROS2D.OccupancyGridClient({
    ros: ros,
    rootObject: viewer.scene,
    continuous: true,
    // continuous: continuous,
  });
  // Scale the canvas to fit to the map
  gridClient.on("change", function () {
    viewer.scaleToDimensions(
      gridClient.currentGrid.width,
      gridClient.currentGrid.height
    );
    viewer.shift(
      gridClient.currentGrid.pose.position.x,
      gridClient.currentGrid.pose.position.y
    );
    registerMouseHandlers();
  });

  gridClient.rootObject.addChild(robotMarker);

  //   const getMap = async function GetMap()  {
  //     const subscription  = await FetchMap();
  //     maplist = subscription;
  //   }
  //   getMap();
}

function handleMode(mode) {
  const teleopElems = Array.from(document.querySelectorAll(".teleopBtn"));

  if (mode === "manual") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = false;
  } else if (mode === "nav") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = false;
  } else if (mode === "init") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = true;
  } else if (mode === "slam") {
    teleopElems.forEach((teleopElem) => {
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
  name: "/cmd_vel",
  messageType: "geometry_msgs/Twist",
});

// sub amcl
var pose_listener_amcl = new ROSLIB.Topic({
  ros: ros,
  name: "/amcl_pose",
  messageType: "geometry_msgs/PoseWithCovarianceStamped",
});

// triangle for marking robot position
var robotMarker = new ROS2D.NavigationArrow({
  size: 0.1,
  strokeSize: 0.01,
  pulse: true,
  fillColor: createjs.Graphics.getRGB(119, 221, 119),
});

// function for obt to get position to robotmarker
function robotMarker_callback(pose) {
  robotMarker.x = pose.pose.pose.position.x;
  robotMarker.y = -pose.pose.pose.position.y;
  robotMarker.rotation =
    (new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(
        pose.pose.pose.orientation.x,
        pose.pose.pose.orientation.y,
        pose.pose.pose.orientation.z,
        pose.pose.pose.orientation.w
      )
    ).z *
      -180) /
    3.14159;
  console.log(robotMarker);
}

pose_listener_amcl.subscribe(robotMarker_callback);

//console.log(pose_listener_amcl);

var twist = new ROSLIB.Message({
  linear: {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  },
  angular: {
    x: 0.0,
    y: 0.0,
    z: 0.0,
  },
});

function handleTeleop(direction) {
  if (direction === "forward") {
    //angular_vel_z = 0;
    vel_x += 0.1;
  } else if (direction === "stop") {
    vel_x = 0.0;
    angular_vel_z = 0.0;
  } else if (direction === "left") {
    //vel_x = 0;
    angular_vel_z += 0.1;
  } else if (direction === "right") {
    //vel_x = 0;
    angular_vel_z -= 0.1;
  } else if (direction === "back") {
    vel_x -= 0.1;
  }
  twist.linear.x = parseFloat(vel_x);
  twist.angular.z = parseFloat(angular_vel_z);
  console.log("Linear x:" + twist.linear.x + "Angular z:" + twist.angular.z);
  cmdVel.publish(twist);
}

async function FetchMap() {
  const response = await fetch(`http://${localhost}:8000/admin`);
  const res = await response.json();
  return res.mapList;
}

async function MapServer(input) {
  const response = await fetch(`http://${localhost}:8000/api/getMap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mapServer_Status: input }),
  });
}

// function mapselected(eve){
//   console.log(a.value)
// }

function handleCreatemap() {
  const createMapElem = document.querySelector(".createMapBtn");
  const saveMapElem = document.querySelector(".saveMapBtn");
  const deleteMapElem = document.querySelector(".deleteMapBtn");
  const mapName = prompt("SAVE MAP AS");
  if (!(mapName === null)) {
    handleMode("slam");
    createMapElem.disabled = true;
    saveMapElem.disabled = false;
    deleteMapElem.disabled = true;
    MapCreate(true);
  }
}

async function MapCreate(input) {
  const response = await fetch(`http://${localhost}:8000/api/createMap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ createMap: input }),
  });
}

function handleSavemap() {
  const createMapElem = document.querySelector(".createMapBtn");
  const saveMapElem = document.querySelector(".saveMapBtn");
  const deleteMapElem = document.querySelector(".deleteMapBtn");
  var mapSave = window.confirm("Save data?");
  if (mapSave) {
    // delete from database
    alert("map saved");
    handleMode("manual");
    createMapElem.disabled = false;
    saveMapElem.disabled = true;
    deleteMapElem.disabled = false;
  }
}

function handleDeletemap() {
  var deleteMap = window.confirm("Delete data?");
  if (deleteMap) {
    // delete from database
    alert("map deleted");
  }
}

function registerMouseHandlers() {
  // Setup mouse event handlers
  var mouseDown = false;
  var zoomKey = false;
  var panKey = false;

  var startPos = new ROSLIB.Vector3();

  viewer.scene.addEventListener("stagemousemove", function (event) {
    viewer.scene.addEventListener("stagemousedown", function (event) {
      if (event.nativeEvent.ctrlKey === true) {
        zoomKey = true;
        zoomView.startZoom(event.stageX, event.stageY);
      } else if (event.nativeEvent.shiftKey === true) {
        panKey = true;
        panView.startPan(event.stageX, event.stageY);
      }
      startPos.x = event.stageX;
      startPos.y = event.stageY;
      mouseDown = true;
    });
    if (mouseDown === true) {
      if (zoomKey === true) {
        var dy = event.stageY - startPos.y;
        var zoom = 1 + (10 * Math.abs(dy)) / viewer.scene.canvas.clientHeight;
        if (dy < 0) {
          zoom = 1 / zoom;
        }
        zoomView.zoom(zoom);
      } else if (panKey === true) {
        panView.pan(event.stageX, event.stageY);
      }
    }
  });

  viewer.scene.addEventListener("stagemouseup", function (event) {
    if (mouseDown === true) {
      if (zoomKey === true) {
        zoomKey = false;
      } else if (panKey === true) {
        panKey = false;
      }
      mouseDown = false;
    }
  });
}
