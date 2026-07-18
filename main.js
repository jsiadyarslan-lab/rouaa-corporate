/* ═══════════════════════════════════════
   ROUAA CORPORATE — 3D NEURAL CORE + ANIMATIONS
   Phase 1: Three.js Neural Sphere + GSAP + Interactions
   ═══════════════════════════════════════ */

// ═══════════════════════════════════════
// THREE.JS NEURAL SPHERE
// ═══════════════════════════════════════
class NeuralCore {
    constructor() {
        this.canvas = document.getElementById('neural-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true, 
            antialias: true 
        });

        this.mouse = { x: 0, y: 0 };
        this.targetRotation = { x: 0, y: 0 };
        this.particles = [];
        this.lines = [];

        this.init();
    }

    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Camera position
        this.camera.position.z = 5;

        // Create neural sphere
        this.createNeuralSphere();

        // Create ambient particles
        this.createAmbientParticles();

        // Event listeners
        window.addEventListener('resize', () => this.onResize());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Start animation
        this.animate();
    }

    createNeuralSphere() {
        const particleCount = 800;
        const radius = 2.2;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const color1 = new THREE.Color(0x00d4aa);
        const color2 = new THREE.Color(0x0066ff);

        for (let i = 0; i < particleCount; i++) {
            // Fibonacci sphere distribution
            const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Gradient colors
            const mixFactor = (y + radius) / (radius * 2);
            const mixedColor = color1.clone().lerp(color2, mixFactor);
            colors[i * 3] = mixedColor.r;
            colors[i * 3 + 1] = mixedColor.g;
            colors[i * 3 + 2] = mixedColor.b;

            // Varied sizes
            sizes[i] = Math.random() * 3 + 1;

            // Store original positions for animation
            this.particles.push({
                originalPos: new THREE.Vector3(x, y, z),
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.5 + 0.5
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Custom shader material for glowing particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0, 0) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                uniform float uTime;

                void main() {
                    vColor = color;
                    vec3 pos = position;

                    // Breathing animation
                    float breath = sin(uTime * 0.5 + length(pos) * 2.0) * 0.05;
                    pos += normalize(pos) * breath;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;

                    vAlpha = 0.6 + 0.4 * sin(uTime + position.x * 3.0);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;

                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;

                    float glow = 1.0 - dist * 2.0;
                    glow = pow(glow, 1.5);

                    gl_FragColor = vec4(vColor, vAlpha * glow);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.sphere = new THREE.Points(geometry, material);
        this.scene.add(this.sphere);

        // Create connection lines
        this.createConnectionLines(radius);

        // Add inner glow sphere
        const glowGeometry = new THREE.SphereGeometry(radius * 0.6, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float uTime;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vec3 pos = position + normal * sin(uTime + position.x * 2.0) * 0.02;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float uTime;

                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    vec3 color = mix(vec3(0.0, 0.83, 0.67), vec3(0.0, 0.4, 1.0), 
                                   sin(uTime * 0.3 + vPosition.y) * 0.5 + 0.5);
                    gl_FragColor = vec4(color, intensity * 0.15);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });

        this.glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(this.glowSphere);
    }

    createConnectionLines(radius) {
        const lineCount = 150;
        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(lineCount * 2 * 3);
        const lineColors = new Float32Array(lineCount * 2 * 3);

        const color1 = new THREE.Color(0x00d4aa);
        const color2 = new THREE.Color(0x0066ff);

        for (let i = 0; i < lineCount; i++) {
            const phi1 = Math.random() * Math.PI * 2;
            const theta1 = Math.random() * Math.PI;
            const phi2 = phi1 + (Math.random() - 0.5) * 0.5;
            const theta2 = theta1 + (Math.random() - 0.5) * 0.5;

            const x1 = radius * Math.sin(theta1) * Math.cos(phi1);
            const y1 = radius * Math.sin(theta1) * Math.sin(phi1);
            const z1 = radius * Math.cos(theta1);

            const x2 = radius * Math.sin(theta2) * Math.cos(phi2);
            const y2 = radius * Math.sin(theta2) * Math.sin(phi2);
            const z2 = radius * Math.cos(theta2);

            linePositions[i * 6] = x1;
            linePositions[i * 6 + 1] = y1;
            linePositions[i * 6 + 2] = z1;
            linePositions[i * 6 + 3] = x2;
            linePositions[i * 6 + 4] = y2;
            linePositions[i * 6 + 5] = z2;

            const mixedColor = color1.clone().lerp(color2, Math.random());
            for (let j = 0; j < 2; j++) {
                lineColors[i * 6 + j * 3] = mixedColor.r;
                lineColors[i * 6 + j * 3 + 1] = mixedColor.g;
                lineColors[i * 6 + j * 3 + 2] = mixedColor.b;
            }
        }

        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });

        this.lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        this.scene.add(this.lines);
    }

    createAmbientParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                uniform float uTime;

                void main() {
                    vec3 pos = position;
                    pos.y += sin(uTime * 0.2 + pos.x) * 0.3;
                    pos.x += cos(uTime * 0.15 + pos.y) * 0.2;

                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (150.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    float glow = 1.0 - dist * 2.0;
                    gl_FragColor = vec4(0.0, 0.83, 0.67, glow * 0.3);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.ambientParticles = new THREE.Points(geometry, material);
        this.scene.add(this.ambientParticles);
    }

    onMouseMove(e) {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = performance.now() * 0.001;

        // Update shader uniforms
        if (this.sphere) {
            this.sphere.material.uniforms.uTime.value = time;
        }
        if (this.glowSphere) {
            this.glowSphere.material.uniforms.uTime.value = time;
        }
        if (this.ambientParticles) {
            this.ambientParticles.material.uniforms.uTime.value = time;
        }

        // Smooth rotation based on mouse
        this.targetRotation.x = this.mouse.y * 0.3;
        this.targetRotation.y = this.mouse.x * 0.3;

        if (this.sphere) {
            this.sphere.rotation.x += (this.targetRotation.x - this.sphere.rotation.x) * 0.05;
            this.sphere.rotation.y += (this.targetRotation.y - this.sphere.rotation.y) * 0.05;
            this.sphere.rotation.y += 0.002; // Auto rotation
        }

        if (this.lines) {
            this.lines.rotation.x = this.sphere.rotation.x;
            this.lines.rotation.y = this.sphere.rotation.y;
        }

        if (this.glowSphere) {
            this.glowSphere.rotation.y += 0.001;
        }

        // Pulsing glow
        if (this.glowSphere) {
            const scale = 1 + Math.sin(time * 0.5) * 0.02;
            this.glowSphere.scale.set(scale, scale, scale);
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// ═══════════════════════════════════════
// GSAP ANIMATIONS
// ═══════════════════════════════════════
class AnimationController {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);
        this.init();
    }

    init() {
        this.animateNavScroll();
        this.animateStatCards();
        this.animateCounter();
    }

    animateNavScroll() {
        const nav = document.querySelector('.glass-nav');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    animateStatCards() {
        const cards = document.querySelectorAll('.stat-card');

        cards.forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                delay: index * 0.15,
                ease: 'power3.out'
            });
        });
    }

    animateCounter() {
        const counters = document.querySelectorAll('.stat-number');

        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);

            ScrollTrigger.create({
                trigger: counter,
                start: 'top 85%',
                onEnter: () => {
                    gsap.to(counter, {
                        innerHTML: target,
                        duration: 2,
                        ease: 'power2.out',
                        snap: { innerHTML: 1 },
                        onUpdate: function() {
                            counter.innerHTML = Math.round(this.targets()[0].innerHTML);
                        }
                    });
                },
                once: true
            });
        });
    }
}

