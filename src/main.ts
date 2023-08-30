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
}

/**
 * Base
 */
// Debug
const gui = new GUI();
//close
gui.close();

// Canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy
 */
const parameters: IParameters = {
  count: 100000,
  size: 0.01,
  radius: 5,
  branches: 3,
  spin: 1,
};

let geometry = null as THREE.BufferGeometry | null;
let material = null as THREE.PointsMaterial | null;
let points = null as THREE.Points | null;

const generateGalaxy = (parameters: IParameters) => {
  const { count, radius, size, spin, branches } = parameters;

  if (points !== null) {
    geometry?.dispose();
    material?.dispose();
    scene.remove(points);
  }

  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const r = Math.random() * radius;
    const branchAngle = ((i % branches) / branches) * Math.PI * 2;
    const spinAngle = r * spin;

    //x
    positions[i3 + 0] = Math.cos(branchAngle) * r;
    //y
    positions[i3 + 1] = 0;
    //z
    positions[i3 + 2] = Math.sin(branchAngle) * r;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  material = new THREE.PointsMaterial({
    size: size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);
};
generateGalaxy(parameters);

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
galaxyFolder.add(parameters, "spin").min(-5).max(5).step(0.05);
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
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
