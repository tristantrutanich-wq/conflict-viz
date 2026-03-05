/**
 * ConflictViz - Geopolitical Simulation Engine
 */

let scene, camera, renderer, controls;
let globe, globeMesh;
let conflictZones = [];
let militaryUnits = [];
let countryLabels = [];
let raycaster, mouse;

const countries = [
    { name: 'USA', lat: 37.09, lon: -95.71 },
    { name: 'Russia', lat: 61.52, lon: 105.31 },
    { name: 'China', lat: 35.86, lon: 104.19 },
    { name: 'India', lat: 20.59, lon: 78.96 },
    { name: 'UK', lat: 55.37, lon: -3.43 },
    { name: 'Germany', lat: 51.16, lon: 10.45 },
    { name: 'France', lat: 46.22, lon: 2.21 },
    { name: 'Japan', lat: 36.20, lon: 138.25 },
    { name: 'Iran', lat: 32.42, lon: 53.68 },
    { name: 'Israel', lat: 31.04, lon: 34.85 },
    { name: 'Ukraine', lat: 48.37, lon: 31.16 },
    { name: 'Turkey', lat: 38.96, lon: 35.24 },
    { name: 'Egypt', lat: 26.82, lon: 30.80 },
    { name: 'S. Korea', lat: 35.90, lon: 127.76 },
    { name: 'N. Korea', lat: 40.33, lon: 127.51 },
    { name: 'Taiwan', lat: 23.69, lon: 120.96 }
];

const conflictData = [
    { id: 'ukraine-russia', title: 'Ukraine-Russia', region: 'Eastern Europe', lat: 49.0, lon: 31.0, intensity: 'high' },
    { id: 'gaza-israel', title: 'Gaza-Israel', region: 'Middle East', lat: 31.5, lon: 34.5, intensity: 'high' },
    { id: 'china-taiwan', title: 'China-Taiwan', region: 'East Asia', lat: 23.5, lon: 121.0, intensity: 'medium' },
    { id: 'korea', title: 'Korean Peninsula', region: 'East Asia', lat: 38.0, lon: 127.0, intensity: 'medium' },
    { id: 'sudan', title: 'Sudan Conflict', region: 'North Africa', lat: 15.5, lon: 32.5, intensity: 'high' },
    { id: 'myanmar', title: 'Myanmar Civil War', region: 'Southeast Asia', lat: 21.0, lon: 96.0, intensity: 'medium' }
];

const equipmentDB = {
    tanks: { 'T-90A': { country: 'Russia', type: 'MBT', cannon: '125mm' }, 'M1 Abrams': { country: 'USA', type: 'MBT', cannon: '120mm' }, 'Leopard 2': { country: 'Germany', type: 'MBT', cannon: '120mm' } },
    aircraft: { 'F-35': { country: 'USA', type: 'Stealth Fighter', gen: '5th' }, 'Su-57': { country: 'Russia', type: 'Stealth Fighter', gen: '5th' }, 'J-20': { country: 'China', type: 'Stealth Fighter', gen: '5th' } },
    ships: { 'Aircraft Carrier': { type: 'Capital', role: 'Power Projection' }, 'Destroyer': { type: 'Combatant', role: 'Anti-Air' }, 'Submarine': { type: 'SSN', role: 'Stealth Strike' } }
};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const container = document.getElementById('globe-container');
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;
    
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    createGlobe();
    createCountryLabels();
    createConflictMarkers();
    populateSidebar();
    
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    
    animate();
}

function createGlobe() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    const wireframeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.3 });
    const solidMat = new THREE.MeshPhongMaterial({ color: 0x0a0e27, transparent: true, opacity: 0.9 });
    
    globe = new THREE.Mesh(geometry, wireframeMat);
    globeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.99, 64, 64), solidMat);
    scene.add(globe);
    scene.add(globeMesh);
    
    // Atmosphere glow
    const glowGeo = new THREE.SphereGeometry(1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.1, side: THREE.BackSide });
    scene.add(new THREE.Mesh(glowGeo, glowMat));
    
    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 2000;
    const posArray = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 50;
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ size: 0.02, color: 0xffffff })));
    
    scene.add(new THREE.AmbientLight(0x333333));
    scene.add(new THREE.PointLight(0xffffff, 1, 100).position.set(10, 10, 10));
}

function createCountryLabels() {
    countries.forEach(country => {
        const pos = latLonToVector3(country.lat, country.lon, 1.06);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 32;
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'center';
        ctx.fillText(country.name, 64, 22);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
        sprite.position.copy(pos);
        sprite.scale.set(0.25, 0.06, 1);
        countryLabels.push(sprite);
        scene.add(sprite);
    });
}

function createConflictMarkers() {
    conflictData.forEach((conflict, i) => {
        const pos = latLonToVector3(conflict.lat, conflict.lon, 1.02);
        const color = conflict.intensity === 'high' ? 0xff0000 : 0xff8800;
        
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 16, 16),
            new THREE.MeshBasicMaterial({ color: color })
        );
        marker.position.copy(pos);
        
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.035, 0.045, 32),
            new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
        );
        ring.position.copy(pos);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        
        scene.add(marker);
        scene.add(ring);
        conflictZones.push({ marker, ring, data: conflict });
    });
}

