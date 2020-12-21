var currentMode = null;

async function handleMode(mode) {
  console.log(mode);
  const teleopElems = Array.from(document.querySelectorAll(".teleopBtn"));

  if (mode === "manual") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = false;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = false;
    currentMode = "manual";
  } else if (mode === "nav") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = true;
    document.querySelector(".initialBtn").disabled = false;
    currentMode = "nav";
    //pose_listener_amcl.subscribe(robotMarker_callback);
  } else if (mode === "init") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = true;
    currentMode = "init";
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
    currentMode = "slam";
  } else if (mode === "NA") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = false;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = false;
  } else if (mode === "Prenav") {
    teleopElems.forEach((teleopElem) => {
      teleopElem.disabled = true;
    });
    document.querySelector(".manualBtn").disabled = true;
    document.querySelector(".navigationBtn").disabled = false;
    document.querySelector(".initialBtn").disabled = true;
    document.querySelector(".createMapBtn").disabled = true;
    document.querySelector(".saveMapBtn").disabled = true;
    document.querySelector(".deleteMapBtn").disabled = true;
    //window.addEventListener("load", checkRefresh());
  }
}

// async function checkRefresh() {
//   if (document.refreshForm.visited.value == "") {
//     document.refreshForm.visited.value = "1";
//   } else {
//     handleDeactivemap();
//   }
// }
