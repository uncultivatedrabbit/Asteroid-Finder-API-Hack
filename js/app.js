console.log("app.js loaded...");

let renderer, camera, scene, sphere, clouds, controls;
// check if fetched data has been included
let dataLoaded = false;
// array to store asteroids once fetch call is complete
const asteroids = [];
const width = window.innerWidth;
const height = window.innerHeight;
const container = $("#container");

// calls the init function
init();

// begins the scene and calls each create function
function init() {
  //initially hide asteroid tool tip
  $("#asteroidTooltip").hide();
  scene = new THREE.Scene();
  createCamera();
  createLight();
  createEarth();
  createClouds();
  createUniverse();
  createRenderer();
  getAsteroidData();
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableKeys = true;
  controls.keys = {
    LEFT: 65, // A button
    UP: 87, // W button
    RIGHT: 68, // D button
    BOTTOM: 83, // S button
  };
}
// establishs camera angle and perspective
function createCamera() {
  const fieldOfView = 45;
  const aspect = width / height;
  const near = 0.01;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fieldOfView, aspect, near, far);
  camera.position.set(0, 0, 40); // x | y | z
  scene.add(camera);
}

// add ambient and directional light
// ambient light: basic global (literally) light
// directional light: light designed to look like light from the sun.
function createLight() {
  const ambientLight = new THREE.AmbientLight(0x333333);
  const directionalLight = new THREE.DirectionalLight(0xeeeeee, 1);
  directionalLight.position.set(5, 3, 5); // x | y | z
  scene.add(ambientLight);
  scene.add(directionalLight);
}

// create model of Earth using sphere geometry and material (or mesh)
function createEarth() {
  const geometry = new THREE.SphereGeometry(5, 32, 32);
  const map = new THREE.TextureLoader().load("images/earth_no_clouds.jpg");
  const bumpMap = new THREE.TextureLoader().load("images/earth_elevation.jpg");
  const specularMap = new THREE.TextureLoader().load("images/earth_water.png");
  const material = new THREE.MeshPhongMaterial({
    map: map,
    bumpMap: bumpMap,
    bumpScale: 0.005,
    specularMap: specularMap,
    specular: new THREE.Color("grey"),
  });
  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
}

// creates a sphere of clouds that is slightly larger than the earth, giving the illusion of depth
function createClouds() {
  const geometry = new THREE.SphereGeometry(5.03, 32, 32);
  const map = new THREE.TextureLoader().load("images/clouds_earth.png");
  const material = new THREE.MeshPhongMaterial({
    map: map,
    transparent: true,
    depthWrite: false,
    opacity: 0.8,
  });
  clouds = new THREE.Mesh(geometry, material);
  scene.add(clouds);
}

// creates a larger sphere to house the universe
function createUniverse() {
  const geometry = new THREE.SphereGeometry(90, 64, 64);
  const map = new THREE.TextureLoader().load("images/universe.png");
  const material = new THREE.MeshBasicMaterial({
    map: map,
    side: THREE.BackSide,
  });
  const universe = new THREE.Mesh(geometry, material);
  scene.add(universe);
}

