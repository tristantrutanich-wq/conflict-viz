/**
 * ConflictViz - Geopolitical Simulation Engine
 * Personal project for educational purposes
 */

// Global variables
let scene, camera, renderer, controls;
let globe, globeMesh;
let conflictZones = [];
let militaryUnits = [];
let countryLabels = [];
let animationId;
let isAnimating = true;
let raycaster, mouse;

// Country data with coordinates for labels
const countries = [
    { name: 'USA', lat: 37.09, lon: -95.71 },
    { name: 'Russia', lat: 61.52, lon: 105.31 },
    { name: 'China', lat: 35.86, lon: 104.19 },
    { name: 'India', lat: 20.59, lon: 78.96 },
    { name: 'Brazil', lat: -14.23, lon: -51.92 },
    { name: 'Australia', lat: -25.27, lon: 133.77 },
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
    { name: 'Taiwan', lat: 23.69, lon: 120.96 },
    { name: 'Syria', lat: 34.80, lon: 38.99 },
    { name: 'Iraq', lat: 33.22, lon: 43.67 },
    { name: 'Pakistan', lat: 30.37, lon: 69.34 },
    { name: 'Saudi Arabia', lat: 23.88, lon: 45.07 },
    { name: 'Canada', lat: 56.13, lon: -106.34 },
    { name: 'Mexico', lat: 23.63, lon: -102.55 }
];

// Conflict data
const conflictData = [
    {
        id: 'ukraine-russia',
        title: 'Ukraine-Russia Conflict',
        region: 'Eastern Europe',
        lat: 49.0,
        lon: 31.0,
        intensity: 'high',
        description: 'Ongoing military conflict between Ukraine and Russia'
    },
    {
        id: 'gaza-israel',
        title: 'Gaza-Israel Conflict',
        region: 'Middle East',
        lat: 31.5,
        lon: 34.5,
        intensity: 'high',
        description: 'Ongoing tensions in Gaza Strip'
    },
    {
        id: 'china-taiwan',
        title: 'China-Taiwan Tensions',
        region: 'East Asia',
        lat: 23.5,
        lon: 121.0,
        intensity: 'medium',
        description: 'Military tensions across Taiwan Strait'
    },
    {
        id: 'korea',
        title: 'Korean Peninsula Tensions',
        region: 'East Asia',
        lat: 38.0,
        lon: 127.0,
        intensity: 'medium',
        description: 'Ongoing tensions between North and South Korea'
    },
    {
        id: 'sudan',
        title: 'Sudan Civil Conflict',
        region: 'North Africa',
        lat: 15.5,
        lon: 32.5,
        intensity: 'high',
        description: 'Civil war between military factions'
    },
    {
        id: 'myanmar',
        title: 'Myanmar Civil War',
        region: 'Southeast Asia',
        lat: 21.0,
        lon: 96.0,
        intensity: 'medium',
        description: 'Ongoing conflict following 2021 coup'
    }
];

// Equipment database
const equipmentDB = {
    tanks: {
        'T-90A': { country: 'Russia', type: 'Main Battle Tank', cannon: '125mm', crew: 3 },
        'M1 Abrams': { country: 'USA', type: 'Main Battle Tank', cannon: '120mm', crew: 4 },
        'Challenger 2': { country: 'UK', type: 'Main Battle Tank', cannon: '120mm', crew: 4 },
        'Leopard 2': { country: 'Germany', type: 'Main Battle Tank', cannon: '120mm', crew: 4 },
        'Type 99': { country: 'China', type: 'Main Battle Tank', cannon: '125mm', crew: 3 }
    },
    aircraft: {
        'F-35': { country: 'USA', type: 'Stealth Fighter', role: 'Multirole', generation: '5th' },
        'F-22': { country: 'USA', type: 'Stealth Fighter', role: 'Air Superiority', generation: '5th' },
        'Su-57': { country: 'Russia', type: 'Stealth Fighter', role: 'Multirole', generation: '5th' },
        'J-20': { country: 'China', type: 'Stealth Fighter', role: 'Air Superiority', generation: '5th' },
        'Eurofighter': { country: 'EU', type: 'Fighter', role: 'Multirole', generation: '4.5th' }
    },
    ships: {
        'Aircraft Carrier': { type: 'Capital Ship', aircraft: '60-90', role: 'Power Projection' },
        'Destroyer': { type: 'Surface Combatant', missiles: '90+', role: 'Anti-Air/Anti-Ship' },
        'Frigate': { type: 'Surface Combatant', missiles: '30-50', role: 'Escort/Anti-Sub' },
        'Submarine': { type: 'Underwater', type2: 'SSN/SSBN', role: 'Stealth Strike/Deterrent' },
        'Amphibious': { type: 'Assault Ship', troops: '1000+', role: 'Landing Operations' }
    }
};

