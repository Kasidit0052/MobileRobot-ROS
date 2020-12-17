var url_ = location.hostname;
var connection_url = 'ws://' + String(url_) + ':9090';

var is_connect = false;
var is_initPose = false;
var is_navigate = false;
var is_select = false;

var is_nav_mode = false;
var is_slam_mode = false;

var limit_websocket = 0;
var limit_init = 0;
let interval_cmd = 500;

// color for button group1 Init Nav Teleop
var primary_backgroundColor = "#FFFFFF";
var seconday_backgroundColor = "#DB7093";

var primary_color = "#000";
var secondary_color = "#FFF";

var ros = null;
var cmdVel = null;
var pose_listener = null;
var actionClient = null;
var initialPose = null;

var launch_nav_node = null;
var launch_slam_node = null;
var run_mapSaver = null;
var request = null;
var request_saveMap = null;

var mobileRowCount = null;

let delayInMilliseconds = 2000;

var mobile_activeNodes;

var is_emerg = false;

// statusbar
let connected_websocket_status = "Connected to Openrai!";
let mode_selection = "Please Select Mode  -->";
let unsubscribe_topics = "Unsubscribing Topics...";
let disconecting_server = "Disconecting to Server...";
let disconected_server = "Connection Closed!";

var init_poseWithCovarianceStamped = new ROSLIB.Message({
    header: {
        frame_id: 'map'
    },
    pose: {
        pose:
        {
            position: { x: 0.0, y: 0.0, z: 0 },
            orientation: { x: 0.0, y: 0.0, z: 0, w: 1 },
        },
        covariance: [
            0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.25, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.07]
    }
});

var default_poseWithCovarianceStamped = new ROSLIB.Message({
    header: {
        frame_id: 'map'
    },
    pose: {
        pose:
        {
            position: { x: 0.0, y: 0.0, z: 0 },
            orientation: { x: 0.0, y: 0.0, z: 0, w: 1 },
        },
        covariance: [
            0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.25, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 
            0.0, 0.0, 0.0, 0.0, 0.0, 0.07]
    }
});

// --------------------------Update table------------------------------------------------------
function checkRow() {
    let retrievedData = localStorage.getItem('mobileRowCount');
    let rowUpdate = JSON.parse(retrievedData);
    mobileRowCount = rowUpdate;
    if (mobileRowCount == undefined) {
        mobileRowCount = 1;
        localStorage.setItem("mobileRowCount", JSON.stringify(mobileRowCount));

    }
}
checkRow();

function mobileUpdateRow(mobileRowCount) {
    let i = 1;

    for (i = 1; i < mobileRowCount; i++) {
        let retrievedData = localStorage.getItem('mobilePoint' + i);
        let pose = JSON.parse(retrievedData);
        // console.log(pose);

        let table = document.getElementById("mobile_table");
        let row = table.insertRow();
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        let cell4 = row.insertCell(3);
        let cell5 = row.insertCell(4);

        (table.getElementsByTagName("tr"))[i].style.backgroundColor = "#FFE4B5";
        (table.getElementsByTagName("tr"))[i].style.color = "#CD5C5C";
        (table.getElementsByTagName("tr"))[i].style.border = "collapse";
        row.id = i;

        cell1.innerHTML = i;
        cell2.innerHTML = Number(pose.position.x).toFixed(2);
        cell3.innerHTML = Number(pose.position.y).toFixed(2);
        cell4.innerHTML = Number(pose.orientation.z).toFixed(2);
        cell5.innerHTML = Number(pose.orientation.w).toFixed(2);
    }
    i = 1;
    highlight_row();

}

function callUpdateRow() {
    // after subscribe only do it once when refresh page
    // add new --------------------------------------------------      

    if (mobileRowCount != 1) {
        let retrievedData = localStorage.getItem('mobileRowCount');
        let mobileUpdateRowCount = JSON.parse(retrievedData);
        mobileUpdateRowCount = Number(mobileUpdateRowCount);
        mobileUpdateRow(mobileUpdateRowCount);
    }

}

