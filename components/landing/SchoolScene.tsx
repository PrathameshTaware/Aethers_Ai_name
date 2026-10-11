'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { StageNumber } from '@/lib/types';
import { stageByNumber } from '@/lib/stage';

interface SchoolSceneProps {
  stage: StageNumber;
  /** How many of the six PE classes are outdoors on the ground. The rest are in the hall. */
  outdoorClasses: number;
  className?: string;
}

const GROUPS = 6;
const PER_GROUP = 5;

/**
 * A real-time 3D diorama of the demo school. The haze thickens with the GRAP stage, and the
 * six PE classes walk between the ground and the cutaway hall as the plan from /rehearse changes.
 */
export function SchoolScene({ stage, outdoorClasses, className }: SchoolSceneProps) {
  const mount = useRef<HTMLDivElement>(null);
  // The render loop reads the latest props from here without being torn down and rebuilt.
  const live = useRef({ haze: stageByNumber(stage).haze, outdoor: outdoorClasses });
  useEffect(() => {
    live.current = { haze: stageByNumber(stage).haze, outdoor: outdoorClasses };
  }, [stage, outdoorClasses]);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      el.dataset.webgl = 'unavailable';
      return;
    }

    // Colours come from the design tokens, so the scene can never drift from the page.
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => new THREE.Color(css.getPropertyValue(name).trim() || '#888');
    const C = {
      paper: token('--color-paper'),
      paperLight: token('--color-paper-light'),
      paper2: token('--color-paper-2'),
      paper3: token('--color-paper-3'),
      ink: token('--color-ink'),
      haze: token('--color-haze'),
      breath: token('--color-breath'),
      breathInk: token('--color-breath-ink'),
      seal: token('--color-seal'),
      saffron: token('--color-saffron'),
    };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Full resolution to start; the loop lowers it only if this machine cannot keep up (see `adapt`).
    let pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // Everything but the children is static, and their hop is small: shadows refresh every other frame.
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.style.display = 'block';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fogColor = C.haze.clone().lerp(C.saffron, 0.12);
    scene.fog = new THREE.FogExp2(fogColor, 0.004);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const target = new THREE.Vector3(0, 0.2, 0.4);

    // ── Light ───────────────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0xffffff, C.paper3, 1.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
    sun.position.set(7, 12, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1536, 1536);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.0006;
    sun.shadow.radius = 5;
    scene.add(sun);

    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 32, 16),
      new THREE.MeshBasicMaterial({ color: C.saffron, transparent: true, fog: false }),
    );
    sunDisc.position.set(-9, 8.5, -13);
    scene.add(sunDisc);

    // ── Helpers ─────────────────────────────────────────────
    const mat = (color: THREE.Color, extra: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    const wall = mat(C.paperLight);
    const trim = mat(C.ink);
    const roofSeal = mat(C.seal);
    const windowMat = mat(C.ink, { roughness: 0.3 });

    // ── Ground slab ─────────────────────────────────────────
    box(17, 0.7, 12.5, mat(C.paper3), 0, -0.35, 0);
    box(17.3, 0.14, 12.8, trim, 0, -0.77, 0);

    // Ground A: the playing field with a running track.
    const field = box(6.4, 0.06, 5.6, mat(new THREE.Color('#8fb47a')), 4.2, 0.03, 1.6);
    field.castShadow = false;
    const lineMat = new THREE.MeshBasicMaterial({ color: C.paperLight });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.08, 48), lineMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(4.2, 0.07, 1.6);
    scene.add(ring);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(5.6, 4.8)),
      new THREE.LineBasicMaterial({ color: C.paperLight }),
    );
    outline.rotation.x = -Math.PI / 2;
    outline.position.set(4.2, 0.07, 1.6);
    scene.add(outline);
    const halfway = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 4.8), lineMat);
    halfway.rotation.x = -Math.PI / 2;
    halfway.position.set(4.2, 0.07, 1.6);
    scene.add(halfway);

    // ── Classroom block with rows of windows ───────────────
    box(8.4, 2.4, 2.6, wall, -1.8, 1.2, -4.2);
    box(8.8, 0.22, 3.0, roofSeal, -1.8, 2.51, -4.2);
    box(2.6, 2.4, 4.4, wall, -6.4, 1.2, -1.2);
    box(3.0, 0.22, 4.8, roofSeal, -6.4, 2.51, -1.2);
    const windows = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), windowMat, 14);
    const m4 = new THREE.Matrix4();
    let wi = 0;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 7; col++) {
        m4.setPosition(-5.1 + col * 1.1, 0.75 + row * 0.95, -2.88);
        windows.setMatrixAt(wi++, m4);
      }
    }
    scene.add(windows);
    box(0.7, 1.1, 0.06, trim, -1.8, 0.55, -2.88); // main door

    // ── Hall A: a cutaway so the indoor PE sessions are visible ─
    const hallFloorMat = mat(C.breath, { emissive: C.breath, emissiveIntensity: 0.15 });
    const HALL = { x: -1.6, z: 1.9, w: 4.2, d: 3.4 };
    box(HALL.w, 0.1, HALL.d, hallFloorMat, HALL.x, 0.05, HALL.z);
    const hallWall = mat(C.paperLight);
    box(HALL.w, 1.5, 0.16, hallWall, HALL.x, 0.75, HALL.z - HALL.d / 2); // back
    box(0.16, 1.5, HALL.d, hallWall, HALL.x - HALL.w / 2, 0.75, HALL.z); // left
    box(HALL.w, 0.5, 0.16, hallWall, HALL.x, 0.25, HALL.z + HALL.d / 2); // low front
    box(0.16, 0.5, HALL.d, hallWall, HALL.x + HALL.w / 2, 0.25, HALL.z); // low right
    box(HALL.w + 0.3, 0.12, 0.3, mat(C.breathInk), HALL.x, 1.56, HALL.z - HALL.d / 2);
    box(0.3, 0.12, HALL.d + 0.3, mat(C.breathInk), HALL.x - HALL.w / 2, 1.56, HALL.z);
    // Two air purifiers against the back wall.
    box(0.36, 0.8, 0.3, mat(C.paper2), HALL.x - 1.2, 0.5, HALL.z - HALL.d / 2 + 0.3);
    box(0.36, 0.8, 0.3, mat(C.paper2), HALL.x + 1.2, 0.5, HALL.z - HALL.d / 2 + 0.3);
    const hallGlow = new THREE.PointLight(C.breath, 0, 7, 1.6);
    hallGlow.position.set(HALL.x, 1.4, HALL.z);
    scene.add(hallGlow);

    // Gymnasium.
    box(2.6, 1.6, 2.4, wall, -6.4, 0.8, 3.9);
    box(2.9, 0.2, 2.7, mat(C.saffron), -6.4, 1.7, 3.9);

    // Trees and a flagpole.
    const leaf = mat(new THREE.Color('#5d8f62'));
    const trunk = mat(new THREE.Color('#7a5a3c'));
    [[7.6, -4.6], [6.2, -5], [4.6, -4.5], [-8, -5], [7.8, 5.2], [1.6, 5.4], [-3.6, 5.3]].forEach(([x, z], i) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.6, 8), trunk);
      t.position.set(x, 0.3, z);
      t.castShadow = true;
      const top = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 + (i % 3) * 0.1, 1), leaf);
      top.position.set(x, 1.0 + (i % 2) * 0.12, z);
      top.castShadow = true;
      scene.add(t, top);
    });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.6, 8), trim);
    pole.position.set(1.2, 1.3, -2.2);
    pole.castShadow = true;
    scene.add(pole);
    const flag = box(0.7, 0.42, 0.02, mat(C.saffron), 1.56, 2.36, -2.2);

    // ── The six PE classes ──────────────────────────────────
    const kidGeo = new THREE.CapsuleGeometry(0.085, 0.17, 4, 10);
    const headGeo = new THREE.SphereGeometry(0.075, 12, 10);
    const shirts = ['#e88a1a', '#2b3f8f', '#b3261e', '#fcf9f2', '#14181f', '#d59ac0'].map((h) => mat(new THREE.Color(h)));
    const skin = mat(new THREE.Color('#c99873'));

    interface Kid { node: THREE.Group; group: number; field: THREE.Vector3; hall: THREE.Vector3; phase: number }
    const kids: Kid[] = [];
    for (let g = 0; g < GROUPS; g++) {
      const fieldCentre = new THREE.Vector3(2.3 + (g % 3) * 1.9, 0, 0.3 + Math.floor(g / 3) * 2.5);
      const hallCentre = new THREE.Vector3(HALL.x - 1.3 + (g % 3) * 1.3, 0.1, HALL.z - 0.75 + Math.floor(g / 3) * 1.35);
      for (let k = 0; k < PER_GROUP; k++) {
        const a = (k / PER_GROUP) * Math.PI * 2 + g;
        const node = new THREE.Group();
        const body = new THREE.Mesh(kidGeo, shirts[g]);
        body.position.y = 0.17;
        body.castShadow = true;
        const head = new THREE.Mesh(headGeo, skin);
        head.position.y = 0.4;
        head.castShadow = true;
        node.add(body, head);
        const field = fieldCentre.clone().add(new THREE.Vector3(Math.cos(a) * 0.5, 0.06, Math.sin(a) * 0.5));
        const hall = hallCentre.clone().add(new THREE.Vector3(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3));
        node.position.copy(field);
        scene.add(node);
        kids.push({ node, group: g, field, hall, phase: a * 1.7 + k });
      }
    }

    // ── Smog particles ──────────────────────────────────────
    const SMOG = 520;
    const smogPos = new Float32Array(SMOG * 3);
    const smogSeed = new Float32Array(SMOG);
    for (let i = 0; i < SMOG; i++) {
      smogPos[i * 3] = (Math.random() - 0.5) * 18;
      smogPos[i * 3 + 1] = 0.3 + Math.random() * 5.5;
      smogPos[i * 3 + 2] = (Math.random() - 0.5) * 13;
      smogSeed[i] = Math.random() * Math.PI * 2;
    }
    const smogGeo = new THREE.BufferGeometry();
    smogGeo.setAttribute('position', new THREE.BufferAttribute(smogPos, 3));
    const dot = document.createElement('canvas');
    dot.width = dot.height = 64;
    const ctx = dot.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const smogMat = new THREE.PointsMaterial({
      color: C.haze.clone().multiplyScalar(0.72), size: 1.5, map: new THREE.CanvasTexture(dot),
      transparent: true, opacity: 0, depthWrite: false, fog: false,
    });
    const smog = new THREE.Points(smogGeo, smogMat);
    scene.add(smog);

    // ── Sizing, pointer, visibility ─────────────────────────
    // The handler only records the position. Reading the canvas rect here forced a layout on every mouse move;
    // the frame reads it once instead, and only after a scroll or resize could have moved it.
    const pointer = { x: 0, y: 0 };
    const client = { x: -1, y: -1 };
    let rect = el.getBoundingClientRect();
    let rectStale = false;
    const onPointer = (e: PointerEvent) => {
      client.x = e.clientX;
      client.y = e.clientY;
    };
    const onScroll = () => { rectStale = true; };
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      rectStale = true;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      camera.aspect = w / h;
      // Pull the camera back on narrow canvases so the whole campus stays in frame.
      camera.fov = w / h < 1 ? 44 : 30;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(el);

    // ── Loop ────────────────────────────────────────────────
    let last = performance.now();
    let t = 0;
    let haze = live.current.haze;
    let orbitX = 0;
    let orbitY = 0;
    let raf = 0;
    let frameNo = 0;
    const tmp = new THREE.Vector3();

    // Adaptive resolution: if frames average over ~24 ms (below ~40 fps) for a second, render at a lower
    // pixel ratio, down to 1. Machines that keep up never change; it never goes back up, so it cannot oscillate.
    let slowFrames = 0;
    let sampled = 0;
    const adapt = (frameMs: number) => {
      if (pixelRatio <= 1) return;
      sampled++;
      if (frameMs > 24) slowFrames++;
      if (sampled < 60) return;
      if (slowFrames > 40) {
        pixelRatio = Math.max(1, pixelRatio - 0.25);
        renderer.setPixelRatio(pixelRatio);
        resize();
      }
      sampled = 0;
      slowFrames = 0;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = performance.now(); // resume without a jump, and without counting the pause as a slow frame
        return;
      }
      const now = performance.now();
      const frameMs = now - last;
      const dt = Math.min(frameMs / 1000, 0.05);
      last = now;
      t += dt;
      frameNo++;
      if (frameNo > 30) adapt(frameMs); // skip start-up frames (shader compilation)

      if (client.x >= 0) {
        if (rectStale) {
          rect = el.getBoundingClientRect();
          rectStale = false;
        }
        pointer.x = ((client.x - rect.left) / rect.width - 0.5) * 2;
        pointer.y = ((client.y - rect.top) / rect.height - 0.5) * 2;
      }
      const ease = reduceMotion ? 1 : 1 - Math.exp(-dt * 2.6);

      haze += (live.current.haze - haze) * ease;
      (scene.fog as THREE.FogExp2).density = 0.003 + haze * 0.024;
      smogMat.opacity = haze * 0.42;
      sun.intensity = 2.5 - haze * 1.5;
      hemi.intensity = 1.5 - haze * 0.45;
      (sunDisc.material as THREE.MeshBasicMaterial).opacity = 1 - haze * 0.72;
      sunDisc.scale.setScalar(1 + haze * 0.5);

      const indoor = GROUPS - live.current.outdoor;
      hallGlow.intensity += (indoor * 1.6 - hallGlow.intensity) * ease;
      hallFloorMat.emissiveIntensity = 0.12 + (hallGlow.intensity / 10) * 0.5;

      for (const kid of kids) {
        // The first `outdoor` classes are the ones the plan kept on the ground.
        const dest = kid.group < live.current.outdoor ? kid.field : kid.hall;
        tmp.copy(dest);
        if (!reduceMotion) {
          tmp.x += Math.sin(t * 1.3 + kid.phase) * 0.12;
          tmp.z += Math.cos(t * 1.1 + kid.phase * 1.3) * 0.12;
        }
        const step = reduceMotion ? 1 : 1 - Math.exp(-dt * (1.4 + (kid.phase % 1) * 1.2));
        kid.node.position.x += (tmp.x - kid.node.position.x) * step;
        kid.node.position.z += (tmp.z - kid.node.position.z) * step;
        const hop = reduceMotion ? 0 : Math.abs(Math.sin(t * 5 + kid.phase)) * 0.07;
        kid.node.position.y = dest.y + hop;
      }

      if (!reduceMotion) {
        // Same drift as before, written straight into the typed array.
        for (let i = 0, j = 0; i < SMOG; i++, j += 3) {
          let x = smogPos[j] + dt * (0.25 + (smogSeed[i] % 1) * 0.3);
          if (x > 9) x = -9;
          smogPos[j] = x;
          smogPos[j + 1] += Math.sin(t * 0.6 + smogSeed[i]) * dt * 0.08;
        }
        (smogGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        flag.rotation.y = Math.sin(t * 2.4) * 0.18;
        orbitX += (pointer.x - orbitX) * 0.04;
        orbitY += (pointer.y - orbitY) * 0.04;
      }

      const angle = 0.78 + (reduceMotion ? 0 : Math.sin(t * 0.14) * 0.1) - orbitX * 0.32;
      const radius = 31;
      camera.position.set(Math.sin(angle) * radius, 17 - orbitY * 1.8, Math.cos(angle) * radius);
      camera.lookAt(target);
      if (frameNo % 2 === 1 || reduceMotion) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={mount}
      className={className}
      role="img"
      aria-label={`3D model of the demo school at GRAP Stage ${stageByNumber(stage).code}: ${outdoorClasses} of 6 PE classes outdoors, ${GROUPS - outdoorClasses} in the hall.`}
    />
  );
}
