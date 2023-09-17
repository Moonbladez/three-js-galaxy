import { GUI } from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import galaxyFragmentShader from "./shaders/galaxy/fragment.glsl";
import galaxyVertexShader from "./shaders/galaxy/vertex.glsl";

interface Parameters {
  count: number;
  radius: number;
  branches: number;
  spin: number;
  randomness: number;
  randomnessPower: number;
  insideColor: string;
  outsideColor: string;
}

THREE.ColorManagement.enabled = false;

/**
 * Base
 */
// Debug
const gui = new GUI();
const galaxyFolder = gui.addFolder("Galaxy").close();
const colorFolder = gui.addFolder("Color").close();
const starFolder = gui.addFolder("Star").close();

// Canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;

// Scene
const scene = new THREE.Scene();

/**
 * Galaxy
 */
const parameters: Parameters = {
  count: 100000,
  radius: 5,
  branches: 4,
  spin: 1,
  randomness: 0.2,
  randomnessPower: 3,
  insideColor: "#ff6030",
  outsideColor: "#1b3984",
};

let geometry: THREE.BufferGeometry | null = null;
let material: THREE.ShaderMaterial | null = null;
let points: THREE.Points | null = null;

const generateGalaxy = () => {
  if (points !== null) {
    geometry?.dispose();
    material?.dispose();
    scene.remove(points);
  }

  /**
   * Geometry
   */
  geometry = new THREE.BufferGeometry();

  const positions = new Float32Array(parameters.count * 3);
  const randomness = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const scales = new Float32Array(parameters.count * 1);

  const insideColor = new THREE.Color(parameters.insideColor);
  const outsideColor = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;

    // Position
    const radius = Math.random() * parameters.radius;

    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    positions[i3] = Math.cos(branchAngle) * radius;
    positions[i3 + 1] = 0;
    positions[i3 + 2] = Math.sin(branchAngle) * radius;

    randomness[i3] = randomX;
    randomness[i3 + 1] = randomY;
    randomness[i3 + 2] = randomZ;

    // Color
    const mixedColor = insideColor.clone();
    mixedColor.lerp(outsideColor, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;

    // Scale
    scales[i] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));

  /**
   * Material
   */
  material = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 30 * renderer.getPixelRatio() },
    },
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
  });

  /**
   * Points
   */
  points = new THREE.Points(geometry, material);
  scene.add(points);
};

starFolder.add(parameters, "count").min(100).max(1000000).step(100).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, "radius").min(0.01).max(20).step(0.01).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, "branches").min(2).max(20).step(1).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, "randomness").min(0).max(2).step(0.001).onFinishChange(generateGalaxy);
galaxyFolder.add(parameters, "randomnessPower").min(1).max(10).step(0.001).onFinishChange(generateGalaxy);
colorFolder.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
colorFolder.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

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
camera.position.x = 2;
camera.position.y = 2;
camera.position.z = 2;
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
 * Generate the first galaxy
 */
generateGalaxy();

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (material) {
    material.uniforms.uTime.value = elapsedTime;
  }

  controls.update();

  renderer.render(scene, camera);

  window.requestAnimationFrame(tick);
};

tick();
