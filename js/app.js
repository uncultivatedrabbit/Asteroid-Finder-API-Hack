// GLOBAL VARIABLES
const STORE = {
  renderer: '',
  camera: '',
  scene: '',
  sphere: '',
  clouds: '',
  controls: '',
  mesh: '',
  moon: '',
  dataLoaded: false,
  asteroids: [],
  width: window.innerWidth,
  height: window.innerHeight,
  container: document.getElementById('container')
}


// calls the init function
init();

// begins the scene and calls each create function
function init() {
  //initially hide asteroid tool tip
  $("#asteroidTooltip").hide();
  STORE.scene = new THREE.Scene();
  createCamera();
  createLight();
  createEarth();
  createClouds();
  createMoon();
  createUniverse();
  createRenderer();
  getAsteroidData();
  STORE.controls = new THREE.OrbitControls(STORE.camera, STORE.renderer.domElement);
  STORE.controls.enableKeys = true;
  STORE.controls.keys = {
    LEFT: 65, // A button
    UP: 87, // W button
    RIGHT: 68, // D button
    BOTTOM: 83, // S button
  };
}
// establishs camera angle and perspective
function createCamera() {
  const fieldOfView = 45;
  const aspect = STORE.width / STORE.height;
  const near = 0.01;
  const far = 1000;
  STORE.camera = new THREE.PerspectiveCamera(fieldOfView, aspect, near, far);
  STORE.camera.position.set(0, 0, 40); // x | y | z
  STORE.scene.add(STORE.camera);
}

// add ambient and directional light
// ambient light: basic global (literally) light
// directional light: light designed to look like light from the sun.
function createLight() {
  const ambientLight = new THREE.AmbientLight(0x333333);
  const directionalLight = new THREE.DirectionalLight(0xeeeeee, 1);
  directionalLight.position.set(5, 3, 5); // x | y | z
  STORE.scene.add(ambientLight);
  STORE.scene.add(directionalLight);
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
  STORE.sphere = new THREE.Mesh(geometry, material);
  STORE.scene.add(STORE.sphere);
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
  STORE.clouds = new THREE.Mesh(geometry, material);
  STORE.scene.add(STORE.clouds);
}

// creans earth's moon
function createMoon() {
  const geometry = new THREE.SphereGeometry(1.3, 32, 32);
  const map = new THREE.TextureLoader().load("images/moon-texture.jpg");
  const material = new THREE.MeshPhongMaterial({
    map: map,
  });
  STORE.moon = new THREE.Mesh(geometry, material);
  STORE.moon.position.set(10, 10, 10);
  STORE.moon.name = "moon";
  STORE.scene.add(STORE.moon);
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
  STORE.scene.add(universe);
}

