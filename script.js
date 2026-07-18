// --- 1. CORE CONFIGURATION ---
const PARTICLE_COUNT = 10000;
const SHAPES = ['Sphere', 'Heart', 'Rose', 'Tulip', 'Saturn', 'Cloud', 'Galaxy', 'Cube'];
let currentShapeIndex = 0;

let scene, camera, renderer, particles;
let geometry, material;

const currentPositions = new Float32Array(PARTICLE_COUNT * 3);
const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
const currentColors = new Float32Array(PARTICLE_COUNT * 3);
const targetColors = new Float32Array(PARTICLE_COUNT * 3);

let handX = 0, handY = 0;
let pinchScale = 1.0;
let colorShiftHue = 0.0;
let lastFistTime = 0;
let isTransitioning = false;

// Flash Pulse Variables
let flashPulse = 0.0; 
const pureWhite = new THREE.Color(0xffffff);

// --- 2. THREE.JS INITIALIZATION ---
function initThree() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 800;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    geometry = new THREE.BufferGeometry();
    
    generateShape('Sphere');
    
    for(let i = 0; i < currentPositions.length; i++) {
        currentPositions[i] = targetPositions[i];
        currentColors[i] = targetColors[i];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));

    // Procedural Soft Glow Texture
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)'); 
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);

    material = new THREE.PointsMaterial({
        size: 9, 
        map: texture,
        vertexColors: true,
        blending: THREE.AdditiveBlending, 
        depthWrite: false,
        transparent: true,
        opacity: 1.0
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    window.addEventListener('resize', onWindowResize);
}

// --- 3. MATHEMATICAL SHAPE GENERATORS ---
const baseColors = {
    'Sphere': new THREE.Color(0x00FFFF), 
    'Heart': new THREE.Color(0xFF007F),  
    'Rose': new THREE.Color(0xFF0022),   
    'Tulip': new THREE.Color(0xFF8800),  
    'Saturn': new THREE.Color(0xFFDD00), 
    'Cloud': new THREE.Color(0x00AAFF),  
    'Galaxy': new THREE.Color(0xAA00FF), 
    'Cube': new THREE.Color(0x00FF00)    
};

const tempColor = new THREE.Color();
const hslData = { h: 0, s: 0, l: 0 };

function generateShape(shapeName) {
    const baseCol = baseColors[shapeName];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        let x = 0, y = 0, z = 0;
        
        baseCol.getHSL(hslData);
        tempColor.setHSL((hslData.h + (Math.random() - 0.5) * 0.1 + 1.0) % 1.0, 1.0, 0.6);
        
        let rCol = tempColor.r;
        let gCol = tempColor.g;
        let bCol = tempColor.b;

        if (shapeName === 'Sphere') {
            const r = 250;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
        } 
        else if (shapeName === 'Heart') {
            const t = Math.random() * Math.PI * 2;
            const r = Math.random() * 15; 
            x = 15 * (16 * Math.pow(Math.sin(t), 3)) + (Math.random()-0.5)*r;
            y = 15 * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) + (Math.random()-0.5)*r;
            z = (Math.random() - 0.5) * 40;
        }
        else if (shapeName === 'Rose') {
            const t = (i / PARTICLE_COUNT) * Math.PI * 20; 
            const r = t * 4; 
            x = r * Math.cos(t) + (Math.random()-0.5)*10;
            y = (Math.PI*20 - t) * 5 - 100; 
            z = r * Math.sin(t) + (Math.random()-0.5)*10;
        }
        else if (shapeName === 'Tulip') {
            const theta = Math.random() * Math.PI * 2;
            const h = Math.random() * 200; 
            const r = 30 + 80 * Math.sin(h / 200 * Math.PI * 0.8); 
            x = r * Math.cos(theta) + (Math.random()-0.5)*5;
            y = h - 100;
            z = r * Math.sin(theta) + (Math.random()-0.5)*5;
        }
        else if (shapeName === 'Saturn') {
            if (i < PARTICLE_COUNT * 0.5) {
                const r = 100;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos((Math.random() * 2) - 1);
                x = r * Math.sin(phi) * Math.cos(theta);
                y = r * Math.sin(phi) * Math.sin(theta);
                z = r * Math.cos(phi);
            } else {
                const r = 150 + Math.random() * 120;
                const theta = Math.random() * Math.PI * 2;
                x = r * Math.cos(theta);
                y = (Math.random() - 0.5) * 10;
                z = r * Math.sin(theta);
                tempColor.setHSL(0.5, 1.0, 0.6); 
                rCol = tempColor.r; gCol = tempColor.g; bCol = tempColor.b;
            }
            const tilt = 0.4;
            const tempY = y * Math.cos(tilt) - z * Math.sin(tilt);
            const tempZ = y * Math.sin(tilt) + z * Math.cos(tilt);
            y = tempY; z = tempZ;
        }
        else if (shapeName === 'Cloud') {
            const cluster = Math.floor(Math.random() * 3);
            const offsetX = (cluster - 1) * 150;
            const offsetY = (Math.random() - 0.5) * 50;
            const u = Math.random(), v = Math.random();
            const radius = 100 * Math.sqrt(-2.0 * Math.log(u));
            const angle = 2.0 * Math.PI * v;
            x = offsetX + radius * Math.cos(angle);
            y = offsetY + (radius * Math.sin(angle)) * 0.5; 
            z = (Math.random() - 0.5) * 150;
        }
        else if (shapeName === 'Galaxy') {
            const arms = 4;
            const rotationFactor = 5;
            const distance = Math.random() * 300;
            const angle = (Math.random() * Math.PI * 2) / arms + (distance / 300) * rotationFactor;
            const arm = Math.floor(Math.random() * arms);
            const finalAngle = angle + (arm * Math.PI * 2) / arms;
            const spread = (300 - distance) * 0.1 * (Math.random() - 0.5);
            x = Math.cos(finalAngle) * distance + spread;
            y = (Math.random() - 0.5) * (300 - distance) * 0.2;
            z = Math.sin(finalAngle) * distance + spread;
        }
        else if (shapeName === 'Cube') {
            const s = 150;
            x = (Math.random() - 0.5) * 2 * s;
            y = (Math.random() - 0.5) * 2 * s;
            z = (Math.random() - 0.5) * 2 * s;
            const axis = Math.floor(Math.random() * 3);
            if (axis === 0) x = Math.sign(x) * s;
            if (axis === 1) y = Math.sign(y) * s;
            if (axis === 2) z = Math.sign(z) * s;
        }

        targetPositions[i3] = x;
        targetPositions[i3+1] = y;
        targetPositions[i3+2] = z;
        
        targetColors[i3] = rCol;
        targetColors[i3+1] = gCol;
        targetColors[i3+2] = bCol;
    }
}

