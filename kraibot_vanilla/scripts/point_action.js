// --------------------------------
// Print subscribed data on innerHTML
//-------------------------------
var mobileCurrentPose = {
	position: {
		x: 0,
		y: 0,
		z: 0,
	},
	orientation: {
		x: 0,
		y: 0,
		z: 0,
		w: 0,
	}
};
var mobileCurrentOdom = {
	position: {
		x: 0,
		y: 0,
		z: 0,
	},
	orientation: {
		x: 0,
		y: 0,
		z: 0,
		w: 0,
	}
};

var receivedMobilePoint = 0;
var isMobileReachGoalState;
var receivedMobileVel;
var is_selectTable = 0;
var is_pub = 0;

function onSubMobileVel(vel_msg) {
	if (is_pub) {

		let vel_x = vel_msg.linear.x;
		let vel_y = vel_msg.linear.y;
		let vel_z = vel_msg.linear.z;
		let vel_orient_x = vel_msg.angular.x;
		let vel_orient_y = vel_msg.angular.y;
		let vel_orient_z = vel_msg.angular.z;
		receivedMobileVel = {
			linear: {
				x: vel_x,
				y: vel_y,
				z: vel_z,
			},
			angular: {
				x: vel_orient_x,
				y: vel_orient_y,
				z: vel_orient_z,
			}
		}
		// console.log(receivedMobileVel);
	}
}

// amcl change to tf pose
// receive amcl
function onSubMobilePose(pose_msg) {
	// TurtleBot
	mobileCurrentPose.position.x = pose_msg.pose.pose.position.x;
	mobileCurrentPose.position.y = pose_msg.pose.pose.position.y;
	mobileCurrentPose.position.z = pose_msg.pose.pose.position.z;

	mobileCurrentPose.orientation.x = pose_msg.pose.pose.orientation.x;
	mobileCurrentPose.orientation.y = pose_msg.pose.pose.orientation.y;
	mobileCurrentPose.orientation.z = pose_msg.pose.pose.orientation.z;
	mobileCurrentPose.orientation.w = pose_msg.pose.pose.orientation.w;

	//AIV
	// mobileCurrentPose.position.x = pose_msg.position.x;
	// mobileCurrentPose.position.y = pose_msg.position.y;
	// mobileCurrentPose.position.z = pose_msg.position.z;

	// mobileCurrentPose.orientation.x = pose_msg.orientation.x;
	// mobileCurrentPose.orientation.y = pose_msg.orientation.y;
	// mobileCurrentPose.orientation.z = pose_msg.orientation.z;
	// mobileCurrentPose.orientation.w = pose_msg.orientation.w;
	mobileShowPose();
}

// fix odom sub pose for slam mode
function onSubMobilePoseOdom(pose_msg) {
	// console.log(is_slam_mode);
	// TurtleBot
	//mobileCurrentOdom.position.x = pose_msg.pose.pose.position.x;
	//mobileCurrentOdom.position.y = pose_msg.pose.pose.position.y;
	//mobileCurrentOdom.position.z = pose_msg.pose.pose.position.z;

	//mobileCurrentOdom.orientation.x = pose_msg.pose.pose.orientation.x;
	//mobileCurrentOdom.orientation.y = pose_msg.pose.pose.orientation.y;
	//mobileCurrentOdom.orientation.z = pose_msg.pose.pose.orientation.z;
	//mobileCurrentOdom.orientation.w = pose_msg.pose.pose.orientation.w;


	// //AIV
	mobileCurrentOdom.position.x = pose_msg.position.x;
	mobileCurrentOdom.position.y = pose_msg.position.y;
	mobileCurrentOdom.position.z = pose_msg.position.z;

	mobileCurrentOdom.orientation.x = pose_msg.orientation.x;
	mobileCurrentOdom.orientation.y = pose_msg.orientation.y;
	mobileCurrentOdom.orientation.z = pose_msg.orientation.z;
	mobileCurrentOdom.orientation.w = pose_msg.orientation.w;
	mobileShowPose();
}

