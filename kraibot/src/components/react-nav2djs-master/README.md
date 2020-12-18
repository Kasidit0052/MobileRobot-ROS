# react-nav2djs

[![Travis][build-badge]][build]
[![NPM](https://nodei.co/npm/react-nav2djs.png)](https://nodei.co/npm/react-nav2djs/)

This is a React wrapper for [nav2djs](http://wiki.ros.org/nav2djs). See demo for example usage.

## Parameters

- ros: the roslib ROS object
- id: some random string used as the id of the canvas
- width: width of the canvas
- height: height of the canvas
- serverName: action server topic

The default values:
```javascript
Nav2d.defaultProps = {
  ros: new ROSLIB.Ros({
    url : 'ws://localhost:9090'
  }),
  id: 'nav2d',
  width: 500,
  height: 500,
  serverName: '/move_base'
};
```

## Radom things

Since neither `nav2djs` or `ros2djs` implements a CommonJS interface, I manually implement the interface for them.

## Existing problems

- When rendering the map for the first time, it's implmented in a blocking way, so your browser will be freeze for like 2 seconds
- The triangles are not showing up properly

[build-badge]: https://img.shields.io/travis/yodahuang/react-nav2djs/master.png?style=flat-square
[build]: https://travis-ci.org/yodahuang/react-nav2djs
