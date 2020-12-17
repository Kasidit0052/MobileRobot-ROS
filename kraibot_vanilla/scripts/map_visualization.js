/**
   * Setup all visualization elements when the page is loaded.
*/

let homeMarker_color = [255, 0, 0];
let stroke = 0.01;
let turtlebot3_color = [119, 221, 119];

var gridClient = null;
var plannedPath = null;
var navGoal = null;
var robotTrace = null;
let generate_mapSlam_count = 0;

// turtlebot marker
var robotMarker = new ROS2D.NavigationArrow({
    size: 0.15,
    strokeSize: stroke,
    pulse: true,
    fillColor: createjs.Graphics.getRGB(turtlebot3_color[0], turtlebot3_color[1], turtlebot3_color[2], 0.65)
});

var homeMarker = new ROS2D.NavigationArrow({
    size: 0.15,
    strokeSize: stroke,
    pulse: true,
    fillColor: createjs.Graphics.getRGB(homeMarker_color[0], homeMarker_color[1], homeMarker_color[2], 0.65)
});

//   Create a turtlebot3 in scene
function robotMarker_callback(pose) {
    try {
        // Turtlebot3
        robotMarker.x = pose.pose.pose.position.x;
        robotMarker.y = -pose.pose.pose.position.y;
        robotMarker.rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(
            pose.pose.pose.orientation.x,
            pose.pose.pose.orientation.y,
            pose.pose.pose.orientation.z,
            pose.pose.pose.orientation.w
        )).z * -180 / 3.14159;
    }
    catch{}
}

//   Create a AIV in scene
function robotMarker_AIV_callback(pose) {
    try {
        // AIV
        robotMarker.x = pose.position.x;
        robotMarker.y = -pose.position.y;
        robotMarker.rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(
            pose.orientation.x,
            pose.orientation.y,
            pose.orientation.z,
            pose.orientation.w
        )).z * -180 / 3.14159;
    }
    catch{}
}

var visualization = function (_ros) {

    // Create the main viewer.
    var viewer = new ROS2D.Viewer({
        divID: 'mobile_map',
        width: 720,
        height: 480,
    });

    //Add zoom to the viewer.
    var zoomView = new ROS2D.ZoomView({
        rootObject: viewer.scene
    });

    // Add panning to the viewer.
    var panView = new ROS2D.PanView({
        rootObject: viewer.scene
    });

    // Setup the map client.
    gridClient = new ROS2D.OccupancyGridClient({
        ros: _ros,
        continuous: true,
        rootObject: viewer.scene,
        // topic: '/map'
    });

    // Add planned path
    plannedPath = new ROS2D.NavPath({
        ros: _ros,
        rootObject: viewer.scene,
        pathTopic: '/move_base/TebLocalPlannerROS/local_plan'
    });

    // add robot path
    robotTrace = new ROS2D.PoseAndTrace({
        ros: _ros,
        rootObject: viewer.scene,
        
        // Turtlebot3
        poseTopic: '/amcl_pose',
        
        // AIV
        // poseTopic: '/current_pose',
        
        withTrace: false,
        maxTraceLength: 200
    });


    // Add navigation goal
    navGoal = new ROS2D.NavGoal({
        ros: _ros,
        rootObject: viewer.scene,
        actionTopic: '/move_base'
    });

    // Scale the canvas to fit to the map
    gridClient.on('change', function () {
        if (is_slam_mode) {
            if (generate_mapSlam_count < 1) {
                viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
                viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
                registerMouseHandlers();
                robotTrace.initScale();
                plannedPath.initScale();
                navGoal.initScale();
            }
            generate_mapSlam_count++;
        }
        else {
            generate_mapSlam_count = 0;
            viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
            viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
            registerMouseHandlers();
            plannedPath.initScale();
            navGoal.initScale();
        }
    });

    function initial_turtlebot3_pose(pose) {

        init_poseWithCovarianceStamped.pose.pose.position.x = pose.position.x;
        init_poseWithCovarianceStamped.pose.pose.position.y = pose.position.y;
        init_poseWithCovarianceStamped.pose.pose.orientation.z = pose.orientation.z;
        init_poseWithCovarianceStamped.pose.pose.orientation.w = pose.orientation.w;

        initialPose.publish(init_poseWithCovarianceStamped);
    }

    function registerMouseHandlers() {
        // Setup mouse event handlers
        var mouseDown = false;
        var zoomKey = false;
        var panKey = false;

        var startPos = new ROSLIB.Vector3();

        viewer.scene.addEventListener('stagemousemove', function (event) {
            viewer.scene.addEventListener('stagemousedown', function (event) {
                if (is_connect) {
                    if (event.nativeEvent.ctrlKey === true) {
                        zoomKey = true;
                        zoomView.startZoom(event.stageX, event.stageY);
                    }
                    else if (event.nativeEvent.shiftKey === true) {
                        panKey = true;
                        panView.startPan(event.stageX, event.stageY);
                    }
                    else {
                        if ((is_initPose || is_navigate || is_select) && is_nav_mode) {
                            var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
                            navGoal.startGoalSelection(pos);
                        }
                    }
                    startPos.x = event.stageX;
                    startPos.y = event.stageY;
                    mouseDown = true;
                }
            });
            if (mouseDown === true && is_connect) {
                if (zoomKey === true) {
                    var dy = event.stageY - startPos.y;
                    var zoom = 1 + 10 * Math.abs(dy) / viewer.scene.canvas.clientHeight;
                    if (dy < 0) {
                        zoom = 1 / zoom;
                    }
                    zoomView.zoom(zoom);
                }
                else if (panKey === true) {
                    panView.pan(event.stageX, event.stageY);
                }
                else {
                    if ((is_initPose || is_navigate || is_select) && is_nav_mode) {
                        var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
                        navGoal.orientGoalSelection(pos);
                    }
                }
            }
        });

        viewer.scene.addEventListener('stagemouseup', function (event) {
            if (is_connect) {
                if (mouseDown === true) {
                    if (zoomKey === true) {
                        zoomKey = false;
                    }
                    else if (panKey === true) {
                        panKey = false;
                    }
                    else {

                        var pos = viewer.scene.globalToRos(event.stageX, event.stageY);
                        var goalPose = navGoal.endGoalSelection(pos);

                        if (is_initPose) {
                            initial_turtlebot3_pose(goalPose);
                            save_home(goalPose); // send position to Initial button

                            is_initPose = false;
                            document.getElementById("mobile_button_initPose").style.backgroundColor = primary_backgroundColor;
                            document.getElementById("mobile_button_initPose").style.color = primary_color;
                        }
                        else if (is_navigate) {

                            navGoal.sendGoal(goalPose); //[x,y,z,w]

                            is_navigate = false;
                            document.getElementById("mobile_button_navigate").style.backgroundColor = primary_backgroundColor;
                            document.getElementById("mobile_button_navigate").style.color = primary_color;
                        }
                        else if (is_select) {
                            console.log(goalPose); // goal position
                        }
                    }
                    mouseDown = false;
                }
            }
        });
    }
    gridClient.rootObject.addChild(robotMarker);
}


