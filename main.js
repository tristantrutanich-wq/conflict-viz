// ConflictViz - Main Application
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(document.getElementById('globe-container').clientWidth, window.innerHeight);
document.getElementById('globe-container').appendChild(renderer.domElement);

// Globe
const globeGeo = new THREE.SphereGeometry(1, 64, 64);
const globeMat = new THREE.MeshBasicMaterial({color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.3});
const globe = new THREE.Mesh(globeGeo, globeMat);
scene.add(globe);

camera.position.z = 2.5;

function animate() {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();