// --------------------------------------------------------------------------------
function mobile_connectRos() {
    // Connecting to ROS
    // -----------------
    ros = new ROSLIB.Ros({
        url: connection_url
    });

    // Publish cmd_vel to robot
    cmdVel = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });

    // subscribe position of robot
    // Subscribing to a Topic amcl
    pose_listener = new ROSLIB.Topic({
        ros: ros,

        // AIV
        // name: '/current_pose', 
        // messageType: 'geometry_msgs/Pose',

        //TurtleBot
        name: '/amcl_pose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped',
    });

    // subscribe position of robot
    // Subscribing to a Topic odometry
    pose_listener_odom = new ROSLIB.Topic({
        ros: ros,

        // Turtlebot3
        //name: '/odom', 
        //messageType: 'nav_msgs/Odometry',

        // AIV
        name: '/current_pose',
        messageType: 'geometry_msgs/Pose',
    });

    vel_listener = new ROSLIB.Topic({
        ros: ros,

        // name: '/cmd_vel', // Turtlebot3        
        name: '/wheel_encoder_twist_vel', // AIV

        messageType: 'geometry_msgs/Twist',
    })

    // setup the actionlib client
    actionClient = new ROSLIB.ActionClient({
        ros: ros,
        actionName: 'move_base_msgs/MoveBaseAction',
        serverName: '/move_base'
    });

    // initialpose of robot
    initialPose = new ROSLIB.Topic({
        ros: ros,
        name: '/initialpose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
    });

    // Calling a roslaunch navigatioin service
    // -----------------
    launch_nav_node = new ROSLIB.Service({
        ros: ros,
        name: '/launchNav',
        serviceType: 'openkrai_webservices/roslaunchNav'
    });

    // Calling a roslaunch Slam service
    // -----------------
    launch_slam_node = new ROSLIB.Service({
        ros: ros,
        name: '/launchSlam',
        serviceType: 'openkrai_webservices/roslaunchSlam'
    });

    // Calling a map saver service
    // -----------------
    run_mapSaver = new ROSLIB.Service({
        ros: ros,
        name: '/saverMap',
        serviceType: 'openkrai_webservices/rosrunMapsaver'
    });
}

function stopSlamNav() {
    console.log("Force stop SLAM and NAV")
    request = new ROSLIB.ServiceRequest({
        A: 0,
        B: 0
    });

    try { launch_nav_node.callService(request); } catch { }
    try { launch_slam_node.callService(request); } catch { }
}

setInterval(function () {
    try {
        ros.getNodes(function (nodes, failedCallback) {
            mobile_activeNodes = nodes;
            // console.log(mobile_activeNodes);
            // check connection
            mobileCheckConnection();
        })
    }
    catch {
        mobileCheckConnection();
    }

}, 3000);