// --- 4. AI GESTURE TRACKING ---
function initAI() {
    const videoElement = document.getElementById('video-element');
    const statusElement = document.getElementById('status');

    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7
    });

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            statusElement.innerText = "Tracking Active";
            statusElement.className = "status-ok";
            
            const lm = results.multiHandLandmarks[0];
            
            handX = (lm[9].x - 0.5) * 2.5; 
            handY = -(lm[9].y - 0.5) * 2.5;
            
            colorShiftHue = lm[9].x; 

            const p1 = lm[4]; 
            const p2 = lm[8]; 
            const dist = Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2) + Math.pow(p1.z-p2.z, 2));
            
            const targetScale = 1.0 + Math.max(0, (dist - 0.05) * 10);
            pinchScale += (targetScale - pinchScale) * 0.2; 

            const wrist = lm[0];
            const middleTip = lm[12];
            const fistDist = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y);
            
            const now = Date.now();
            if (fistDist < 0.2) { 
                if (!isTransitioning && (now - lastFistTime > 1500)) {
                    isTransitioning = true;
                    
                    flashPulse = 1.0; 
                    
                    currentShapeIndex = (currentShapeIndex + 1) % SHAPES.length;
                    const nextShape = SHAPES[currentShapeIndex];
                    
                    const nameUI = document.getElementById('shape-name');
                    nameUI.innerText = nextShape;
                    nameUI.style.color = '#' + baseColors[nextShape].getHexString();
                    
                    generateShape(nextShape);
                    
                    lastFistTime = now;
                    setTimeout(() => isTransitioning = false, 1000);
                }
            }
        } else {
            statusElement.innerText = "Searching for hand...";
            statusElement.className = "status-wait";
        }
    });

    const cameraFeed = new Camera(videoElement, {
        onFrame: async () => { await hands.send({image: videoElement}); },
        width: 640, height: 480
    });
    
    cameraFeed.start().catch(err => {
        statusElement.innerText = "Camera Access Denied";
        statusElement.style.color = "red";
        console.error(err);
    });
}

// --- 5. ANIMATION & RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);

    flashPulse *= 0.92; 

    particles.rotation.y += (handX - particles.rotation.y) * 0.05;
    particles.rotation.x += (handY - particles.rotation.x) * 0.05;
    particles.rotation.y += 0.002;

    const positions = geometry.attributes.position.array;
    const colors = geometry.attributes.color.array;
    
    const dynamicScale = pinchScale + (flashPulse * 1.5); 

    for (let i = 0; i < PARTICLE_COUNT * 3; i += 3) {
        const targetX = targetPositions[i] * dynamicScale;
        const targetY = targetPositions[i+1] * dynamicScale;
        const targetZ = targetPositions[i+2] * dynamicScale;

        const morphSpeed = 0.04 + (flashPulse * 0.06); 
        
        positions[i] += (targetX - positions[i]) * morphSpeed;
        positions[i+1] += (targetY - positions[i+1]) * morphSpeed;
        positions[i+2] += (targetZ - positions[i+2]) * morphSpeed;

        tempColor.setRGB(targetColors[i], targetColors[i+1], targetColors[i+2]);
        
        if (colorShiftHue > 0) {
            tempColor.getHSL(hslData);
            tempColor.setHSL((hslData.h + (colorShiftHue * 0.5)) % 1.0, 1.0, 0.6);
        }

        if (flashPulse > 0.01) {
            tempColor.lerp(pureWhite, flashPulse);
        }

        colors[i] += (tempColor.r - colors[i]) * 0.05;
        colors[i+1] += (tempColor.g - colors[i+1]) * 0.05;
        colors[i+2] += (tempColor.b - colors[i+2]) * 0.05;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

initThree();
animate();
setTimeout(initAI, 1000);
