const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

const moonGroup = new THREE.Group();
scene.add(moonGroup);

const geometry = new THREE.SphereGeometry(1.2, 128, 128);

const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float uTime;
    uniform vec3 uSunDirection;
    uniform float uPhase;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }
    
    float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        for(int i = 0; i < 6; i++) {
            value += amplitude * noise(p * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
        }
        return value;
    }
    
    float crater(vec2 p, float r, float d) {
        float dist = length(p);
        float rim = smoothstep(r - 0.02, r, dist) - smoothstep(r, r + 0.02, dist);
        float bowl = smoothstep(r, 0.0, dist) * 0.3;
        return rim * d + bowl;
    }
    
    void main() {
        vec3 normal = normalize(vNormal);
        
        float light = dot(normal, uSunDirection);
        light = smoothstep(-0.1, 1.0, light);
        
        vec2 coord = vUv * 4.0;
        
        float surface = fbm(coord);
        float surface2 = fbm(coord * 2.0 + 100.0);
        
        float c1 = crater(vUv * 4.0 - vec2(0.5, 0.3), 0.3, 0.4);
        float c2 = crater(vUv * 5.0 - vec2(1.2, 0.8), 0.2, 0.3);
        float c3 = crater(vUv * 6.0 - vec2(0.3, 1.5), 0.15, 0.25);
        float c4 = crater(vUv * 3.5 - vec2(2.0, 0.5), 0.25, 0.35);
        float c5 = crater(vUv * 7.0 - vec2(1.5, 1.8), 0.1, 0.2);
        
        float craters = c1 + c2 + c3 + c4 + c5;
        
        vec3 baseColor = vec3(0.85, 0.85, 0.9);
        vec3 darkColor = vec3(0.2, 0.2, 0.25);
        vec3 craterColor = vec3(0.15, 0.15, 0.18);
        
        vec3 color = mix(darkColor, baseColor, surface * 0.5 + 0.5);
        color = mix(color, craterColor, craters * light);
        color *= (0.7 + surface2 * 0.3);
        
        color *= light;
        
        float phaseEdge = smoothstep(uPhase - 0.05, uPhase, vUv.x + surface * 0.05);
        color *= phaseEdge;
        
        float rim = 1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0)));
        rim = pow(rim, 2.0);
        color += vec3(0.4, 0.4, 0.5) * rim * 0.3 * light;
        
        gl_FragColor = vec4(color, 1.0);
    }
`;

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
        uPhase: { value: 0.2 }
    }
});

const moon = new THREE.Mesh(geometry, material);
moonGroup.add(moon);

const atmosphereGeometry = new THREE.SphereGeometry(1.3, 64, 64);
const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.5, 0.5, 0.6, 1.0) * intensity * 0.5;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});

const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
moonGroup.add(atmosphere);

const particleCount = 1500;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for(let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const r = 2.5 + Math.random() * 4;
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particlesMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.015,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const mouse = { x: 0, y: 0 };
const targetRotation = { x: 0, y: 0 };

document.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const elapsedTime = clock.getElapsedTime();
    
    material.uniforms.uTime.value = elapsedTime;
    
    targetRotation.x = mouse.y * 0.2;
    targetRotation.y = mouse.x * 0.2;
    
    moonGroup.rotation.x += (targetRotation.x - moonGroup.rotation.x) * 0.03;
    moonGroup.rotation.y += (targetRotation.y - moonGroup.rotation.y) * 0.03;
    
    moonGroup.rotation.y += 0.0005;
    
    particles.rotation.y += 0.0002;
    
    camera.position.x = Math.sin(elapsedTime * 0.05) * 0.3;
    camera.position.y = Math.cos(elapsedTime * 0.08) * 0.2;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
}

animate();

window.addEventListener('scroll', () => {
    const scroll = window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
    material.uniforms.uPhase.value = 0.1 + scroll * 0.8;
    
    const arrow = document.getElementById('arrow');
    if(window.pageYOffset > 100) {
        arrow.classList.add('hidden');
    } else {
        arrow.classList.remove('hidden');
    }
});

document.getElementById('arrow').addEventListener('click', () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
});