// fetchs asteroid data from NASA API
function getAsteroidData() {
  const apiKey = "iQYxYsoCOcjyRLDV68fNJI3SExbOdV2PRo6E4aKb";
  const testDate = "2020-02-01";
  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${testDate}&end_date=${testDate}&api_key=${apiKey}`;
  fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error(response.statusText);
      }
    })
    .then(data => {
      createAsteroid(data);
    })
    .catch(err => console.log(err));
}

function createAsteroid(asteroidData) {
  const parsedData = Object.values(asteroidData.near_earth_objects)[0];
  let radius;
  const verticesOfCube = [
    -1,
    -1,
    -1,
    1,
    -1,
    -1,
    1,
    1,
    -1,
    -1,
    1,
    -1,
    -1,
    -1,
    1,
    1,
    -1,
    1,
    1,
    1,
    1,
    -1,
    1,
    1,
  ];

  const indicesOfFaces = [
    2,
    1,
    0,
    0,
    3,
    2,
    0,
    4,
    7,
    7,
    3,
    0,
    0,
    1,
    5,
    5,
    4,
    0,
    1,
    2,
    6,
    6,
    5,
    1,
    2,
    3,
    7,
    7,
    6,
    2,
    4,
    5,
    6,
    6,
    7,
    4,
  ];

  const map = new THREE.TextureLoader().load("images/asteroid_texture.jpg");
  const safeGlow = new THREE.TextureLoader().load("images/green-glow.jpg");
  const unsafeGlow = new THREE.TextureLoader().load("images/red-glow.jpg");
  const materialSafe = new THREE.MeshPhongMaterial({
    map: map,
    emissive: 0xffffff,
    emissiveIntensity: 0.9,
    emissiveMap: safeGlow,
  });
  const materialUnsafe = new THREE.MeshPhongMaterial({
    map: map,
    emissive: 0xffffff,
    emissiveIntensity: 0.9,
    emissiveMap: unsafeGlow,
  });
  // checks if asteroid is hazerdous or not and pushes a different colored asteroid
  for (let i = 0; i < parsedData.length; i++) {
    const geometry = new THREE.PolyhedronGeometry(
      verticesOfCube,
      indicesOfFaces,
      radius || 0.3, // radius
      1 // detail
    );
    let diameter =
      Object.values(parsedData[i].estimated_diameter)[3]
        .estimated_diameter_min / 2000;
    if (diameter < 0.3) {
      radius = 0.3;
    } else {
      radius = 0.3 * diameter;
    }
    if (parsedData[i].is_potentially_hazardous_asteroid) {
      asteroids.push(new THREE.Mesh(geometry, materialUnsafe));
    } else {
      asteroids.push(new THREE.Mesh(geometry, materialSafe));
    }
  }
  dataLoaded = true;
  renderAsteroids(parsedData);
  displayResults(parsedData);
}

// rendering data to the DOM
function displayResults(parsedData) {
  $(parsedData).ready(function() {
    $(".depictedItem").addClass("hidden");
  });
  parsedData.map((dataPoint) => {
    $(".js-results").append(
      `<div class="result-item">${dataPoint.name}</div>`
    );
  })
  $(".js-results").removeClass("hidden");
}

function renderAsteroids(parsedData) {
  if (dataLoaded) {
    asteroids.forEach((asteroid, index) => {
      asteroid.position.x = Math.random() * 2 - 1;
      asteroid.position.y = Math.random() * 2 - 1;
      asteroid.position.z = Math.random() * 2 - 1;
      asteroid.orbitRadius = Math.random() * 30 - 1;
      asteroid.position.normalize();
      asteroid.position.multiplyScalar(14);
      asteroid.name = parsedData[index].name;
      asteroid.magnitude = parsedData[index].absolute_magnitude_h;
      scene.add(asteroid);
    });
  }
}


// function to determine if client is hovering over an object
function mouseDetectAsteroid(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / width) * 2 - 1;
  mouse.y = -(event.clientY / height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  if (dataLoaded) {
    const intersects = raycaster.intersectObjects(asteroids);
    if (intersects.length > 0) {
      const currentAsteroid = intersects[0].object;
      $("html, body").css("cursor", "pointer");
      $("#asteroidTooltip").css({
        top: event.pageY - 50,
        left: event.pageX,
        position: "absolute",
        border: "1px solid black",
        background: "white",
        padding: "5px",
      });
      $("#asteroidTooltip").html(`Name: ${currentAsteroid.name}`);
      $("#asteroidTooltip").show();
    } else {
      $("html, body").css("cursor", "default");
      $("#asteroidTooltip").hide();
    }
  }
}
// detects when user has clicked on a specific asteroid
function clickDetectAsteroid(event) {
  const mouse = new THREE.Vector2();
  mouse.x =
    ((event.clientX - renderer.domElement.offsetLeft) /
      renderer.domElement.width) *
      2 -
    1;
  mouse.y =
    -(
      (event.clientY - renderer.domElement.offsetTop) /
      renderer.domElement.height
    ) *
      2 +
    1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  if (dataLoaded) {
    const intersects = raycaster.intersectObjects(asteroids);
    if (intersects.length > 0) {
      const currentAsteroid = intersects[0].object;
      const asteroidMagnitude = currentAsteroid.Mag;
      const currentAsteroidName = currentAsteroid.name;
      $(".asteroids-Results").html(`<h1>${currentAsteroidName}</h1>`);
      $("html, body").css("cursor", "pointer");
    } else {
      $("html, body").css("cursor", "default");
    }
  }
}

// establishes the renderer and pushes it to the DOM
function createRenderer() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.append(renderer.domElement);
}

// makes sure to dynamically resize the window if a user changes the size of their window
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// add event listener to resize renderer when browser window changes
window.addEventListener("resize", onWindowResize);
//
window.addEventListener("click", clickDetectAsteroid, false);
window.addEventListener("mousemove", mouseDetectAsteroid, false);


function update() {
  // const orbitRadius = 10;
  sphere.rotation.y += 0.0005;
  clouds.rotation.y += 0.0003;
  if (dataLoaded) {
    asteroids.forEach((asteroid, index) => {
      asteroid.rotation.y += 0.03;
      asteroid.rotation.x += 0.03;
      date = Date.now() * 0.0001;
    //   asteroid.position.set(
    //     -Math.cos(asteroid.rotation.z) * index,
    //     asteroid.position.y,
    //     Math.sin(asteroid.rotation.z) * index
    //   );
    });
  }
}
// renders the scene and camera
function render() {
  controls.update();
  renderer.render(scene, camera);
}
// IIFE that starts an infinite game loop
(function animate() {
  requestAnimationFrame(animate);
  update();
  render();
})();
