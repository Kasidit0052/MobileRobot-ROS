# MobileRobo ROS Web Interface

## Dependencies for Running Locally

* Install NodeJS (LTS)
  * [nodeJS](https://nodejs.org/en/download/) after checking the [appropriate CPU](https://raspberrypi.stackexchange.com/questions/9912/how-do-i-see-which-arm-cpu-version-i-have)
* Install yarn 
  * [yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable)
* Install ROS
  * [ros-melodic](http://wiki.ros.org/melodic/Installation/Ubuntu)
* Install ROS-bridge
  * [ROS Bridge JS](http://wiki.ros.org/rosbridge_suite)
* Install future
  ```
  sudo apt-install future
  ```

## Initialized Setup 

1. go to workspace directory
```
cd catkin_ws/src
```

2. git clone this repository
```
git clone https://github.com/Kasidit0052/MobileRobot-ROS.git
```
3. ls to ensure 
```
ls
```

4. install all js dependency
```
cd MobileRobot-ROS && yarn install
```

5. move to frontend folder and install all js dependency
```
cd kraibot && yarn install
```

6. move to parent directory and start 
```
cd .. && yarn dev
```

## Networking Setup
1. go to wifi and edit connection

2. click on setting at specific wifi

3. select ipv4 setting

4. choose manual method

5. add address
```
address 172.16.10.xx
netmask 255.255.255.0
gateway 172.16.10.1
DNS Server 8.8.8.8
```
6. save config

7. open terminal and use ipaddr
```
ipaddr
```

## Robot Setup
go to workspace directory and start server
```
cd catkin_ws/src/MobileRobot-ROS && yarn server
```
