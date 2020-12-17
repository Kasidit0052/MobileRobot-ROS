// cmdVel parameter
let max_velocity_linearX = 0.16;
let max_velocity_angularZ = 1.5;
let velocity_linearX = 0.0;
let velocity_angularZ = 0.0;
let velocity_linearX_increase = 0.02;
let velocity_angularZ_increase = 0.1;

var twist = new ROSLIB.Message({
	linear: {
		x: 0,
		y: 0,
		z: 0
	},
	angular: {
		x: 0,
		y: 0,
		z: 0
	}
});

function newSetInterval(callback, duration, callbackArguments) {
	callback.apply(this, callbackArguments);
	if (!is_select) return false;
	var args = arguments,
		scope = this;
	setTimeout(function () {
		newSetInterval.apply(scope, args);
	}, duration);
}

function cmdVel_publish_rate() {
	if (is_select) {
		twist.linear.x = velocity_linearX;
		twist.angular.z = velocity_angularZ;
		cmdVel.publish(twist);
	}
	else {
		velocity_linearX = 0;
		velocity_angularZ = 0;
		twist.linear.x = velocity_linearX;
		twist.angular.z = velocity_angularZ;
	}
	// console.log("active cmdVel");
}

$(document).ready(function () {

	// Forward direction
	$("#mobile_button_up").click(function () {
		if ((velocity_linearX < max_velocity_linearX) && is_select)
			velocity_linearX += velocity_linearX_increase;
	});

	// Backward direction
	$("#mobile_button_down").click(function () {
		if ((velocity_linearX > (-1 * max_velocity_linearX)) && is_select)
			velocity_linearX -= velocity_linearX_increase;
	});

	// Left direction
	$("#mobile_button_left").click(function () {
		if ((velocity_angularZ < max_velocity_angularZ) && is_select)
			velocity_angularZ += velocity_angularZ_increase;
	});

	// Right direction
	$("#mobile_button_right").click(function () {
		if ((velocity_angularZ > (-1 * max_velocity_angularZ)) && is_select) {
			velocity_angularZ -= velocity_angularZ_increase
		}
	});

	// Stop
	$("#mobile_button_stop").click(function () {
		velocity_linearX = 0.0;
		velocity_angularZ = 0.0;
	});
});
