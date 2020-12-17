import React, { Component , useState} from 'react';
import './index.css';
import { Button, TextField, Grid, Container } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Nav2d from 'react-nav2djs';
import { useEffect } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    width:"80%"
  },
  selectEmpty: {
    marginTop: theme.spacing(1),
  },
}));

var ROSLIB = require('roslib');
var ros = new ROSLIB.Ros({
});

var ROS2NAV = Nav2d; 

ROS2NAV.defaultProps = {
  ros: ros,
  id: 'nav2d',
  width: 600,
  height: 450,
  serverName: '/move_base'
};


function App() {
  const localhost = "172.16.10.30";
  const classes = useStyles();
  const [map, setMap] = React.useState('');
  const [mode, setMode] = React.useState('manual');
  const [connected, setConnected] = React.useState(false);
  const [createMap, setCreatemap] = React.useState(false);
  const [mapList,setMapList] =  React.useState([]);

  const handleChange = (event) => {
    setMap(event.target.value);
    MapServer(event.target.value);
  };

  async function FetchMap() 
  {
    const response = await fetch(`http://${localhost}:8000/admin`);
    const res = await response.json();
    return res.mapList;
  };

  async function MapServer(input){
    const response = await fetch(`http://${localhost}:8000/api/getMap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({mapServer_Status: input}),
    });
  }

  //
  async function MapCreate(input){
    const response = await fetch(`http://${localhost}:8000/api/createMap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({createMap: input}),
    });
  }
  //

  async function MapDelete(input){
    const response = await fetch(`http://${localhost}:8000/api/deleteMap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({deleteMap_Name: input}),
    });
    const res = await response.json();
    setMapList(res.mapList);
    setMap('NA');
  }

  useEffect(() => {

    const getMap = async function GetMap()  {
      const subscription  = await FetchMap();
      setMapList(subscription);
    }
    getMap();

    const interval = setInterval(() => {
      if(!ros.isConnected){ros.connect(`ws://${localhost}:9090`);}
      else{setConnected(true);}
    }, 1000);

    return () => {
      ros.close();
      setConnected(false);
    };
  },[]);

  var vel_x = 0.0;
  var angular_vel_z = 0.0;

  // initialozing turtletopic for teleop
  var cmdVel = new ROSLIB.Topic({
    ros: ros,
    name: '/cmd_vel',
    messageType: 'geometry_msgs/Twist'
  });

  var twist = new ROSLIB.Message({
    linear : {
      x : 0.0,
      y : 0.0,
      z : 0.0
    },
    angular : {
      x : 0.0,
      y : 0.0,
      z : 0.0
    }
  });
  

  function handleTeleop(direction) {
    if(direction === 'forward') {
      //angular_vel_z = 0;
      vel_x += 0.1;
    }
    else if (direction === 'stop') {
      vel_x = 0.0;
      angular_vel_z = 0.0;
    }
    else if (direction === 'left') {
      //vel_x = 0;
      angular_vel_z += 0.1;
    }
    else if (direction === 'right') {
      //vel_x = 0;
      angular_vel_z -= 0.1;
    }
    else if (direction === 'back') {
      vel_x -= 0.1;
    }
    twist.linear.x = parseFloat(vel_x);
    twist.angular.z = parseFloat(angular_vel_z);
    console.log("Linear x:" + twist.linear.x + "Angular z:" +twist.angular.z);
    cmdVel.publish(twist);
  }

  // TODO Function for create the map
  function handleCreatemap() {
    // save map 
    var mapName = prompt('SAVE MAP AS');
    if (mapName === null) {
      setCreatemap(false);
    }
    else {
      setMode('slam');
      setCreatemap(true);
      //
      MapCreate(true);
      //
      console.log(mode);
    }
  }


  // TODO  Function for delete the map
  function handleDeletemap() {
    MapDelete(map);
  }

  function handleSavemap() {
    // save map
    // then back to create
    setCreatemap(false);
    setMode('manual');
  }


  function handleMode(mode) {
    if(mode === 'manual') {
      setMode('manual');
      
    }
    else if (mode === 'nav') {
      setMode('nav');
    }
    else if (mode === 'init') {
      setMode('init');
    }
    console.log(mode);
  }
  
  function MapHandler(props){
    return (
    <div>
          <ROS2NAV class="map"></ROS2NAV>
    </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div class="controller-wrapper">
                <div class="nav-wrapper">
                    <div class="dots-wrapper">
                        <h6>KRAI BOT CONTROLLER</h6>
                    </div>

                    <div class="status-wrapper">
                      <h6>{connected ? 'CONNECTED' : 'DISCONNECTED' }</h6>
                    </div> 
                    
                </div>
              <div class="lower-wrapper">
                <div class="left-column">
                    <div class="map-controller">
                      <div class="form">
                        <FormControl className={classes.formControl}>
                          <InputLabel>PLESE SELECT A MAP</InputLabel>
                          <Select labelId="demo-simple-select-label" id="demo-simple-select" value={map} onChange={handleChange} >
                            {mapList.map((value, index) => {return <MenuItem value={index}>{value}</MenuItem>})}
                            <MenuItem value={'NA'}>NOT SELECTED</MenuItem>
                          </Select>
                        </FormControl>
                      </div>
                      <div class="map-button">
                        { createMap == false ?
                          <Button variant="contained" style={{ margin: "1%", height: "80%"}} color="primary" onClick={()=> handleCreatemap()}>CREATE NEW MAP</Button>
                        : <Button variant="contained" style={{ margin: "1%", height: "80%"}} color="primary" onClick={()=> handleSavemap()}>SAVE MAP</Button>}

                        <Button variant="contained" style={{ margin: "1%", height: "80%"}} color="primary" onClick={()=> handleDeletemap()}>DELETE CURRENT MAP</Button>
                      </div>
                    </div>

                    <div class="map-wrapper">
                      <MapHandler/>
                    </div>

                    <div id="mode-selection">
                            <Button variant="contained" style={{ margin: "1%", width: "20%" ,height:"80%"}} color="secondary" onClick={() => { handleMode('manual')}} disabled={mode == 'manual' || mode == 'slam'}>MANUAL</Button>
                            <Button variant="contained" style={{ margin: "1%", width: "20%" ,height:"80%"}} color="secondary" onClick={() => { handleMode('nav')}} disabled={mode == 'nav' || mode =='slam'}>NAVIGATION</Button>
                            <Button variant="contained" style={{ margin: "1%", width: "20%" ,height:"80%"}} color="secondary" onClick={() => { handleMode('init')}} disabled={mode == 'init' || mode =='slam'}>INITIAL POSITION</Button>
                    </div> 
                </div>
               

                <div class="right-column">
                  <div class="teleop-wrapper">
                    <Grid container direction="column" justify="center">
                      <Grid container direction="row" justify="center">
                        <Button variant="contained" color="secondary" style={{ margin: "1%", width: "20%" }} onClick={() => { handleTeleop('forward')}} disabled={mode == 'nav' || mode == 'init'}>FORWARD</Button>
                      </Grid>
                    
                      <Grid container direction="row" justify="center">
                        <Button variant="contained" color="secondary" style={{ margin: "1%", width: "20%" }} onClick={() => { handleTeleop('left')}} disabled={mode == 'nav' || mode == 'init'}>LEFT</Button>
                        <Button variant="contained" color="secondary" style={{ margin: "1%", width: "20%" }} onClick={() => { handleTeleop('stop')}} disabled={mode == 'nav' || mode == 'init'}>STOP</Button>
                        <Button variant="contained" color="secondary" style={{ margin: "1%", width: "20%" }} onClick={() => { handleTeleop('right')}} disabled={mode == 'nav' || mode == 'init'}>RIGHT</Button>
                      </Grid>

                      <Grid container direction="row" justify="center">
                        <Button variant="contained" color="secondary" style={{ margin: "1%", width: "20%" }} onClick={() => { handleTeleop('back')}} disabled={mode == 'nav' || mode == 'init'}>BACK</Button>
                      </Grid>

                    </Grid>
                    </div>

                  <div class="connection-wrapper">
                    Connection wrapper
                  </div>

                </div>
                </div>
            </div>
        
      </header>
    </div>
    
  );
}

export default App;