// ═══════════════════════════════════════
// MAGNETIC BUTTON EFFECT
// ═══════════════════════════════════════
class MagneticEffect {
    constructor() {
        this.elements = document.querySelectorAll('.magnetic');
        this.init();
    }

    init() {
        this.elements.forEach(el => {
            el.addEventListener('mousemove', (e) => this.onMouseMove(e, el));
            el.addEventListener('mouseleave', (e) => this.onMouseLeave(e, el));
        });
    }

    onMouseMove(e, el) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(el, {
            x: x * 0.3,
            y: y * 0.3,
            duration: 0.3,
            ease: 'power2.out'
        });
    }

    onMouseLeave(e, el) {
        gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.5)'
        });
    }
}

// ═══════════════════════════════════════
// 3D TILT EFFECT FOR CARDS
// ═══════════════════════════════════════
class TiltEffect {
    constructor() {
        this.cards = document.querySelectorAll('.stat-card, .glass');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => this.onMouseMove(e, card));
            card.addEventListener('mouseleave', (e) => this.onMouseLeave(e, card));
        });
    }

    onMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        gsap.to(card, {
            rotateX: rotateX,
            rotateY: rotateY,
            transformPerspective: 1000,
            duration: 0.4,
            ease: 'power2.out'
        });
    }

    onMouseLeave(e, card) {
        gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.6,
            ease: 'power2.out'
        });
    }
}

