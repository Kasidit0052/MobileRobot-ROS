import React, { Component } from "react";
import NAV2D from "./vendor/nav2d.js";
import ROS2D from "./vendor/ros2d.js";
import ROSLIB from "roslib";
import PropTypes from "prop-types";

class Nav2d extends Component {
  componentDidMount() {
    const ros = this.props.ros;
    const viewer = new ROS2D.Viewer({
      divID: this.props.id,
      width: this.props.width,
      height: this.props.height
    });
    const nav = NAV2D.OccupancyGridClientNav({
      ros: ros,
      rootObject: viewer.scene,
      viewer: viewer,
      serverName: this.props.serverName,
      continuous: this.props.continuous
    });
  }
  render() {
    return <div id={this.props.id} />;
  }
}

Nav2d.defaultProps = {
  ros: new ROSLIB.Ros({
    url: "ws://localhost:9090"
  }),
  id: "nav2d",
  width: 500,
  height: 500,
  serverName: "/move_base",
  continuous: false
};

Nav2d.propTypes = {
  ros: PropTypes.object,
  id: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  serverName: PropTypes.string,
  continuous: PropTypes.bool
};

export default Nav2d;