$(document).ready(function () {

    $('#mobile_map').hide();

    $('#toggle-event').change(function () {
        if ($(this).prop('checked')) {

            // mobile module connect with web socket
            $('#toggle-event').prop('disabled', true);
            mobile_connectRos();


            ros.on('connection', function () {
                // console.log('You are now connecting to websocket at mobile module.');
                GlobalAlert_Success("Connected", "You are now connecting to websocket at mobile module.");

                setTimeout(function () {
                    is_nav_mode = false;
                    is_slam_mode = false;
                    request = new ROSLIB.ServiceRequest({
                        A: 0,
                        B: 0
                    });

                    try { launch_nav_node.callService(request); } catch { }
                    try { launch_slam_node.callService(request); } catch { }
                    
                    if ((limit_websocket < 1)) visualization(ros);
                    limit_websocket++;

                    $('#mobile_mode_status').fadeOut(function () {
                        $(this).html(connected_websocket_status).fadeIn();
                    });
                }, delayInMilliseconds);

                setTimeout(function () {
                    // initial service
                    cmdVel.advertise();
                    is_connect = true;

                    $('#mobile_mode_status').fadeOut(function () {
                        $(this).html(mode_selection).fadeIn();
                    });
                    $('#toggle-event').prop('disabled', false);
                }, delayInMilliseconds * 2);
            });
            ros.on('error', function (error) {
                console.log('Error connecting to websocket at mobile module.', error);
                GlobalAlert_Danger("Error", "Error connecting to websocket at mobile module.");
            });
            ros.on('close', function () {
                console.log('Connection to websocket server closed at mobile module.');
                GlobalAlert_Warning("Warning", "Connection to websocket server closed at mobile module.");

                document.getElementById("mobile_status_/turtlebot3_lds").classList.add("off");
                document.getElementById("mobile_status_/turtlebot3_slam_gmapping").classList.add("off");
                document.getElementById("mobile_status_/roslaunch_server").classList.add("off");
                document.getElementById("mobile_status_/move_base").classList.add("off");
                document.getElementById("mobile_status_/map_server").classList.add("off");
                document.getElementById("mobile_status_/rosrun_mapSaver").classList.add("off");
                document.getElementById("mobile_status_/robot_state_publisher").classList.add("off");
                document.getElementById("mobile_status_/turtlebot3_core").classList.add("off");
                document.getElementById("mobile_status_/amcl").classList.add("off");
                document.getElementById("mobile_status_/rosapi").classList.add("off");
                document.getElementById("mobile_status_/rosbridge_websocket").classList.add("off");
                document.getElementById("mobile_status_/rosout").classList.add("off");
            });
        }
        else {

            $('#toggle-event').prop('disabled', true);
            $('#mobile_mode_status').fadeOut(function () {
                $(this).html(unsubscribe_topics).fadeIn();
            });
            disable_mobile_button_actionMap();

            try { actionClient.cancel(); } catch { console.log("actionClient is already canceled"); }

            try {
                // unsubscribe
                // cmdvel, amcl, odom, initial pose
                if (is_nav_mode || is_slam_mode) {
                    cmdVel.unadvertise();
                    pose_listener.unsubscribe(onSubMobilePose);
                    if (is_nav_mode) pose_listener.unsubscribe(robotMarker_callback);
                    pose_listener_odom.unsubscribe(onSubMobilePoseOdom);
                    //if (is_slam_mode) pose_listener_odom.unsubscribe(robotMarker_callback); // Turtlebot3
                    if (is_slam_mode) pose_listener_odom.unsubscribe(robotMarker_AIV_callback); // AIV
                    initialPose.unadvertise();
                }
            }
            catch {
                // console.log("Node not available");
            }

            setTimeout(function () {
                $('#mobile_mode_status').fadeOut(function () {
                    $(this).html(disconecting_server).fadeIn();
                });

                is_nav_mode = false;
                is_slam_mode = false;
                request = new ROSLIB.ServiceRequest({
                    A: 0,
                    B: 0
                });

                try { launch_nav_node.callService(request); } catch { }
                try { launch_slam_node.callService(request); } catch { }

            }, delayInMilliseconds);

            setTimeout(function () {
                $('#mobile_mode_status').fadeOut(function () {
                    $(this).html(disconected_server).fadeIn();
                });

                ros.close();
                is_connect = false;

                $('#toggle-event').prop('disabled', false);

                $('#mobile_map').hide();

                // console.log("Connection: " + String(is_connect));
                // console.log("is_initPose: " + String(is_initPose));
                // console.log("is_navigate: " + String(is_navigate));
                // console.log("is_select: " + String(is_select));
                // console.log("is_nav_mode: " + String(is_nav_mode));
                // console.log("is_slam_mode: " + String(is_slam_mode));

            }, delayInMilliseconds * 2);
        }
    });

    //---------------------------------------------set connection & table before use---------------------------
    callUpdateRow(); // update row

    /*   Change to Navigation mode
    * 1. Disable all button when switch mode
    * 2. Remove all marker
    * 3. Request kill roslaunch Slam
    * 4. Request roslaunch Navigation
    * 5. Enable home button
    */
    $("#mobile_button_navMode").mousedown(function () {

        if (is_connect && !is_nav_mode) {
            if (confirm("Do you want to switch to navigation mode!")) {

                try { $('#mobile_map').hide(); } catch { }

                disable_mobile_button_actionMap();
                request = new ROSLIB.ServiceRequest({
                    A: 1,
                    B: 0
                });

                if (is_slam_mode) {
                    //try { pose_listener_odom.unsubscribe(robotMarker_callback); } catch { } // Turtlebot3
                    try { pose_listener_odom.unsubscribe(robotMarker_AIV_callback); } catch { }   // AIV
                }

                $('#mobile_mode_status').fadeOut(function () {
                    $(this).html("Connecting...").fadeIn();
                    $("#mobile_button_navMode").css("color", secondary_color);
                    $("#mobile_button_slamMode").css("color", primary_color);
                    $("#mobile_button_navMode").css("background-color", seconday_backgroundColor);
                    $("#mobile_button_slamMode").css("background-color", primary_backgroundColor);
                });
                launch_slam_node.callService(request);

                setTimeout(function () {
                    launch_nav_node.callService(request);
                    $('#mobile_mode_status').fadeOut(function () {
                        $(this).html("Preparing navigation...").fadeIn();
                    });
                }, delayInMilliseconds);

                setTimeout(function () {

                    is_nav_mode = true;
                    is_slam_mode = false;

                    gridClient.rootObject.addChild(homeMarker);

                    // initial subscribe
                    pose_listener.subscribe(onSubMobilePose);
                    vel_listener.subscribe(onSubMobileVel);

                    pose_listener.subscribe(robotMarker_callback);
                    initialPose.advertise();

                    $("#mobile_button_home").toggleClass("enable", true);
                    $('#mobile_mode_status').fadeOut(function () {
                        $(this).html("Mode : Navigation").fadeIn();
                    });

                    $('#mobile_map').show();

                }, delayInMilliseconds * 2);
            }
        }
    });

    /*   Change to Slam mode
    * 1. Disable all button when switch mode
    * 2. Remove Home marker and robot marker(amcl)
    * 3. Request kill roslaunch Navigation
    * 4. Request roslaunch Slam
    * 5. Enable teleop and save map button
    * 6. Subscribe Odom position
    */
    $("#mobile_button_slamMode").mousedown(function () {

        if (is_connect && !is_slam_mode) {
            if (confirm("Do you want to switch to slam mode!")) {

                try { $('#mobile_map').hide(); } catch { }

                disable_mobile_button_actionMap();
                request = new ROSLIB.ServiceRequest({
                    A: 0,
                    B: 1
                });

                if (is_nav_mode) {
                    try { pose_listener.unsubscribe(onSubMobilePose); } catch { }
                    try { pose_listener.unsubscribe(robotMarker_callback); } catch { }
                    try { initialPose.unadvertise(); } catch { }
                    try { gridClient.rootObject.removeChild(homeMarker); } catch { }
                }

                $('#mobile_mode_status').fadeOut(function () {
                    $(this).html("Connecting...").fadeIn();
                    $("#mobile_button_navMode").css("color", primary_color);
                    $("#mobile_button_slamMode").css("color", secondary_color);
                    $("#mobile_button_navMode").css("background-color", primary_backgroundColor);
                    $("#mobile_button_slamMode").css("background-color", seconday_backgroundColor);
                });
                launch_nav_node.callService(request);

                setTimeout(function () {
                    launch_slam_node.callService(request);
                    $('#mobile_mode_status').fadeOut(function () {
                        $(this).html("Preparing slam...").fadeIn();
                    });
                }, delayInMilliseconds);

                setTimeout(function () {

                    is_nav_mode = false;
                    is_slam_mode = true;

                    is_select = true;
                    disable_mobile_button_teleop(is_select);
                    newSetInterval(cmdVel_publish_rate, interval_cmd);

                    pose_listener_odom.subscribe(onSubMobilePoseOdom);
                    //pose_listener_odom.subscribe(robotMarker_callback); // Turtlebot3
                    pose_listener_odom.subscribe(robotMarker_AIV_callback); // AIV

                    $("#mobile_button_saveMap").toggleClass("enable", true);
                    $('#mobile_mode_status').fadeOut(function () {
                        $(this).html("Mode : Slam").fadeIn();
                    });

                    $('#mobile_map').show();

                }, delayInMilliseconds * 2);
            }
        }
    });

    $("#mobile_button_stopAllMode").mousedown(function () {
        if (is_connect) {
            stopSlamNav()
        }
    })

    $("#mobile_button_cancel").mousedown(function () {
        if (is_connect && !is_initPose && is_nav_mode) {
            is_emerg = true;
            try {
                actionClient.cancel();
                console.log("mobile_button_cancel");
            }
            catch {
                console.log("actionClient is already canceled!");
            }
            GlobalAlert_Warning("Warning", "Emergency Stop!");
        }
    });

    /* Initial position button */
    $("#mobile_button_initPose").mousedown(function () {
        if (is_connect && !is_initPose && is_nav_mode) {

            is_initPose = true;
            is_navigate = false;
            is_select = false;

            disable_mobile_button_teleop(is_select);

            $("#mobile_button_initPose").css("color", secondary_color);
            $("#mobile_button_navigate").css("color", primary_color);
            $("#mobile_button_select").css("color", primary_color);

            $("#mobile_button_initPose").css("background-color", seconday_backgroundColor);
            $("#mobile_button_navigate").css("background-color", primary_backgroundColor);
            $("#mobile_button_select").css("background-color", primary_backgroundColor);

            // add the robot object in navigation mode
            gridClient.rootObject.removeChild(homeMarker);
            gridClient.rootObject.removeChild(robotMarker);
            gridClient.rootObject.addChild(homeMarker);
            gridClient.rootObject.addChild(robotMarker);

            console.log("mobile_button_initPose");
        }
    });

    $("#mobile_button_inithome").mousedown(function () {
        if (is_connect && !is_initPose && is_nav_mode) {
            console.log("mobile_button_inithome")
            initialPose.publish(default_poseWithCovarianceStamped);
            
        }
    })

    /* Navigate button */
    $("#mobile_button_navigate").mousedown(function () {
        if (is_connect && !is_navigate && is_nav_mode) {

            is_initPose = false;
            is_navigate = true;
            is_select = false;

            disable_mobile_button_teleop(is_select);

            $("#mobile_button_initPose").css("color", primary_color);
            $("#mobile_button_navigate").css("color", secondary_color);
            $("#mobile_button_select").css("color", primary_color);

            $("#mobile_button_initPose").css("background-color", primary_backgroundColor);
            $("#mobile_button_navigate").css("background-color", seconday_backgroundColor);
            $("#mobile_button_select").css("background-color", primary_backgroundColor);

            console.log("mobile_button_navigate");
        }
    })
    /* Teleop button */
    $("#mobile_button_select").mousedown(function () {
        if (is_connect && !is_select) { //&& is_nav_mode

            is_initPose = false;
            is_navigate = false;
            is_select = true;

            disable_mobile_button_teleop(is_select);

            $("#mobile_button_initPose").css("color", primary_color);
            $("#mobile_button_navigate").css("color", primary_color);
            $("#mobile_button_select").css("color", secondary_color);

            $("#mobile_button_initPose").css("background-color", primary_backgroundColor);
            $("#mobile_button_navigate").css("background-color", primary_backgroundColor);
            $("#mobile_button_select").css("background-color", seconday_backgroundColor);

            newSetInterval(cmdVel_publish_rate, interval_cmd);

            console.log("mobile_button_select");
        }
    });

    $("#mobile_button_saveMap").mousedown(function () {
        if (is_connect && is_slam_mode) {
            if (confirm("Do you want to save map!")) {
                request_saveMap = new ROSLIB.ServiceRequest({
                    requestSrv: "saveMap"
                });
                run_mapSaver.callService(request_saveMap);
                GlobalAlert_Success("Connected", "Map Saved!");
                // console.log("save");
            }
        }
    });

    var disable_mobile_button_actionMap = function () {

        is_initPose = false;
        is_navigate = false;
        is_select = false;

        disable_mobile_button_teleop(is_select);

        $("#mobile_button_initPose").css("color", primary_color);
        $("#mobile_button_navigate").css("color", primary_color);
        $("#mobile_button_select").css("color", primary_color);
        $("#mobile_button_slam").css("color", primary_color);

        $("#mobile_button_initPose").css("background-color", primary_backgroundColor);
        $("#mobile_button_navigate").css("background-color", primary_backgroundColor);
        $("#mobile_button_select").css("background-color", primary_backgroundColor);
        $("#mobile_button_slam").css("background-color", primary_backgroundColor);

        $("#mobile_button_home").toggleClass("enable", false);
        $("#mobile_button_saveMap").toggleClass("enable", false);

        $("#mobile_button_navMode").css("color", primary_color);
        $("#mobile_button_slamMode").css("color", primary_color);

        $("#mobile_button_navMode").css("background-color", primary_backgroundColor);
        $("#mobile_button_slamMode").css("background-color", primary_backgroundColor);
    }

    var disable_mobile_button_teleop = function (state) {
        $("#mobile_button_up").toggleClass("enable", state);
        $("#mobile_button_down").toggleClass("enable", state);
        $("#mobile_button_right").toggleClass("enable", state);
        $("#mobile_button_left").toggleClass("enable", state);
        $("#mobile_button_stop").toggleClass("enable", state);
    }

    var defaultMode = function () {

        is_initPose = false;
        is_navigate = true;
        is_select = true;
        is_slam = false;

        disable_mobile_button_teleop(is_select);
        $("#mobile_button_home").toggleClass("enable", true);

        $("#mobile_button_initPose").css("color", primary_color);
        $("#mobile_button_navigate").css("color", secondary_color);
        $("#mobile_button_select").css("color", primary_color);
        $("#mobile_button_slam").css("color", primary_color);

        $("#mobile_button_initPose").css("background-color", primary_backgroundColor);
        $("#mobile_button_navigate").css("background-color", seconday_backgroundColor);
        $("#mobile_button_select").css("background-color", primary_backgroundColor);
        $("#mobile_button_slam").css("background-color", primary_backgroundColor);

        request = new ROSLIB.ServiceRequest({
            A: 1,
            B: 0
        });
        launch_nav_node.callService(request);

        console.log("mode : Navigation!");
    }
});

