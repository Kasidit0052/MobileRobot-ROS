var pose_listener_amcl = null;
var pose_listener_amcl = new ROSLIB.Topic({
  ros: ros,
  name: "amcl_pose",
  messageType: "geometry_msgs/PoseWithCovarianceStamped",
});

var navMarker = new ROS2D.NavigationArrow({
  size: 0.1,
  strokeSize: 0.01,
  pulse: true,
  fillColor: createjs.Graphics.getRGB(119, 221, 119),
});

function nav_callback(pose) {
  navMarker.x = pose.pose.pose.position.x;
  navMarker.y = -pose.pose.pose.position.y;
  navMarker.rotation =
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
  console.log(navMarker);
}

async function navigation(input) {
  console.log(input);
  const response = await fetch(`http://${localhost}:8000/api/mapNavigation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ map_index: input }),
  });
}