function createTank(color) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, 0.05), new THREE.MeshBasicMaterial({ color: color })));
    group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 16), new THREE.MeshBasicMaterial({ color: color })).position.y = 0.012);
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.04, 8), new THREE.MeshBasicMaterial({ color: color }));
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0, 0.012, 0.025);
    group.add(cannon);
    return group;
}

function createAircraft(color) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.05, 8), new THREE.MeshBasicMaterial({ color: color })).rotation.x = Math.PI / 2));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.002, 0.012), new THREE.MeshBasicMaterial({ color: color })).position.z = 0.008);
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.006, 0.002), new THREE.MeshBasicMaterial({ color: color })).position.set(0, 0.005, -0.02));
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.008, 8), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 }));
    engine.rotation.x = Math.PI / 2;
    engine.position.z = -0.028;
    group.add(engine);
    return group;
}

function createShip(color) {
    const group = new THREE.Group();
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.008, 0.06), new THREE.MeshBasicMaterial({ color: color })));
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.004, 0.055), new THREE.MeshBasicMaterial({ color: 0x444444 })).position.y = 0.007);
    group.add(new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.015), new THREE.MeshBasicMaterial({ color: color })).position.set(0, 0.012, -0.012));
    return group;
}

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

function populateSidebar() {
    const list = document.getElementById('conflict-list');
    list.innerHTML = '';
    conflictData.forEach(conflict => {
        const item = document.createElement('div');
        item.className = 'conflict-item';
        item.innerHTML = `<div class="conflict-title">${conflict.title}</div><div class="conflict-region">${conflict.region}</div><span class="conflict-intensity intensity-${conflict.intensity}">${conflict.intensity}</span>`;
        item.onclick = () => selectConflict(conflict);
        list.appendChild(item);
    });
}

function selectConflict(conflict) {
    document.querySelectorAll('.conflict-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    document.getElementById('status-bar').textContent = `⚡ ${conflict.title}`;
    document.getElementById('status-bar').classList.add('active');
    
    camera.position.copy(latLonToVector3(conflict.lat, conflict.lon, 2.2));
    camera.lookAt(0, 0, 0);
    
    generateSimulation(conflict);
}

function generateSimulation(conflict) {
    militaryUnits.forEach(u => scene.remove(u.mesh));
    militaryUnits = [];
    
    const count = conflict.intensity === 'high' ? 15 : 8;
    const types = ['tank', 'aircraft', 'ship'];
    
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * 3)];
        const side = Math.random() > 0.5 ? 'blue' : 'red';
        const color = side === 'blue' ? 0x0088ff : 0xff0044;
        
        const lat = conflict.lat + (Math.random() - 0.5) * 8;
        const lon = conflict.lon + (Math.random() - 0.5) * 8;
        const pos = latLonToVector3(lat, lon, 1.04);
        
        let model, equip;
        if (type === 'tank') { model = createTank(color); equip = Object.keys(equipmentDB.tanks)[Math.floor(Math.random() * 3)]; }
        else if (type === 'aircraft') { model = createAircraft(color); equip = Object.keys(equipmentDB.aircraft)[Math.floor(Math.random() * 3)]; }
        else { model = createShip(color); equip = Object.keys(equipmentDB.ships)[Math.floor(Math.random() * 3)]; }
        
        model.position.copy(pos);
        model.lookAt(new THREE.Vector3(0, 0, 0));
        model.userData = { type, equipment: equip, side, conflict: conflict.title };
        scene.add(model);
        militaryUnits.push({ mesh: model, type });
    }
}

function onMouseMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const meshes = [];
    militaryUnits.forEach(u => u.mesh.traverse(c => { if (c.isMesh) { c.userData.parent = u.mesh; meshes.push(c); } }));
    
    const intersects = raycaster.intersectObjects(meshes);
    const tooltip = document.getElementById('tooltip');
    
    if (intersects.length > 0) {
        const data = intersects[0].object.userData.parent.userData;
        const info = equipmentDB[data.type + 's']?.[data.equipment] || {};
        tooltip.innerHTML = `<h3>${data.equipment}</h3><p><strong>Type:</strong> ${data.type}</p><p><strong>Side:</strong> ${data.side}</p>${Object.entries(info).map(([k,v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}`;
        tooltip.style.display = 'block';
        tooltip.style.left = e.clientX + 10 + 'px';
        tooltip.style.top = e.clientY + 10 + 'px';
    } else {
        tooltip.style.display = 'none';
    }
}

function onWindowResize() {
    const container = document.getElementById('globe-container');
    camera.aspect = container.clientWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    globe.rotation.y += 0.0005;
    globeMesh.rotation.y += 0.0005;
    
    countryLabels.forEach(l => l.lookAt(camera.position));
    
    const time = Date.now() * 0.001;
    conflictZones.forEach((z, i) => {
        const s = 1 + Math.sin(time * 2 + i) * 0.2;
        z.ring.scale.set(s, s, 1);
        z.ring.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
    });
    
    militaryUnits.forEach((u, i) => {
        if (u.type === 'aircraft') u.mesh.rotation.z += 0.02;
    });
    
    controls.update();
    renderer.render(scene, camera);
}

function resetView() { camera.position.set(0, 0, 2.5); camera.lookAt(0, 0, 0); }
function toggleAnimation() { /* placeholder */ }

window.addEventListener('load', init);