// fetchs asteroid data from NASA API
function getAsteroidData() {
  const apiKey = "iQYxYsoCOcjyRLDV68fNJI3SExbOdV2PRo6E4aKb";
  $("#js-form").submit(event => {
    event.preventDefault();
    const selectedDate = $("#user-date").val();
    const selectedYear = selectedDate.slice(0, 4);
    // error checking
    if (!selectedDate) {
      alert("Please enter a valid date");
      return -1;
    } else if (selectedYear < 1900) {
      alert("Please choose a date after the year 1900");
      return -1;
    } else if (selectedYear >= 2040) {
      alert("Please choose a date before 2040");
      return -1;
    }
    const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${selectedDate}&end_date=${selectedDate}&api_key=${apiKey}`;
    fetch(url)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(response.statusText);
        }
      })
      .then(data => {
        // reset asteroids array and delete clear 
        // previous data to assure new data is accurate
        // and old data doesn't slow down the rendering
        if (STORE.asteroids && STORE.mesh) {
          STORE.asteroids.forEach((asteroid, index) => {
            asteroid.material.dispose();
            asteroid.geometry.dispose();
            STORE.scene.remove(asteroid);
          });
          STORE.asteroids = [];
        }
        createAsteroid(data);
      })
      .catch(err => alert('Apologies, looks like your request was lost in space.', err));
  });
}

// puzzles together each asteroid to then be pushed to the asteroid array object
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
    if (diameter < 0.01) {
      radius = 0.2;
    } else if (diameter >= 0.01 && diameter < .1) {
      radius = 0.3;
    } else {
      radius = 0.4;
    }
    if (parsedData[i].is_potentially_hazardous_asteroid) {
      STORE.mesh = new THREE.Mesh(geometry, materialUnsafe);
      STORE.asteroids.push(STORE.mesh);
    } else {
      STORE.mesh = new THREE.Mesh(geometry, materialSafe);
      STORE.asteroids.push(STORE.mesh);
    }
  }
  STORE.dataLoaded = true;
  renderAsteroids(parsedData);
  displayAsteroidCount(parsedData);
}

function displayAsteroidCount(parsedData){
  if (STORE.dataLoaded){
    $('#about').hide();
    $('#asteroid-count').html(`Asteroid Count: ${parsedData.length}`)
  }
}
// render asteroids and assign them values from the NASA API
function renderAsteroids(parsedData) {
  if (STORE.dataLoaded) {
    STORE.asteroids.forEach((asteroid, index) => {
      if (parsedData[index]) {
        asteroid.milesFromEarth = parseInt(
          parsedData[index].close_approach_data[0].miss_distance.miles
        );
        const positionNum = +String(asteroid.milesFromEarth)
          .slice(0, 2)
          .split("")
          .join(".");
        asteroid.name = parsedData[index].name;
        asteroid.diameter = parseInt(
          (parsedData[index].estimated_diameter.feet.estimated_diameter_max +
            parsedData[index].estimated_diameter.feet.estimated_diameter_max) /
            2
        );
        asteroid.isDangerous =
          parsedData[index].is_potentially_hazardous_asteroid;
        asteroid.velocity = parseInt(
          parsedData[index].close_approach_data[0].relative_velocity
            .miles_per_hour
        );
        asteroid.position.x = Math.random() * positionNum - 1;
        asteroid.position.y = Math.random() * positionNum - 1;
        asteroid.position.z = Math.random() * positionNum - 1;
        asteroid.orbitRadius = Math.random() * 30 - 1;
        asteroid.position.normalize();
        asteroid.position.multiplyScalar(14);
        STORE.scene.add(asteroid);
      }
    });
  }
}

// function to determine if client is hovering over an object on desktop
function mouseDetectAsteroid(event) {
  const mouse = new THREE.Vector2();
  mouse.x =
    ((event.clientX - STORE.renderer.domElement.offsetLeft) /
      STORE.renderer.domElement.width) *
      2 -
    1;
  mouse.y =
    -(
      (event.clientY - STORE.renderer.domElement.offsetTop) /
      STORE.renderer.domElement.height
    ) *
      2 +
    1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, STORE.camera);
  if (STORE.dataLoaded) {
    const intersects = raycaster.intersectObjects(STORE.asteroids);
    if (intersects.length > 0) {
      const currentAsteroid = intersects[0].object;
      $("html, body").css("cursor", "pointer");
      $("#asteroidTooltip").css({
        top: event.pageY - 50,
        left: event.pageX,
        position: "absolute",
        background: "rgba(0, 0, 0, 0.816)",
        padding: "5px",
        color: "#FFFFFF",
        borderRadius: "5px",
        letterSpacing: "2px",
      });
      $("#asteroidTooltip").html(
        `<span class="asteroid-label">Name:</span> ${currentAsteroid.name}`
      );
      $("#asteroidTooltip").show();
    } else {
      $("html, body").css("cursor", "default");
      $("#asteroidTooltip").hide();
    }
  }
}

// function to determine if client is hovering over an object on mobile
function touchDetectAsteroid(event) {
  const mouse = new THREE.Vector2();
  if (event.targetTouches) {
    mouse.x = +(event.targetTouches[0].pageX / window.innerWidth) * 2 + -1;
    mouse.y = -(event.targetTouches[0].pageY / window.innerHeight) * 2 + 1;
  } else {
    mouse.x = (event.clientX / STORE.width) * 2 - 1;
    mouse.y = -(event.clientY / STORE.height) * 2 + 1;
  }
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, STORE.camera);
  if (STORE.dataLoaded) {
    const intersects = raycaster.intersectObjects(STORE.asteroids);
    if (intersects.length > 0) {
      const currentAsteroid = intersects[0].object;
      const currentAsteroidName = currentAsteroid.name;
      let dangerLevel;
      if (currentAsteroid.isDangerous) {
        dangerLevel =
          "<span class='dangerous'>Potentially Hazardous</span>";
      } else {
        dangerLevel = "<span class='safe'>Nonthreatening</span>";
      }
      $("#asteroidTooltip").css({
        top: 55,
        left: 0,
        position: "absolute",
        background: "rgba(0, 0, 0, 0.8)",
        padding: "5px",
        color: "#FFFFFF",
        borderRadius: "5px",
        letterSpacing: "2px",
        fontSize: "12px",
        width: "fit-content",
      });
      $("#asteroidTooltip").html(
        `<span class="asteroid-label">Asteroid Name:</span> <br>${currentAsteroidName}<br>
        <span class="asteroid-label">Velocity:</span> <br>${currentAsteroid.velocity} mph<br>
        <span class="asteroid-label">Diameter:</span><br> ${currentAsteroid.diameter} feet<br>
        <span class="asteroid-label">Danger Level:</span> <br>${dangerLevel}`
      );
      $("#asteroidTooltip").show();
      $("html, body").css("cursor", "pointer");
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
    ((event.clientX - STORE.renderer.domElement.offsetLeft) /
      STORE.renderer.domElement.width) *
      2 -
    1;
  mouse.y =
    -(
      (event.clientY - STORE.renderer.domElement.offsetTop) /
      STORE.renderer.domElement.height
    ) *
      2 +
    1;
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, STORE.camera);
  if (STORE.dataLoaded) {
    const intersects = raycaster.intersectObjects(STORE.asteroids);
    if (intersects.length > 0) {
      const currentAsteroid = intersects[0].object;
      const currentAsteroidName = currentAsteroid.name;
      let dangerLevel;
      if (currentAsteroid.isDangerous) {
        dangerLevel =
          "<span class='dangerous'>Potentially Hazardous</span>";
      } else {
        dangerLevel = "<span class='safe'>Nonthreatening</span>";
      }
      $("#asteroidTooltip").html(
        `<span class="asteroid-label">Asteroid Name:</span> <br>${currentAsteroidName}<br>
        <span class="asteroid-label">Velocity:</span> <br>${currentAsteroid.velocity} mph<br>
        <span class="asteroid-label">Diameter:</span><br> ${currentAsteroid.diameter} feet<br>
        <span class="asteroid-label">Danger Level:</span> <br>${dangerLevel}`
      );
      $("#asteroidTooltip").show();
      $("html, body").css("cursor", "pointer");
    } else {
      $("html, body").css("cursor", "default");
      $("#asteroidTooltip").hide();
    }
  }
}

// establishes the renderer and pushes it to the DOM
function createRenderer() {
  STORE.renderer = new THREE.WebGLRenderer();
  STORE.renderer.setSize(STORE.width, STORE.height);
  STORE.container.append(STORE.renderer.domElement);
}

// makes sure to dynamically resize the window if a user changes the size of their window
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  STORE.renderer.setSize(width, height);
  STORE.camera.aspect = width / height;
  STORE.camera.updateProjectionMatrix();
}

// add event listener to resize renderer when browser window changes
window.addEventListener("resize", onWindowResize);
$(window).on("click", clickDetectAsteroid);
$(window).on("touchstart tap", touchDetectAsteroid);
window.addEventListener("mousemove", mouseDetectAsteroid, false);

// game loop function that runs over and over creating animations 
function update() {
  const orbitRadius = 15;
  STORE.sphere.rotation.y += 0.0005;
  STORE.moon.rotation.y += 0.0005;
  STORE.clouds.rotation.y += 0.0003;
  if (STORE.dataLoaded) {
    STORE.asteroids.forEach((asteroid, index) => {
      asteroid.rotation.y += 0.03;
      asteroid.rotation.x += 0.03;
    });
  }
  date = Date.now() * 0.00008;
  STORE.moon.position.set(
    -Math.cos(date) * orbitRadius,
    STORE.moon.position.y,
    Math.sin(date) * orbitRadius
  );
}
// renders the scene and camera
function render() {
  STORE.controls.update();
  STORE.renderer.render(STORE.scene, STORE.camera);
}
// IIFE that starts an infinite game loop
(function animate() {
  requestAnimationFrame(animate);
  update();
  render();
})();
