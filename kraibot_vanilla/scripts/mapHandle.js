// async function FetchMap() {
//   const response = await fetch(`http://${localhost}:8000/admin`);
//   const res = await response.json();
//   return res.mapList;
// }

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
  handleMode("manual");
  const selectElem = document.querySelector(".mapSelect");
  const activeElem = document.querySelector(".activeMapBtn");

  MapServer(selectElem.value);

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
  deactiveElem.classList.add("activeMapBtn");
  deactiveElem.removeAttribute("onclick");
  deactiveElem.setAttribute("onclick", "handleActivemap()");
  MapServer("NA");
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
