var currentMode = null;
var gridNavClient = null;

async function handleMode(mode) {
  console.log(mode);
  const teleopElems = Array.from(document.querySelectorAll(".teleopBtn"));
  if (mode === "manual") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".emergencyBtn").disabled = true;
    currentMode = "manual";
  } else if (mode === "nav") {
    console.log(teleopOn);
    const selectElem = document.querySelector(".mapSelect");
    const nav = document.querySelector(".navigationBtn");
    nav.disabled = false;
    nav.innerText = "STOP NAVIGATION";
    nav.classList.remove(".navigationBtn");
    nav.classList.remove(".mui-btn--primary");
    nav.classList.add("mui-btn--danger");
    nav.classList.add(".stopNavigation");
    nav.setAttribute("onclick", "handleStopnavigation()");

    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = false;
    document.querySelector(".emergencyBtn").disabled = false;
    currentMode = "nav";
    await navigation(selectElem.value);
    gridNavClient = new NAV2D.OccupancyGridClientNav({
      ros: ros,
      rootObject: viewer.scene,
      viewer: viewer,
      serverName: "/move_base",
      withOrientation: true,
      arrowSize: 5
    });
    pose_listener_amcl.subscribe(nav_callback);
    gridNavClient.rootObject.addChild(navMarker);
    if (teleopOn == true) {
      teleopElems.forEach((teleopElem) => {
        teleopElem.disabled = false;
      });
    } else {
      teleopElems.forEach((teleopElem) => {
        teleopElem.disabled = true;
      });
    }
  } else if (mode === "slam") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".activeMapBtn").disabled = true;
    document.querySelector(".createMapBtn").disabled = true;
    document.querySelector(".saveMapBtn").disabled = false;
    document.querySelector(".deleteMapBtn").disabled = true;
    document.querySelector(".emergencyBtn").disabled = true;
    pose_listener_odom.subscribe(odom_callback);
    gridClient.rootObject.addChild(slamMarker);
    currentMode = "slam";
  } else if (mode === "start-up") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".deleteMapBtn").disabled = true;
    document.querySelector(".emergencyBtn").disabled = true;
  } else if (mode === "map-editor") {
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".createMapBtn").disabled = true;
    document.querySelector(".saveMapBtn").disabled = true;
    document.querySelector(".deleteMapBtn").disabled = false;
    document.querySelector(".emergencyBtn").disabled = true;
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
  }
}

async function handleStopnavigation() {
  const nav = document.querySelector(".navigationBtn");
  nav.innerText = "NAVIGATION";
  nav.classList.add(".navigationBtn");
  nav.classList.add(".mui-btn--primary");
  nav.classList.remove("mui-btn--danger");
  nav.classList.remove(".handleStopnavigation");
  nav.setAttribute("onclick", "handleMode('nav')");
  window.location.reload();
}

async function handleemergency() {
  const response = await emergencySend();
  console.log(response);
}

async function emergencySend() {
  const response = await fetch(`http://${localhost}:8000/api/robot_cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ map_index: input }),
  });
}

async function handleinitpose() {
  const response = await fetch(`http://${localhost}:8000/api/initpose`);
  return response.json();
}

