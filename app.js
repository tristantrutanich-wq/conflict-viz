/**
 * ConflictViz - Geopolitical Simulation Engine
 * Personal project for educational purposes
 */

// Global variables
let scene, camera, renderer, controls;
let globe, globeMesh;
let conflictZones = [];
let militaryUnits = [];
let animationId;
let isAnimating = true;
let raycaster, mouse;

// Conflict data (placeholder - will fetch from APIs)
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

// Equipment database (simplified - will expand)
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
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(document.getElementById('globe-container').clientWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('globe-container').appendChild(renderer.domElement);
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 1.5;
    controls.maxDistance = 5;
    
    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Create globe
    createGlobe();
    
    // Create conflict markers
    createConflictMarkers();
    
    // Populate sidebar
    populateSidebar();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);
    
    // Start animation
    animate();
}

function createGlobe() {
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Wireframe material for holographic look
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    // Solid inner sphere
    const solidMaterial = new THREE.MeshPhongMaterial({
        color: 0x0a0e27,
        transparent: true,
        opacity: 0.9
    });
    
    // Create wireframe globe
    globe = new THREE.Mesh(geometry, wireframeMaterial);
    scene.add(globe);
    
    // Create inner globe
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
    
    // Add stars background
    createStars();
    
    // Add lighting
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

function createConflictMarkers() {
    conflictData.forEach(conflict => {
        const position = latLonToVector3(conflict.lat, conflict.lon, 1.02);
        
        // Marker geometry
        const geometry = new THREE.SphereGeometry(0.03, 16, 16);
        
        // Color based on intensity
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
        
        // Add pulsing ring
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
    // Update UI
    document.querySelectorAll('.conflict-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Update status
    const statusBar = document.getElementById('status-bar');
    statusBar.textContent = `⚡ Analyzing: ${conflict.title}`;
    statusBar.classList.add('active');
    
    // Rotate globe to conflict
    const targetPos = latLonToVector3(conflict.lat, conflict.lon, 2.5);
    
    // Simple camera animation (would use tweening library in full version)
    camera.position.copy(targetPos);
    camera.lookAt(0, 0, 0);
    
    // Generate simulation
    setTimeout(() => {
        generateSimulation(conflict);
        statusBar.textContent = `✅ Simulation Ready: ${conflict.title}`;
        setTimeout(() => statusBar.classList.remove('active'), 2000);
    }, 1500);
}

async function generateSimulation(conflict) {
    // Clear existing units
    militaryUnits.forEach(unit => scene.remove(unit.mesh));
    militaryUnits = [];
    
    // Generate abstract military forces based on conflict
    const forceCount = conflict.intensity === 'high' ? 20 : 10;
    
    for (let i = 0; i < forceCount; i++) {
        const offsetLat = conflict.lat + (Math.random() - 0.5) * 10;
        const offsetLon = conflict.lon + (Math.random() - 0.5) * 10;
        const position = latLonToVector3(offsetLat, offsetLon, 1.05);
        
        // Random unit type
        const types = ['tank', 'aircraft', 'ship'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Side (blue vs red)
        const side = Math.random() > 0.5 ? 'blue' : 'red';
        const color = side === 'blue' ? 0x0088ff : 0xff0044;
        
        let geometry, equipment;
        
        if (type === 'tank') {
            geometry = new THREE.BoxGeometry(0.02, 0.01, 0.03);
            equipment = Object.keys(equipmentDB.tanks)[Math.floor(Math.random() * 5)];
        } else if (type === 'aircraft') {
            geometry = new THREE.ConeGeometry(0.015, 0.04, 4);
            equipment = Object.keys(equipmentDB.aircraft)[Math.floor(Math.random() * 5)];
        } else {
            geometry = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 8);
            equipment = Object.keys(equipmentDB.ships)[Math.floor(Math.random() * 5)];
        }
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.lookAt(new THREE.Vector3(0, 0, 0));
        mesh.userData = {
            type: type,
            equipment: equipment,
            side: side,
            conflict: conflict.title,
            speed: Math.random() * 0.001 + 0.0005
        };
        
        scene.add(mesh);
        militaryUnits.push({ mesh, type, side, basePos: position.clone() });
    }
}

function runCustomScenario() {
    const input = document.getElementById('scenario-input').value;
    if (!input) return;
    
    const statusBar = document.getElementById('status-bar');
    statusBar.textContent = `⚡ Simulating: ${input}`;
    statusBar.classList.add('active');
    
    // Parse scenario (simplified - would use AI in full version)
    setTimeout(() => {
        // Placeholder for AI analysis
        statusBar.textContent = `✅ Scenario Generated: ${input}`;
        setTimeout(() => statusBar.classList.remove('active'), 2000);
    }, 2000);
}

function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Check intersections with military units
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(militaryUnits.map(u => u.mesh));
    
    const tooltip = document.getElementById('tooltip');
    
    if (intersects.length > 0) {
        const unit = intersects[0].object;
        const data = unit.userData;
        
        // Get equipment details
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
        // Rotate globe slowly
        globe.rotation.y += 0.0005;
        globeMesh.rotation.y += 0.0005;
        
        // Pulse conflict markers
        const time = Date.now() * 0.001;
        conflictZones.forEach((zone, i) => {
            const scale = 1 + Math.sin(time * 2 + i) * 0.2;
            zone.ring.scale.set(scale, scale, 1);
            zone.ring.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.2;
        });
        
        // Animate military units
        militaryUnits.forEach(unit => {
            unit.mesh.rotation.z += 0.02;
            // Add subtle floating motion
            unit.mesh.position.y += Math.sin(time + unit.mesh.id) * 0.0002;
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

// Initialize when page loads
window.addEventListener('load', init);