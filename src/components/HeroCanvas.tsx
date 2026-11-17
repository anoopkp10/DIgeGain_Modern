import React, { useEffect, useRef, useState } from 'react';

type RenderMode = 'webgl' | 'canvas2d' | 'css';

export const HeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<RenderMode>('webgl');
  const [webglFailed, setWebglFailed] = useState(false);
  const [canvasFailed, setCanvasFailed] = useState(false);

  // TIER 1: WebGL / Three.js – neural particle network with torus knot ribbons
  useEffect(() => {
    if (mode !== 'webgl') return;
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setMode('canvas2d');
      return;
    }

    const canvasTest = document.createElement('canvas');
    const webglSupported =
      !!(canvasTest.getContext('webgl') || canvasTest.getContext('experimental-webgl'));
    if (!webglSupported) {
      console.warn('WebGL not supported, falling back to Canvas 2D');
      setMode('canvas2d');
      return;
    }

    import('three').then((THREE) => {
      const isMobile = window.innerWidth < 768;
      const particleCount = isMobile ? 60 : 160;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 35;

      let animId: number;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      container.appendChild(renderer.domElement);

      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const originalPositions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);

      const brandColors = [
        new THREE.Color('#EA580C'),
        new THREE.Color('#0284C7'),
        new THREE.Color('#0EA5E9'),
        new THREE.Color('#16A34A'),
      ];

      const spread = 40;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
        originalPositions[i * 3] = positions[i * 3];
        originalPositions[i * 3 + 1] = positions[i * 3 + 1];
        originalPositions[i * 3 + 2] = positions[i * 3 + 2];
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        const col = brandColors[i % brandColors.length];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMaterial = new THREE.PointsMaterial({
        size: isMobile ? 0.7 : 1.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(geometry, particleMaterial);
      scene.add(particles);

      const maxConnections = particleCount * 5;
      const linePositions = new Float32Array(maxConnections * 6);
      const lineColors = new Float32Array(maxConnections * 6);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage)
      );
      lineGeometry.setAttribute(
        'color',
        new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage)
      );

      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
      });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lines);

      const ribbonCount = 6;
      const ribbons: THREE.Mesh[] = [];
      for (let i = 0; i < ribbonCount; i++) {
        const ribbonGeo = new THREE.TorusKnotGeometry(2 + i * 0.5, 0.4, 64, 16);
        const ribbonMat = new THREE.MeshStandardMaterial({
          color: brandColors[i % brandColors.length],
          emissive: brandColors[i % brandColors.length],
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.6,
        });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.position.set(
          (Math.random() - 0.5) * 60,
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 60
        );
        ribbon.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        scene.add(ribbon);
        ribbons.push(ribbon);
      }

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      const pointLight = new THREE.PointLight(0xffffff, 1, 100);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);

      let mouse = { x: 0, y: 0 };
      const handleMouseMove = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.x *= 40;
        mouse.y *= 28;
      };
      window.addEventListener('mousemove', handleMouseMove);

      const handleResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      const handleVisibility = () => {
        if (document.hidden) cancelAnimationFrame(animId);
        else animate();
      };
      document.addEventListener('visibilitychange', handleVisibility);

      const startTime = performance.now();
      const animate = (time: number = startTime) => {
        const elapsed = (time - startTime) * 0.001;

        camera.lookAt(0, 0, 0);
        ribbons.forEach((ribbon, i) => {
          ribbon.rotation.x = elapsed * (0.1 + i * 0.05);
          ribbon.rotation.y = elapsed * (0.15 + i * 0.03);
          ribbon.position.z = Math.sin(elapsed * 0.5 + i) * 15;
        });

        const posAttr = geometry.attributes.position as THREE.BufferAttribute;
        const currentPos = posAttr.array as Float32Array;

        let lineIndex = 0;
        const connectionDist = 6.5;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          currentPos[i3] += velocities[i3];
          currentPos[i3 + 1] += velocities[i3 + 1];
          currentPos[i3 + 2] += velocities[i3 + 2];
          currentPos[i3] += (originalPositions[i3] - currentPos[i3]) * 0.01;
          currentPos[i3 + 1] += (originalPositions[i3 + 1] - currentPos[i3 + 1]) * 0.01;
          currentPos[i3 + 2] += (originalPositions[i3 + 2] - currentPos[i3 + 2]) * 0.01;
          const dx = currentPos[i3] - mouse.x;
          const dy = currentPos[i3 + 1] - mouse.y;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 9) {
            const force = (9 - distToMouse) * 0.02;
            currentPos[i3] += dx * force;
            currentPos[i3 + 1] += dy * force;
          }
          for (let j = i + 1; j < particleCount; j++) {
            if (lineIndex >= maxConnections) break;
            const j3 = j * 3;
            const pDx = currentPos[i3] - currentPos[j3];
            const pDy = currentPos[i3 + 1] - currentPos[j3 + 1];
            const pDz = currentPos[i3 + 2] - currentPos[j3 + 2];
            const pDist = Math.sqrt(pDx * pDx + pDy * pDy + pDz * pDz);
            if (pDist < connectionDist) {
              const l6 = lineIndex * 6;
              linePositions[l6] = currentPos[i3];
              linePositions[l6 + 1] = currentPos[i3 + 1];
              linePositions[l6 + 2] = currentPos[i3 + 2];
              linePositions[l6 + 3] = currentPos[j3];
              linePositions[l6 + 4] = currentPos[j3 + 1];
              linePositions[l6 + 5] = currentPos[j3 + 2];
              lineColors[l6] = colors[i3];
              lineColors[l6 + 1] = colors[i3 + 1];
              lineColors[l6 + 2] = colors[i3 + 2];
              lineColors[l6 + 3] = colors[j3];
              lineColors[l6 + 4] = colors[j3 + 1];
              lineColors[l6 + 5] = colors[j3 + 2];
              lineIndex++;
            }
          }
        }

        posAttr.needsUpdate = true;
        lineGeometry.setDrawRange(0, lineIndex * 2);
        (lineGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (lineGeometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;

        renderer.render(scene, camera);
        animId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('visibilitychange', handleVisibility);
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }).catch((err) => {
      console.warn('Three.js load failed:', err);
      setMode('canvas2d');
    });
  }, [mode]);

  // TIER 2: Canvas 2D – lightweight particle network (works without WebGL)
  useEffect(() => {
    if (mode !== 'canvas2d') return;
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setMode('css');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 w-full h-full';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setMode('css');
      return;
    }

    const brandColors = ['#EA580C', '#0284C7', '#0EA5E9', '#16A34A'];
    let width = 0;
    let height = 0;
    let particles: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    };

    const initParticles = () => {
      const count = width < 768 ? 50 : 120;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          color: brandColors[i % brandColors.length],
          size: Math.random() * 2 + 1,
        });
      }
    };

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);

    resize();
    window.addEventListener('load', resize);

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.2 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) * 0.005;
          p.x += dx * force;
          p.y += dy * force;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [mode]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {mode === 'webgl' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0284C7]/5 via-transparent to-[#16A34A]/5" />
      )}
      {mode === 'canvas2d' && (
        <div className="absolute inset-0 bg-[#060D1A]/80 backdrop-blur-sm" />
      )}
      {mode === 'css' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0b1b2e] via-[#0284C7]/10 to-[#16A34A]/10 animate-pulse" />
      )}
    </div>
  );
};
