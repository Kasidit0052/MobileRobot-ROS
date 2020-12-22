var pose_listener_odom = null;
var pose_listener_odom = new ROSLIB.Topic({
  ros: ros,
  name: "/odom",
  messageType: "nav_msgs/Odometry",
});

var slamMarker = new ROS2D.NavigationArrow({
  size: 0.1,
  strokeSize: 0.01,
  pulse: true,
  fillColor: createjs.Graphics.getRGB(119, 191, 119),
});

function odom_callback(pose) {
  slamMarker.x = pose.pose.pose.position.x;
  slamMarker.y = -pose.pose.pose.position.y;
  slamMarker.rotation =
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
  //console.log(pose.pose.pose);
  console.log(slamMarker);
}
