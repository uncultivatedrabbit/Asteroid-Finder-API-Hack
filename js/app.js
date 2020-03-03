console.log("app.js loaded...");

let renderer, camera, scene, sphere, clouds, controls, asteroid;
const width = window.innerWidth;
const height = window.innerHeight;
const container = $("#container");
// calls the init function
init();

// begins the scene and calls each create function
function init() {
  scene = new THREE.Scene();
  createCamera();
  createLight();
  createEarth();
  createClouds();
  createUniverse();
  createAsteroid();
  createRenderer();
  displayResults();
  // getAsteroidData();
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
  camera.position.set(0, 0, 20); // x | y | z
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
        throw new Error("something went wrong");
      }
    })
    .then(response => displayResults(response))
}

// rendering data to the DOM
function displayResults(response) {
  $(response).ready(function () {
      $('.depictedItem').addClass('hidden')
  })

  console.log(response);
  for (let i = 0; i < response.near_earth_objects.testDate.length;i++){
    console.log(response.near_earth_objects.testDate[i].name)
   $('.js-results').append(`<div class="result-item">${response.near_earth_objects.testDate[i].name}</div>`)
  }
  
  $('.js-results').removeClass('hidden')

}



function createAsteroid() {
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

  const geometry = new THREE.PolyhedronGeometry(
    verticesOfCube,
    indicesOfFaces,
    0.3,
    1
  );

  const map = new THREE.TextureLoader().load("images/asteroid_texture.jpg");
  const glow = new THREE.TextureLoader().load("images/green-glow.jpg");
  const material = new THREE.MeshPhongMaterial({
    map: map,
    emissive: 0xffffff,
    // emissiveIntensity: 0.1,
    emissiveMap: glow,
  });

  asteroid = new THREE.Mesh(geometry, material);
  asteroid.name = "asteroid"
  asteroid.position.set(4, 6, 1);
  scene.add(asteroid);
}

// function to determine if client is hovering over an object
function mouseDetectAsteroid(event){
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / width) * 2 - 1;
  mouse.y = - (event.clientY / height) * 2 + 1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera( mouse, camera );
  const asteroidOnHover = scene.getObjectByName("asteroid");
  const intersects = raycaster.intersectObject(asteroidOnHover);
  return intersects.length > 0 ? $('html,body').css('cursor', 'pointer') : $('html,body').css('cursor', 'default');
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
window.addEventListener( 'mousemove', mouseDetectAsteroid, false );

// Randomly generated number for orbital distene when ever an object is selected
function OrbitGenerator(min,max){
  let  mainNum = 0
  return Math.random() * (max - min) + min;
   
   

}

// this is where the animations will go, right now the earth and clouds are slowly rotating on the y axis

function update() {
  const orbitRadius = 10;
  sphere.rotation.y += 0.0005;
  clouds.rotation.y += 0.0003;
  asteroid.rotation.y += 0.003;
  asteroid.rotation.x += 0.003;
  date = Date.now() * 0.0001;
  asteroid.position.set(
    -Math.cos(date) * orbitRadius,
    0,
    Math.sin(date) * orbitRadius
  );
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