// Initialize the application
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(document.getElementById('globe-container').clientWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('globe-container').appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
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
    renderer.domElement.addEventListener('click', onMouseClick);
    
    animate();
}

function createGlobe() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    const solidMaterial = new THREE.MeshPhongMaterial({
        color: 0x0a0e27,
        transparent: true,
        opacity: 0.9
    });
    
    globe = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(globe);
    
    const innerGeometry = new THREE.SphereGeometry(0.99, 64, 64);
    globeMesh = new THREE.Mesh(innerGeometry, solidMaterial);
    scene.add(globeMesh);
    
    // Add atmospheric glow
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
            c: { type: "f", value: 0.5 },
            p: { type: "f", value: 4.0 },
            glowColor: { type: "c", value: new THREE.Color(0x00d4ff) },
            viewVector: { type: "v3", value: camera.position }
        },
        vertexShader: `
            uniform vec3 viewVector;
            varying float intensity;
            void main() {
                vec3 vNormal = normalize(normalMatrix * normal);
                vec3 vNormel = normalize(normalMatrix * viewVector);
                intensity = pow(0.6 - dot(vNormal, vNormel), 4.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 glowColor;
            varying float intensity;
            void main() {
                vec3 glow = glowColor * intensity;
                gl_FragColor = vec4(glow, 1.0);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glowMesh);
    
    createStars();
    
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
}

function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const posArray = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 50;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

function createCountryLabels() {
    countries.forEach(country => {
        const position = latLonToVector3(country.lat, country.lon, 1.08);
        const label = createTextSprite(country.name, position);
        countryLabels.push(label);
        scene.add(label);
    });
}

function createTextSprite(text, position) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 42);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.7
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(0.3, 0.075, 1);
    
    return sprite;
}

function createConflictMarkers() {
    conflictData.forEach(conflict => {
        const position = latLonToVector3(conflict.lat, conflict.lon, 1.02);
        
        const geometry = new THREE.SphereGeometry(0.03, 16, 16);
        
        let color = 0xffff00;
        if (conflict.intensity === 'high') color = 0xff0000;
        else if (conflict.intensity === 'medium') color = 0xff8800;
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        marker.userData = conflict;
        
        const ringGeometry = new THREE.RingGeometry(0.04, 0.05, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        
        scene.add(marker);
        scene.add(ring);
        
        conflictZones.push({ marker, ring, data: conflict });
    });
}

// Create realistic-looking military unit models
function createTankModel(color) {
    const group = new THREE.Group();
    
    // Hull
    const hullGeo = new THREE.BoxGeometry(0.04, 0.015, 0.06);
    const hullMat = new THREE.MeshBasicMaterial({ color: color });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);
    
    // Turret
    const turretGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.012, 16);
    const turret = new THREE.Mesh(turretGeo, hullMat);
    turret.position.y = 0.015;
    group.add(turret);
    
    // Cannon
    const cannonGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.05, 8);
    const cannon = new THREE.Mesh(cannonGeo, hullMat);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(0, 0.015, 0.03);
    group.add(cannon);
    
    // Tracks (left and right)
    const trackGeo = new THREE.BoxGeometry(0.008, 0.008, 0.055);
    const trackLeft = new THREE.Mesh(trackGeo, new THREE.MeshBasicMaterial({ color: 0x333333 }));
    trackLeft.position.set(-0.022, -0.005, 0);
    group.add(trackLeft);
    
    const trackRight = new THREE.Mesh(trackGeo, new THREE.MeshBasicMaterial({ color: 0x333333 }));
    trackRight.position.set(0.022, -0.005, 0);
    group.add(trackRight);
    
    return group;
}

function createAircraftModel(color) {
    const group = new THREE.Group();
    
    // Fuselage
    const fuselageGeo = new THREE.ConeGeometry(0.008, 0.06, 8);
    const fuselageMat = new THREE.MeshBasicMaterial({ color: color });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.rotation.x = Math.PI / 2;
    group.add(fuselage);
    
    // Wings
    const wingGeo = new THREE.BoxGeometry(0.05, 0.002, 0.015);
    const wings = new THREE.Mesh(wingGeo, fuselageMat);
    wings.position.set(0, 0, 0.01);
    group.add(wings);
    
    // Tail
    const tailGeo = new THREE.BoxGeometry(0.02, 0.008, 0.002);
    const tail = new THREE.Mesh(tailGeo, fuselageMat);
    tail.position.set(0, 0.005, -0.025);
    group.add(tail);
    
    // Engine glow
    const engineGeo = new THREE.CylinderGeometry(0.005, 0.008, 0.01, 8);
    const engineMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.8 
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(0, 0, -0.035);
    group.add(engine);
    
    return group;
}

function createShipModel(color) {
    const group = new THREE.Group();
    
    // Hull
    const hullGeo = new THREE.BoxGeometry(0.025, 0.01, 0.07);
    const hullMat = new THREE.MeshBasicMaterial({ color: color });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);
    
    // Deck
    const deckGeo = new THREE.BoxGeometry(0.02, 0.005, 0.065);
    const deckMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = 0.008;
    group.add(deck);
    
    // Superstructure
    const superGeo = new THREE.BoxGeometry(0.015, 0.015, 0.02);
    const superstructure = new THREE.Mesh(superGeo, hullMat);
    superstructure.position.set(0, 0.015, -0.015);
    group.add(superstructure);
    
    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.001, 0.001, 0.03, 8);
    const mast = new THREE.Mesh(mastGeo, hullMat);
    mast.position.set(0, 0.035, -0.015);
    group.add(mast);
    
    return group;
}

function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
}

function populateSidebar() {
    const list = document.getElementById('conflict-list');
    list.innerHTML = '';
    
    conflictData.forEach(conflict => {
        const item = document.createElement('div');
        item.className = 'conflict-item';
        item.innerHTML = `
            <div class="conflict-title">${conflict.title}</div>
            <div class="conflict-region">📍 ${conflict.region}</div>
            <span class="conflict-intensity intensity-${conflict.intensity}">${conflict.intensity}</span>
        `;
        item.onclick = () => selectConflict(conflict);
        list.appendChild(item);
    });
}

function selectConflict(conflict) {
    document.querySelectorAll('.conflict-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const statusBar = document.getElementById('status-bar');
    statusBar.textContent = `⚡ Analyzing: ${conflict.title}`;
    statusBar.classList.add('active');
    
    const targetPos = latLonToVector3(conflict.lat, conflict.lon, 2.5);
    camera.position.copy(targetPos);
    camera.lookAt(0, 0, 0);
    
    setTimeout(() => {
        generateSimulation(conflict);
        statusBar.textContent = `✅ Simulation Ready: ${conflict.title}`;
        setTimeout(() => statusBar.classList.remove('active'), 2000);
    }, 1500);
}

async function generateSimulation(conflict) {
    militaryUnits.forEach(unit => scene.remove(unit.mesh));
    militaryUnits = [];
    
    const forceCount = conflict.intensity === 'high' ? 20 : 10;
    
    for (let i = 0; i < forceCount; i++) {
        const offsetLat = conflict.lat + (Math.random() - 0.5) * 10;
        const offsetLon = conflict.lon + (Math.random() - 0.5) * 10;
        const position = latLonToVector3(offsetLat, offsetLon, 1.05);
        
        const types = ['tank', 'aircraft', 'ship'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const side = Math.random() > 0.5 ? 'blue' : 'red';
        const color = side === 'blue' ? 0x0088ff : 0xff0044;
        
        let model, equipment;
        
        if (type === 'tank') {
            model = createTankModel(color);
            equipment = Object.keys(equipmentDB.tanks)[Math.floor(Math.random() * 5)];
        } else if (type === 'aircraft') {
            model = createAircraftModel(color);
            equipment = Object.keys(equipmentDB.aircraft)[Math.floor(Math.random() * 5)];
        } else {
            model = createShipModel(color);
            equipment = Object.keys(equipmentDB.ships)[Math.floor(Math.random() * 5)];
        }
        
        model.position.copy(position);
        model.lookAt(new THREE.Vector3(0, 0, 0));
        model.userData = {
            type: type,
            equipment: equipment,
            side: side,
            conflict: conflict.title,
            speed: Math.random() * 0.001 + 0.0005
        };
        
        scene.add(model);
        militaryUnits.push({ mesh: model, type, side, basePos: position.clone() });
    }
}

function runCustomScenario() {
    const input = document.getElementById('scenario-input').value;
    if (!input) return;
    
    const statusBar = document.getElementById('status-bar');
    statusBar.textContent = `⚡ Simulating: ${input}`;
    statusBar.classList.add('active');
    
    setTimeout(() => {
        statusBar.textContent = `✅ Scenario Generated: ${input}`;
        setTimeout(() => statusBar.classList.remove('active'), 2000);
    }, 2000);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check all meshes in military unit groups
    const allUnitMeshes = [];
    militaryUnits.forEach(unit => {
        unit.mesh.traverse(child => {
            if (child.isMesh) {
                child.userData.parentGroup = unit.mesh;
                allUnitMeshes.push(child);
            }
        });
    });
    
    const intersects = raycaster.intersectObjects(allUnitMeshes);
    
    const tooltip = document.getElementById('tooltip');
    
    if (intersects.length > 0) {
        const unit = intersects[0].object.userData.parentGroup;
        const data = unit.userData;
        
        let equipmentInfo = equipmentDB[data.type + 's']?.[data.equipment] || {};
        
        tooltip.innerHTML = `
            <h3>${data.equipment}</h3>
            <p><strong>Type:</strong> ${data.type.toUpperCase()}</p>
            <p><strong>Side:</strong> ${data.side.toUpperCase()}</p>
            <p><strong>Conflict:</strong> ${data.conflict}</p>
            ${Object.entries(equipmentInfo).map(([k, v]) => `<p><strong>${k}:</strong> ${v}</p>`).join('')}
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = event.clientX + 10 + 'px';
        tooltip.style.top = event.clientY + 10 + 'px';
        
        document.body.style.cursor = 'pointer';
    } else {
        tooltip.style.display = 'none';
        document.body.style.cursor = 'default';
    }
}

