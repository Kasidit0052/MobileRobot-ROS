const localhost = "192.168.1.30";
var ros = new ROSLIB.Ros({});
var viewer = null;
var zoomView = null;
var panView = null;
var maps = [];
var initial = null;

// Keep connecting to websocket
setInterval(() => {
  const statusElem = document.querySelector(".connection-status");
  if (!ros.isConnected) {
    statusElem.innerText = "Disconnected";
    ros.connect(`ws://${localhost}:9090`);
  } else {
    statusElem.innerText = "Connected";
  }
}, 1000);

window.addEventListener("resize", function () {
  let mapWidth = Math.ceil(window.innerWidth);

  document.getElementById("map-canvas").style.width = mapWidth * 0.5 + "px";
  document.getElementById("map-canvas").style.height = mapWidth * 0.3 + "px";
  //viewer.scaleToDimensions(2,2);
});

async function init() {
  console.log("Hello World");
  initial = await adminStartup();
  console.log(initial);
  handleMode("start-up");

  maps = await FetchMap();
  console.log(maps);
  queryMaps(maps);

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
}

// function for obt to get position to robotmarker

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

async function adminStartup() {
  const response = await fetch(`http://${localhost}:8000/api/adminStartUp`);
  return response.json();
}

// window.onbeforeunload = function (e) {
//   e = e || window.event;

//   // For IE and Firefox prior to version 4
//   if (e) {
//     e.returnValue = "Sure?";
//   }

//   // For Safari
//   return "Sure?";
// };