// ═══════════════════════════════════════
// CURSOR GLOW EFFECT
// ═══════════════════════════════════════
class CursorGlow {
    constructor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'cursor-glow';
        this.init();
    }

    init() {
        // Add cursor styles
        const style = document.createElement('style');
        style.textContent = `
            .cursor-glow {
                position: fixed;
                width: 300px;
                height: 300px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(0, 212, 170, 0.08), transparent 70%);
                pointer-events: none;
                z-index: 9999;
                transform: translate(-50%, -50%);
                transition: opacity 0.3s ease;
                mix-blend-mode: screen;
            }
            @media (pointer: coarse) {
                .cursor-glow { display: none; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.cursor);

        document.addEventListener('mousemove', (e) => {
            gsap.to(this.cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        // Hide on mobile
        if (window.matchMedia('(pointer: coarse)').matches) {
            this.cursor.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════
// INITIALIZE EVERYTHING
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    

// ═══════════════════════════════════════
// NEWS SECTION ANIMATIONS
// ═══════════════════════════════════════
class NewsSectionAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.animateSectionHeader();
        this.animateDashboard();
        this.animateFeatureCards();
        this.initDashboardHover();
    }

    animateSectionHeader() {
        const header = document.querySelector('.news-section .section-header');
        if (!header) return;

        gsap.from(header.children, {
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power3.out'
        });
    }

    animateDashboard() {
        const dashboard = document.querySelector('.news-dashboard');
        if (!dashboard) return;

        gsap.from(dashboard, {
            scrollTrigger: {
                trigger: dashboard,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 60,
            opacity: 0,
            rotateX: 10,
            duration: 1.2,
            ease: 'power3.out'
        });

        const cards = dashboard.querySelectorAll('.news-card');
        gsap.from(cards, {
            scrollTrigger: {
                trigger: dashboard,
                start: 'top 75%',
                toggleActions: 'play none none reverse'
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.3
        });
    }

    animateFeatureCards() {
        const features = document.querySelectorAll('.feature-item');

        features.forEach((feature, index) => {
            gsap.from(feature, {
                scrollTrigger: {
                    trigger: feature,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                delay: index * 0.1,
                ease: 'power3.out'
            });
        });
    }

    initDashboardHover() {
        const dashboard = document.querySelector('.news-dashboard');
        if (!dashboard) return;

        dashboard.addEventListener('mousemove', (e) => {
            const rect = dashboard.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            gsap.to(dashboard, {
                rotateY: x * 5,
                rotateX: -y * 5,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        dashboard.addEventListener('mouseleave', () => {
            gsap.to(dashboard, {
                rotateY: 0,
                rotateX: 0,
                duration: 0.8,
                ease: 'elastic.out(1, 0.5)'
            });
        });
    }
}

// Initialize 3D Neural Core
    new NeuralCore();

    // Initialize GSAP Animations
    new AnimationController();

    // Initialize Magnetic Effect
    new MagneticEffect();

    // Initialize Tilt Effect
    new TiltEffect();

    // Initialize News Section Animations
    new NewsSectionAnimations();

    // Initialize Trading Chart
    new TradingChart();

    // Initialize Trading Section Animations
    new TradingSectionAnimations();

    // Initialize Cursor Glow (desktop only)
    if (!window.matchMedia('(pointer: coarse)').matches) {
        new CursorGlow();
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
