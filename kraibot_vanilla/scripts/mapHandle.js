var mapname = null;
var gridClient = null;

async function FetchMap() {
  const response = await fetch(`http://${localhost}:8000/api/getMapList`);
  const { mapLists } = await response.json();
  return mapLists;
}

function queryMaps(maps) {
  const selectElem = document.querySelector(".mapSelect");
  if (maps != null) {
    maps.map((value, index) => {
      //console.log(value, index);
      const optElem = document.createElement("option");
      optElem.innerText = value;
      optElem.value = index;
      selectElem.appendChild(optElem);
    });
  }
}

function handleSelectmap(event) {
  const selectElem = document.querySelector(".mapSelect");
  selectElem.value = event.value;
}

async function handleActivemap() {
  handleMode("map-editor");
  const selectElem = document.querySelector(".mapSelect");
  const activeElem = document.querySelector(".activeMapBtn");

  await MapServer(selectElem.value);

  activeElem.innerText = "DEACTIVE MAP";
  activeElem.classList.remove("activeMapBtn");
  activeElem.classList.add("deactiveMapBtn");
  activeElem.removeAttribute("onclick");
  activeElem.setAttribute("onclick", "handleDeactivemap()");
}

async function handleDeactivemap() {
  const deactiveElem = document.querySelector(".deactiveMapBtn");
  deactiveElem.innerText = "ACTIVE MAP";
  deactiveElem.classList.remove("deactiveMapBtn");
  deactiveElem.classList.remove("mui-btn--danger");
  deactiveElem.classList.add("activeMapBtn");
  deactiveElem.classList.add("mui-btn--primary");
  deactiveElem.removeAttribute("onclick");
  deactiveElem.setAttribute("onclick", "handleActivemap()");
  window.location.reload();
}

async function MapServer(input) {
  console.log(input);
  const response = await fetch(`http://${localhost}:8000/api/getMap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ map_index: input }),
  });
}

async function handleCreatemap() {
  mapname = prompt();
  if (mapname) {
    handleMode("slam");
    createMap(mapname);
  } else {
    window.location.reload();
  }
}

async function createMap(input) {
  console.log(input);
  const response = await fetch(`http://${localhost}:8000/api/createMap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ map_name: input }),
  });
}

async function handleSavemap() {
  var confirm = window.confirm("Press a button to save!");
  gridClient.rootObject.removeChild(slamMarker);
  if (confirm === true) {
    await saveMap("YES");
  } else {
    await saveMap("NO");
  }
  window.location.reload();
}

async function saveMap(input) {
  console.log(input);
  const response = await fetch(`http://${localhost}:8000/api/saveMap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ confirm: input }),
  });
}

async function handleDeletemap() {
  var confirm = window.confirm("Press a button to delete!");
  const selectElem = document.querySelector(".mapSelect");
  if (confirm) {
    deleteMap(selectElem.value);
  }
  window.location.reload();
}

async function deleteMap(input) {
  console.log(input);
  const response = await fetch(`http://${localhost}:8000/api/deleteMap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ map_index: input }),
  });
}