function mobileShowPose() {
	if (is_nav_mode) {

		document.getElementById("mobile_pose_x").innerHTML = mobileCurrentPose.position.x.toFixed(2);
		document.getElementById("mobile_pose_y").innerHTML = mobileCurrentPose.position.y.toFixed(2);
		document.getElementById("mobile_pose_z").innerHTML = mobileCurrentPose.position.z.toFixed(2);
		document.getElementById("mobile_orient_x").innerHTML = mobileCurrentPose.orientation.x.toFixed(2);
		document.getElementById("mobile_orient_y").innerHTML = mobileCurrentPose.orientation.y.toFixed(2);
		document.getElementById("mobile_orient_z").innerHTML = mobileCurrentPose.orientation.z.toFixed(2);
		document.getElementById("mobile_orient_w").innerHTML = mobileCurrentPose.orientation.w.toFixed(2);

	}
	else if (is_slam_mode) {
		//Not show pose
		//document.getElementById("mobile_pose_x").innerHTML = " - ";
		//document.getElementById("mobile_pose_y").innerHTML = " - ";
		//document.getElementById("mobile_pose_z").innerHTML = " - ";
		//document.getElementById("mobile_orient_x").innerHTML = " - ";
		//document.getElementById("mobile_orient_y").innerHTML = " - ";
		//document.getElementById("mobile_orient_z").innerHTML = " - ";
		//document.getElementById("mobile_orient_w").innerHTML = " - ";

		//show pose current_pose topic
		document.getElementById("mobile_pose_x").innerHTML = mobileCurrentOdom.position.x.toFixed(2);
		document.getElementById("mobile_pose_y").innerHTML = mobileCurrentOdom.position.y.toFixed(2);
		document.getElementById("mobile_pose_z").innerHTML = mobileCurrentOdom.position.z.toFixed(2);
		document.getElementById("mobile_orient_x").innerHTML = mobileCurrentOdom.orientation.x.toFixed(2);
		document.getElementById("mobile_orient_y").innerHTML = mobileCurrentOdom.orientation.y.toFixed(2);
		document.getElementById("mobile_orient_z").innerHTML = mobileCurrentOdom.orientation.z.toFixed(2);
		document.getElementById("mobile_orient_w").innerHTML = mobileCurrentOdom.orientation.w.toFixed(2);
	}

}

// export function
// return position
function getMobilePose() {
	if (is_connect) {
		return mobileCurrentPose;
	}
}

// export function
// return point , if moving return 0
function getMobilePoint() {
	if (is_connect) {
		try {
			if (receivedMobilePoint != 0) { // =tdid
				// if moving
				if (receivedMobileVel.linear.x != 0 || receivedMobileVel.linear.y != 0 || receivedMobileVel.linear.z != 0 || receivedMobileVel.angular.x != 0 || receivedMobileVel.angular.y != 0 || receivedMobileVel.angular.z != 0) {
					// not yet at point 
					return undefined;
				}
				else { // at mobile point and stop moving
					return receivedMobilePoint; //tdid
				}
			}
			else { // =0 not yet at point
				return undefined;
			}
		}
		catch{
			console.log("receive velocity = null");
		}
	}
}


// export function
// get point 1,2,3 return true if at point, return false if still move
function setMobilePoint(tdId) {
	if (is_connect) {
		let retrievedData = localStorage.getItem('mobilePoint' + tdId);
		let pose = JSON.parse(retrievedData);
		// create a goal
		var goal = new ROSLIB.Goal({
			actionClient: actionClient,
			goalMessage: {
				target_pose: {
					header: {
						frame_id: 'map'
					},
					pose: {
						position: {
							x: Number(pose.position.x),
							y: Number(pose.position.y),
							z: Number(pose.position.z),
						},
						orientation: {
							x: Number(pose.orientation.x),
							y: Number(pose.orientation.y),
							z: Number(pose.orientation.z),
							w: Number(pose.orientation.w)
						}
					}
				}
			}
		});

		try { actionClient.cancel(); } catch{ console.log("actionClient is already canceled") }

		setTimeout(function () {
			goal.send();
			isMobileReachGoalState = false;
			receivedMobilePoint = 0;
			is_pub = 1;
		}, 100);

		goal.on('feedback', function (feedback) {
			// console.log(feedback);
		});
		goal.on('result', function (result) {
			if (!is_emerg) {
				GlobalAlert_Success("Connected", "You are at goal position");
				is_emerg = false;
			}
			isMobileReachGoalState = true;
			receivedMobilePoint = tdId;
			actionClient.cancel();
		});
	}
}

