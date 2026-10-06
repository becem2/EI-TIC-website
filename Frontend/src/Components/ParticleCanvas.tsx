import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ParticleCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    syncSize();

    const vs = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      varying vec2 v_texCoord;

      void main() {
          vec2 uv = v_texCoord;
          vec2 mouse = u_mouse / u_resolution;
          float t = u_time * 0.25;
          float noise = sin(uv.x * 8.0 + t) * 0.5 + 0.5;
          noise *= cos(uv.y * 6.0 - t * 1.1) * 0.5 + 0.5;
          float dist = distance(uv, mouse);
          float glow = smoothstep(0.4, 0.0, dist) * 0.15;
          vec3 color1 = vec3(0.98, 0.98, 1.0);
          vec3 color2 = vec3(0.92, 0.95, 1.0);
          vec3 accent = vec3(0.0, 0.44, 0.92);
          vec3 finalColor = mix(color1, color2, noise);
          finalColor += accent * glow;
          gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function createShader(type: number, src: string) {
      if (!gl) return null;
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const vertShader = createShader(gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;

    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      syncSize();
    };
    window.addEventListener('resize', handleResize);

    const render = (t: number) => {
      if (!gl || !canvas) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const particleCount = 140;
    const points: THREE.Vector3[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 11;
      const y = (Math.random() - 0.5) * 11;
      const z = (Math.random() - 0.5) * 11;
      points.push(new THREE.Vector3(x, y, z));

      const sphereGeo = new THREE.SphereGeometry(0.045, 8, 8);
      const sphereMat = new THREE.MeshPhongMaterial({
        color: 0x007aff,
        emissive: 0x0044aa,
        shininess: 30,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(x, y, z);
      group.add(sphere);
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x007aff,
      transparent: true,
      opacity: 0.22,
    });

    for (let i = 0; i < points.length; i++) {
      const nearPoints = points.slice(i + 1).filter((p) => p.distanceTo(points[i]) < 2.4);
      nearPoints.forEach((p) => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([points[i], p]);
        const line = new THREE.Line(lineGeo, lineMaterial);
        group.add(line);
      });
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x007aff, 1.2, 20);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 8;

    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };

    const onResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    const animate = () => {
      group.rotation.y += 0.0018;
      group.rotation.x += 0.0009;
      group.position.x += (mouseX * 1.8 - group.position.x) * 0.04;
      group.position.y += (-mouseY * 1.8 - group.position.y) * 0.04;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <canvas ref={shaderCanvasRef} className="h-full w-full block" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center mix-blend-multiply opacity-65">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </>
  );
};
