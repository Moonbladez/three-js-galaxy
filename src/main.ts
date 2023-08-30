import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import "./style.css";

THREE.ColorManagement.enabled = false;

interface IParameters {
  count: number;
  size: number;
  radius: number;
  branches: number;
  spin: number;
  randomness: number;
  randomnessPower: number;
  insideColor: string;
  outsideColor: string;
  rotationSpeed: number;
}

/**
 * Base
 */
// Debug
const gui = new GUI();

// Canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// Scene
const scene = new THREE.Scene();

const galaxyGroup = new THREE.Group();
scene.add(galaxyGroup);

/**
 * Galaxy
 */
const parameters: IParameters = {
  count: 100000,
  size: 0.01,
  radius: 5,
  branches: 3,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#ff6030",
  outsideColor: "#1b3984",
  rotationSpeed: 0.1,
};

let geometry = null as THREE.BufferGeometry | null;
let material = null as THREE.PointsMaterial | null;
let points = null as THREE.Points | null;

const generateGalaxy = (parameters: IParameters) => {
  const { count, radius, size, spin, branches, randomnessPower, insideColor, outsideColor } = parameters;

  if (points !== null) {
    geometry?.dispose();
    material?.dispose();
    galaxyGroup.remove(points);
  }

  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const colorInside = new THREE.Color(insideColor);
  const colorOutside = new THREE.Color(outsideColor);

  for (let i = 0; i < count; i++) {
    //position
    const i3 = i * 3;

    const r = Math.random() * radius;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    const spinAngle = r * spin;

    const randomX = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomY = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomZ = Math.pow(Math.random(), randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

    //x
    positions[i3] = Math.cos(branchAngle + spinAngle) * r + randomX;
    //y
    positions[i3 + 1] = randomY;
    //z
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r + randomZ;

    //color
    const mixedColor = colorInside.clone();

    mixedColor.lerp(colorOutside, r / radius);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  material = new THREE.PointsMaterial({
    size: size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  });

  points = new THREE.Points(geometry, material);
  galaxyGroup.add(points);
};
generateGalaxy(parameters);

const updateRotation = () => {
  const rotationDelta = parameters.rotationSpeed * clock.getDelta();

  // Apply rotation to the galaxyGroup
  galaxyGroup.rotation.y += rotationDelta;
};

const starsFolder = gui.addFolder("Stars").close();
const galaxyFolder = gui.addFolder("Galaxy").close();
starsFolder
  .add(parameters, "count")
  .min(1000)
  .max(1000000)
  .step(100)
  .onFinishChange(() => generateGalaxy(parameters));
starsFolder
  .add(parameters, "size")
  .min(0.02)
  .max(0.1)
  .step(0.001)
  .onFinishChange(() => generateGalaxy(parameters));

galaxyFolder
  .add(parameters, "radius")
  .min(1)
  .max(20)
  .step(1)
  .onFinishChange(() => generateGalaxy(parameters));
galaxyFolder
  .add(parameters, "branches")
  .min(2)
  .max(20)
  .step(1)
  .onFinishChange(() => generateGalaxy(parameters));
galaxyFolder
  .add(parameters, "spin")
  .min(-5)
  .max(5)
  .step(0.05)
  .onFinishChange(() => generateGalaxy(parameters));
galaxyFolder
  .add(parameters, "randomness")
  .min(0.1)
  .max(2)
  .step(0.1)
  .onFinishChange(() => generateGalaxy(parameters));
galaxyFolder
  .add(parameters, "randomnessPower")
  .min(1)
  .max(10)
  .step(0.1)
  .onFinishChange(() => generateGalaxy(parameters));
galaxyFolder.addColor(parameters, "insideColor").onFinishChange(() => generateGalaxy(parameters));
galaxyFolder.addColor(parameters, "outsideColor").onFinishChange(() => generateGalaxy(parameters));
galaxyFolder
  .add(parameters, "rotationSpeed")
  .min(0)
  .max(1)
  .step(0.01)
  .onFinishChange(() => generateGalaxy(parameters));
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  // Update controls
  controls.update();

  updateRotation();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