// export function
// get 3d pose return true at position if not return false
function setMobilePose(goal_pose) {
	if (is_connect) {
		// create a goal
		var goal = new ROSLIB.Goal({
			actionClient: actionClient,
			goalMessage: {
				target_pose: {
					header: {
						frame_id: 'map'
					},
					pose: {
						position: {
							x: Number(goal_pose.position.x),
							y: Number(goal_pose.position.y),
							z: Number(goal_pose.position.z),
						},
						orientation: {
							x: Number(goal_pose.orientation.x),
							y: Number(goal_pose.orientation.y),
							z: Number(goal_pose.orientation.z),
							w: Number(goal_pose.orientation.w)
						}
					}
				}
			}
		});

		try {
			actionClient.cancel();
		} catch{
			console.log("actionClient is already canceled");
		}

		setTimeout(function () {
			goal.send();
			isMobileReachGoalState = false;
			receivedMobilePoint = 0;
			is_pub = 1;
		}, 100);

		goal.on('feedback', function (feedback) {
			// console.log(feedback);
		});
		goal.on('result', function (result) {
			if (!is_emerg) {
				GlobalAlert_Success("Connected", "You are at goal position");
				is_emerg = false;
			}
			isMobileReachGoalState = true;
			actionClient.cancel();
		});
	}
}

// export function
function isMobileReachGoal() {
	if (is_connect) {
		if (isMobileReachGoalState) {
			return true;
		}
		else if (!isMobileReachGoalState) {
			return false;
		}
	}
}
// export function
// return true if move, false when it stable
function isMobileMoving() {
	if (is_connect) {
		if (isMobileReachGoalState == false) {
			return true;
		}
		else if (isMobileReachGoalState == true) {
			return false;
		}
		if (is_select && (receivedMobileVel.linear.x != 0 || receivedMobileVel.linear.y != 0 || receivedMobileVel.linear.z != 0 || receivedMobileVel.angular.x != 0 || receivedMobileVel.angular.y != 0 || receivedMobileVel.angular.z != 0)) {
			return true;
		}
	}
	return false;
}

function mobileSaveNote() {
	if (is_connect) {
		console.log("note");
		for (i = 1; i < 11; i++) {
			let text = document.getElementById("note" + i).value;
			console.log(text);
			localStorage.setItem("note" + i, text);
			let retrievedData = localStorage.getItem('note' + i);
			text = retrievedData;
		}
		i = 1;
	}
}
// check again
function save_home(msg) {
	if (is_connect) {

		let home_pose = {
			position: {
				x: 0,
				y: 0,
				z: 0,
			},
			orientation: {
				x: 0,
				y: 0,
				z: 0,
				w: 0,
			}
		};
		home_pose.position.x = msg.position.x;
		home_pose.position.y = msg.position.y;
		home_pose.orientation.z = msg.orientation.z;
		home_pose.orientation.w = msg.orientation.w;
		localStorage.setItem("home", JSON.stringify(home_pose));

		//create home marker
		homeMarker.x = home_pose.position.x;
		homeMarker.y = -home_pose.position.y;
		homeMarker.rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(
			0,
			0,
			home_pose.orientation.z,
			home_pose.orientation.w
		)).z * -180 / 3.14159;
	}
}

function push_inipose() {
	if (is_connect) {
		let retrievedData = localStorage.getItem('home');
		let pose = JSON.parse(retrievedData);
		setMobilePose(pose);
		// console.log(pose);
	}
}

var on_mobileRow = false;