function onMouseClick(event) {
    // Handle click interactions
}

function onWindowResize() {
    const container = document.getElementById('globe-container');
    camera.aspect = container.clientWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, window.innerHeight);
}

function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (isAnimating) {
        globe.rotation.y += 0.0005;
        globeMesh.rotation.y += 0.0005;
        
        // Rotate country labels to face camera
        countryLabels.forEach(label => {
            label.lookAt(camera.position);
        });
        
        const time = Date.now() * 0.001;
        conflictZones.forEach((zone, i) => {
            const scale = 1 + Math.sin(time * 2 + i) * 0.2;
            zone.ring.scale.set(scale, scale, 1);
            zone.ring.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
        });
        
        militaryUnits.forEach((unit, i) => {
            // Different animations for different unit types
            if (unit.type === 'aircraft') {
                unit.mesh.rotation.z += 0.02;
                unit.mesh.position.y += Math.sin(time * 2 + i) * 0.0003;
            } else if (unit.type === 'tank') {
                unit.mesh.position.y += Math.sin(time + i) * 0.0001;
            } else {
                unit.mesh.position.y += Math.sin(time * 0.5 + i) * 0.0001;
            }
        });
    }
    
    controls.update();
    renderer.render(scene, camera);
}

function resetView() {
    camera.position.set(0, 0, 2.5);
    camera.lookAt(0, 0, 0);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
}

window.addEventListener('load', init);