function mobileCheckConnection() {
    if (is_connect) {
        let nodes_length = mobile_activeNodes.length;
        // rosbridge_websocket
        if (mobile_activeNodes.includes("/rosbridge_websocket")) {
            document.getElementById("mobile_status_/rosbridge_websocket").classList.remove("off");
            document.getElementById("mobile_status_/rosbridge_websocket").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/rosbridge_websocket").classList.add("off");
        }
        // rosapi
        if (mobile_activeNodes.includes("/rosapi")) {
            document.getElementById("mobile_status_/rosapi").classList.remove("off");
            document.getElementById("mobile_status_/rosapi").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/rosapi").classList.add("off");
        }
        // rosout
        if (mobile_activeNodes.includes("/rosout")) {
            document.getElementById("mobile_status_/rosout").classList.remove("off");
            document.getElementById("mobile_status_/rosout").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/rosout").classList.add("off");
        }
        //amcl
        if (mobile_activeNodes.includes("/amcl")) {
            document.getElementById("mobile_status_/amcl").classList.remove("off");
            document.getElementById("mobile_status_/amcl").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/amcl").classList.add("off");
        }
        //turtlebot3_core
        if (mobile_activeNodes.includes("/turtlebot3_core")) {
            document.getElementById("mobile_status_/turtlebot3_core").classList.remove("off");
            document.getElementById("mobile_status_/turtlebot3_core").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/turtlebot3_core").classList.add("off");
        }
        //robot_state_publisher
        if (mobile_activeNodes.includes("/robot_state_publisher")) {
            document.getElementById("mobile_status_/robot_state_publisher").classList.remove("off");
            document.getElementById("mobile_status_/robot_state_publisher").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/robot_state_publisher").classList.add("off");
        }
        //rosrunMapsaver
        if (mobile_activeNodes.includes("/rosrun_mapSaver")) {
            document.getElementById("mobile_status_/rosrun_mapSaver").classList.remove("off");
            document.getElementById("mobile_status_/rosrun_mapSaver").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/rosrun_mapSaver").classList.add("off");
        }
        //map_server
        if (mobile_activeNodes.includes("/map_server")) {
            document.getElementById("mobile_status_/map_server").classList.remove("off");
            document.getElementById("mobile_status_/map_server").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/map_server").classList.add("off");
        }
        //move_base
        if (mobile_activeNodes.includes("/move_base")) {
            document.getElementById("mobile_status_/move_base").classList.remove("off");
            document.getElementById("mobile_status_/move_base").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/move_base").classList.add("off");
        }
        //roslaunch_server
        if (mobile_activeNodes.includes("/roslaunch_server")) {
            document.getElementById("mobile_status_/roslaunch_server").classList.remove("off");
            document.getElementById("mobile_status_/roslaunch_server").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/roslaunch_server").classList.add("off");
        }
        //turtlebot3_slam_gmapping
        if (mobile_activeNodes.includes("/turtlebot3_slam_gmapping")) {
            document.getElementById("mobile_status_/turtlebot3_slam_gmapping").classList.remove("off");
            document.getElementById("mobile_status_/turtlebot3_slam_gmapping").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/turtlebot3_slam_gmapping").classList.add("off");
        }
        //turtlebot3_lds
        if (mobile_activeNodes.includes("/turtlebot3_lds")) {
            document.getElementById("mobile_status_/turtlebot3_lds").classList.remove("off");
            document.getElementById("mobile_status_/turtlebot3_lds").classList.add("on");
        }
        else {
            document.getElementById("mobile_status_/turtlebot3_lds").classList.add("off");
        }
    }
    else {
        document.getElementById("mobile_status_/turtlebot3_lds").classList.add("off");
        document.getElementById("mobile_status_/turtlebot3_slam_gmapping").classList.add("off");
        document.getElementById("mobile_status_/roslaunch_server").classList.add("off");
        document.getElementById("mobile_status_/move_base").classList.add("off");
        document.getElementById("mobile_status_/map_server").classList.add("off");
        document.getElementById("mobile_status_/rosrun_mapSaver").classList.add("off");
        document.getElementById("mobile_status_/robot_state_publisher").classList.add("off");
        document.getElementById("mobile_status_/turtlebot3_core").classList.add("off");
        document.getElementById("mobile_status_/amcl").classList.add("off");
        document.getElementById("mobile_status_/rosapi").classList.add("off");
        document.getElementById("mobile_status_/rosbridge_websocket").classList.add("off");
        document.getElementById("mobile_status_/rosout").classList.add("off");
    }
}