function mobileAddRows() {
	if (is_nav_mode) {
		// alert("hi");
		let pose_update = {
			position: {
				x: 0,
				y: 0,
				z: 0,
			},
			orientation: {
				x: 0,
				y: 0,
				z: 0,
				w: 0,
			}
		};
		let table = document.getElementById("mobile_table");
		let row = table.insertRow();
		let cell1 = row.insertCell(0);
		let cell2 = row.insertCell(1);
		let cell3 = row.insertCell(2);
		let cell4 = row.insertCell(3);
		let cell5 = row.insertCell(4);

		(table.getElementsByTagName("tr"))[mobileRowCount].style.backgroundColor = "#FFE4B5";
		(table.getElementsByTagName("tr"))[mobileRowCount].style.color = "#CD5C5C";
		(table.getElementsByTagName("tr"))[mobileRowCount].style.border = "collapse";

		row.id = mobileRowCount;
		cell1.innerHTML = mobileRowCount;
		cell2.innerHTML = mobileCurrentPose.position.x.toFixed(2);
		cell3.innerHTML = mobileCurrentPose.position.y.toFixed(2);
		cell4.innerHTML = mobileCurrentPose.orientation.z.toFixed(2);
		cell5.innerHTML = mobileCurrentPose.orientation.w.toFixed(2);

		pose_update.position.x = Number(document.getElementById("mobile_table").rows[mobileRowCount].cells[1].innerHTML);
		pose_update.position.y = Number(document.getElementById("mobile_table").rows[mobileRowCount].cells[2].innerHTML);
		pose_update.orientation.z = Number(document.getElementById("mobile_table").rows[mobileRowCount].cells[3].innerHTML);
		pose_update.orientation.w = Number(document.getElementById("mobile_table").rows[mobileRowCount].cells[4].innerHTML);

		localStorage.setItem("mobilePoint" + mobileRowCount, JSON.stringify(pose_update));
		mobileRowCount += 1;
		localStorage.setItem("mobileRowCount", JSON.stringify(mobileRowCount));

		highlight_row();
	}
}

var mobileRowSelected;
var mobileCellSelected;

function highlight_row() {
	var table = document.getElementById("mobile_table");
	var cells = table.getElementsByTagName('td');
	for (let i = 0; i < cells.length; i++) {
		// Take each cell
		var cell = cells[i];
		// do something on onclick event for cell
		cell.onclick = function () {
			on_mobileRow = true;

			// Get the row id where the cell exists
			var rowId = this.parentNode.rowIndex;

			var rowsNotSelected = table.getElementsByTagName('tr');
			for (var row = 0; row < rowsNotSelected.length; row++) {
				rowsNotSelected[row].style.backgroundColor = "#FFE4B5";
				rowsNotSelected[row].style.color = "#CD5C5C";
				rowsNotSelected[row].classList.remove('selected');
			}
			var rowSelected = table.getElementsByTagName('tr')[rowId];
			rowSelected.style.backgroundColor = "#ADD8E6";
			rowSelected.style.color = "#4682B4";
			rowSelected.className += " selected";

			mobileRowSelected = rowSelected.cells[0].innerHTML;
			mobileCellSelected = this.innerHTML;
			is_selectTable = 1;
		}
	}
}

function mobileDelRow() {
	if (on_mobileRow && is_selectTable) {
		document.getElementById("mobile_table").deleteRow(mobileRowSelected);
		localStorage.removeItem('mobilePoint' + mobileRowSelected);
		localStorage.removeItem('mobilePoint' + (mobileRowCount - 1));
		mobileRowSelected += 1;
		mobileRowCount -= 1;
		localStorage.setItem("mobileRowCount", JSON.stringify(mobileRowCount));

		let pose_update = {
			position: {
				x: 0,
				y: 0,
				z: 0,
			},
			orientation: {
				x: 0,
				y: 0,
				z: 0,
				w: 0,
			}
		};
		let i = 1;
		for (i = 1; i < mobileRowCount; i++) {
			document.getElementById("mobile_table").rows[i].cells[0].innerHTML = i;
			pose_update.position.x = document.getElementById("mobile_table").rows[i].cells[1].innerHTML;
			pose_update.position.y = document.getElementById("mobile_table").rows[i].cells[2].innerHTML;
			pose_update.orientation.z = document.getElementById("mobile_table").rows[i].cells[3].innerHTML;
			pose_update.orientation.w = document.getElementById("mobile_table").rows[i].cells[4].innerHTML;
			localStorage.setItem("mobilePoint" + i, JSON.stringify(pose_update));
		}
		i = 1;
		is_selectTable = 0;
	}
}

function mobileResetRow() {
	if (is_connect) {
		GlobalAlert_Warning("Warning", "You are resetting all points");
		localStorage.clear();
		for (i = 1; i <= mobileRowCount; i++) {
			document.getElementById("mobile_table").deleteRow(i);

		}
		mobileRowCount = 1;
		localStorage.setItem("mobileRowCount", JSON.stringify(mobileRowCount));

	}
}

function mobileGo() {
	if (is_nav_mode && is_selectTable) {
		// console.log(mobileRowSelected);
		let retrievedData = localStorage.getItem('mobilePoint' + mobileRowSelected);
		let pose = JSON.parse(retrievedData);
		is_selectTable = 0;
		setMobilePoint(mobileRowSelected);
		console.log(pose);
	}
}
