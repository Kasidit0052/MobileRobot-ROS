const localhost = "192.168.1.30";
var ros = new ROSLIB.Ros({});
viewer = null;
gridClient = null;
var zoomView = null;
var panView = null;
var maps = [];
var initial = null;
var onPanZoom = null;

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

async function init() {
  waitingDialog.show("Waiting for connection");
  await setTimeout(function () {
    waitingDialog.hide();
  }, 2000);
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

  window.addEventListener("resize", function () {
    let mapWidth = Math.ceil(window.innerWidth);

    document.getElementById("map-canvas").style.width = mapWidth * 0.5 + "px";
    document.getElementById("map-canvas").style.height = mapWidth * 0.3 + "px";
    //viewer.scaleToDimensions(2,2);
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
        //add
        onPanZoom = true;
      } else if (event.nativeEvent.shiftKey === true) {
        panKey = true;
        panView.startPan(event.stageX, event.stageY);
        //add
        onPanZoom = true;
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
      //add 
      onPanZoom = false;
    }
  });
}

async function adminStartup() {
  const response = await fetch(`http://${localhost}:8000/api/adminStartUp`);
  return response.json();
}

var waitingDialog =
  waitingDialog ||
  (function ($) {
    "use strict";

    // Creating modal dialog's DOM
    var $dialog = $(
      '<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
        '<div class="modal-dialog modal-m">' +
        '<div class="modal-content">' +
        '<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
        '<div class="modal-body">' +
        '<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
        "</div>" +
        "</div></div></div>"
    );

    return {
      /**
       * Opens our dialog
       * @param message Custom message
       * @param options Custom options:
       * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
       * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
       */
      show: function (message, options) {
        // Assigning defaults
        if (typeof options === "undefined") {
          options = {};
        }
        if (typeof message === "undefined") {
          message = "Loading";
        }
        var settings = $.extend(
          {
            dialogSize: "m",
            progressType: "",
            onHide: null, // This callback runs after the dialog was hidden
          },
          options
        );

        // Configuring dialog
        $dialog
          .find(".modal-dialog")
          .attr("class", "modal-dialog")
          .addClass("modal-" + settings.dialogSize);
        $dialog.find(".progress-bar").attr("class", "progress-bar");
        if (settings.progressType) {
          $dialog
            .find(".progress-bar")
            .addClass("progress-bar-" + settings.progressType);
        }
        $dialog.find("h3").text(message);
        // Adding callbacks
        if (typeof settings.onHide === "function") {
          $dialog.off("hidden.bs.modal").on("hidden.bs.modal", function (e) {
            settings.onHide.call($dialog);
          });
        }
        // Opening dialog
        $dialog.modal();
      },
      /**
       * Closes dialog
       */
      hide: function () {
        $dialog.modal("hide");
      },
    };
  })(jQuery);
