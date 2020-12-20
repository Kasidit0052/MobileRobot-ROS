var vel_x = 0.0;
var angular_vel_z = 0.0;

// initialozing turtletopic for teleop
var cmdVel = new ROSLIB.Topic({
  ros: ros,
  name: "/cmd_vel",
  messageType: "geometry_msgs/Twist",
});

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
