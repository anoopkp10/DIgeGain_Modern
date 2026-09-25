import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 60 : 160;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 35;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    container.appendChild(renderer.domElement);

    // Particle nodes array
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Color palette from brand: Orange (#EA580C), Blue (#0284C7), Sky (#0EA5E9), Green (#16A34A)
    const brandColors = [
      new THREE.Color('#EA580C'),
      new THREE.Color('#0284C7'),
      new THREE.Color('#0EA5E9'),
      new THREE.Color('#16A34A'),
    ];

    const spread = 40;
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * spread * 0.7;
      const z = (Math.random() - 0.5) * 20;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

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

    // Particle sprite material
    const particleMaterial = new THREE.PointsMaterial({
      size: isMobile ? 0.7 : 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Dynamic Connections Line Segments
    const maxConnections = particleCount * 5;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineColors = new Float32Array(maxConnections * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3).setUsage(THREE.DynamicDrawUsage));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineMesh);

    // Rotating 3D Ribbon Torus/Globe in the background
    const ribbonGroup = new THREE.Group();
    const ribbonGeom = new THREE.TorusGeometry(12, 0.4, 16, 100);
    
    const matOrange = new THREE.MeshBasicMaterial({ color: 0xF7941D, wireframe: true, transparent: true, opacity: 0.25 });
    const matBlue = new THREE.MeshBasicMaterial({ color: 0x1E8FCC, wireframe: true, transparent: true, opacity: 0.25 });
    const matGreen = new THREE.MeshBasicMaterial({ color: 0x4CAF50, wireframe: true, transparent: true, opacity: 0.25 });

    const torus1 = new THREE.Mesh(ribbonGeom, matOrange);
    const torus2 = new THREE.Mesh(ribbonGeom, matBlue);
    const torus3 = new THREE.Mesh(ribbonGeom, matGreen);

    torus1.rotation.x = Math.PI / 4;
    torus2.rotation.y = Math.PI / 3;
    torus3.rotation.z = Math.PI / 6;

    ribbonGroup.add(torus1);
    ribbonGroup.add(torus2);
    ribbonGroup.add(torus3);
    ribbonGroup.position.set(10, 0, -10);
    scene.add(ribbonGroup);

    // Mouse Interaction
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = x * 15;
      mouse.targetY = y * 10;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let isTabActive = true;

    const handleVisibility = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isTabActive) return;

      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 0.3;
      camera.position.y = mouse.y * 0.3;
      camera.lookAt(0, 0, 0);

      // Rotate ribbons
      ribbonGroup.rotation.x = elapsed * 0.15;
      ribbonGroup.rotation.y = elapsed * 0.2;

      // Update particles
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const currentPos = posAttr.array as Float32Array;

      let lineIndex = 0;
      const connectionDist = 6.5;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;

        // Base idle floating
        currentPos[i3] += velocities[i3];
        currentPos[i3 + 1] += velocities[i3 + 1];
        currentPos[i3 + 2] += velocities[i3 + 2];

        // Return force towards original position
        currentPos[i3] += (originalPositions[i3] - currentPos[i3]) * 0.01;
        currentPos[i3 + 1] += (originalPositions[i3 + 1] - currentPos[i3 + 1]) * 0.01;
        currentPos[i3 + 2] += (originalPositions[i3 + 2] - currentPos[i3 + 2]) * 0.01;

        // Mouse repulsion/attraction field
        const dx = currentPos[i3] - mouse.x;
        const dy = currentPos[i3 + 1] - mouse.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        if (distToMouse < 9) {
          const force = (9 - distToMouse) * 0.02;
          currentPos[i3] += dx * force;
          currentPos[i3 + 1] += dy * force;
        }

        // Connect nearby particles
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

            // Color gradient line between particles
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
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    />
  );
};
