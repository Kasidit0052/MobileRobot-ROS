/**
 * @author Bart van Vliet - bart@dobots.nl
 */

/**
 * Listens for path msgs and draws the path
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * rootObject (optional) - the root object to render to
 *   * pathTopic (optional) - the path topic to subscribe to, like '/plan', must be of type: 'nav_msgs/Path'
 *   * color (optional) - color of the marker
 *   * size (optional) - size of the marker
 */
$(document).ready(function () {
	var countErr = 0;

	ROS2D.NavPath = function (options) {
		var that = this;
		options = options || {};
		var ros = options.ros;
		this.rootObject = options.rootObject || new createjs.Container();
		// var pathTopic = options.pathTopic || '/move_base/NavfnROS/plan';
		var pathTopic = options.pathTopic || '/move_base/TebLocalPlannerROS/local_plan';
		var color = options.color || createjs.Graphics.getRGB(255, 0, 0, 1);
		var size = 0.1;

		// get a handle to the stage
		if (this.rootObject instanceof createjs.Stage) {
			this.stage = this.rootObject;
		} else {
			this.stage = this.rootObject.getStage();
		}

		// shape for the path
		this.path = new ROS2D.PathShape({
			strokeSize: size,
			strokeColor: color
		});
		this.path.visible = true;
		this.rootObject.addChild(this.path);

		this.initScaleSet = false;

		// Set up a listener for the planned path
		var pathListener = new ROSLIB.Topic({
			ros: ros,
			name: pathTopic,
			messageType: 'nav_msgs/Path',
			throttle_rate: 100
		});

		$("#mobile_button_cancel").mousedown(function () {
			setTimeout(function () {
				that.path.visible = false;
			}, 250);
		});

		pathListener.subscribe(this.updatePath.bind(this));
	};

	/**
	 * Initialize scale, current scale will be used for the goal markers
	 */
	ROS2D.NavPath.prototype.initScale = function () {
		if (this.initScaleSet) {
			console.log('Warning: scale has already been initialized!');
			// TODO: reinit
		}
		this.initScaleSet = true;
		this.path.scaleX = 1.0 / this.stage.scaleX;
		this.path.scaleY = 1.0 / this.stage.scaleY;
	};

	/**
	 * Update the robot's path drawing
	 *
	 * @param path - the path (nav_msgs/Path)
	 */
	ROS2D.NavPath.prototype.updatePath = function (path) {
		try {
			if (this.initScaleSet) {
				this.path.visible = true;
			}
			countErr = 0;
			this.path.setPath(path);
		}
		catch (err) {
			if (countErr == 10) {
				GlobalAlert_Danger("Error", "Cannot caculate the path!");
				countErr = 0;
				actionClient.cancel();
			}
			else {
				countErr += 1;
				console.log("Cannot caculate the path");
				// console.log(countErr);
			}
		}
	};
});

