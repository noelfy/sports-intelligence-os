"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ThreeDKeypointData, ThreeDLandmark } from "@/types";

// MediaPipe pose connections (bone pairs)
const BONE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Face (simplified)
  [0, 11], [0, 12],
];

const JOINT_RADIUS = 8; // mm
const BONE_RADIUS = 4; // mm

interface Viewer3DProps {
  analysisId: string;
}

export function Viewer3D({ analysisId }: Viewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [keypoints, setKeypoints] = useState<ThreeDKeypointData | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const jointsRef = useRef<THREE.Mesh[]>([]);
  const bonesRef = useRef<THREE.Mesh[]>([]);

  // Load 3D keypoints
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    fetch(`${API_BASE}/files/keypoints/${analysisId}/keypoints_3d.json`)
      .then(async (res) => {
        if (!res.ok) {
          // Try output directory
          const altRes = await fetch(
            `${API_BASE}/files/keypoints/${analysisId}/compact.json`
          );
          if (!altRes.ok) throw new Error("3D keypoints not found");
          return altRes.json();
        }
        return res.json();
      })
      .then((data: ThreeDKeypointData) => {
        setKeypoints(data);
        setTotalFrames(data.frames.length);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load 3D data");
        setLoading(false);
      });
  }, [analysisId]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || loading) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.min(500, width * 0.75);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 100, 10000);
    camera.position.set(1500, 1200, 2000);
    camera.lookAt(0, 800, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x404060, 2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(1000, 2000, 1500);
    scene.add(dirLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 800, 0);
    controls.enableDamping = true;
    controls.update();

    // Ground plane
    const gridHelper = new THREE.PolarGridHelper(1500, 32, 24, 64, 0x334155, 0x1e293b);
    scene.add(gridHelper);

    // Floor reference
    const floorGeo = new THREE.PlaneGeometry(3000, 3000);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Create joint spheres (reused each frame)
    const jointMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 33; i++) {
      const geo = new THREE.SphereGeometry(JOINT_RADIUS, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      jointMeshes.push(mesh);
    }
    jointsRef.current = jointMeshes;

    // Create bone cylinders (reused each frame)
    const boneMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < BONE_CONNECTIONS.length; i++) {
      const geo = new THREE.CylinderGeometry(BONE_RADIUS, BONE_RADIUS, 1, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      scene.add(mesh);
      boneMeshes.push(mesh);
    }
    bonesRef.current = boneMeshes;

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [loading, containerRef.current]);

  // Update skeleton positions based on frameIndex
  useEffect(() => {
    if (!keypoints || !sceneRef.current) return;

    const frame = keypoints.frames[frameIndex];
    if (!frame || !frame.detected) {
      jointsRef.current.forEach((j) => (j.visible = false));
      bonesRef.current.forEach((b) => (b.visible = false));
      return;
    }

    const lmMap = new Map<number, ThreeDLandmark>();
    frame.landmarks.forEach((lm) => lmMap.set(lm.id, lm));

    // Update joints
    jointsRef.current.forEach((mesh, i) => {
      const lm = lmMap.get(i);
      if (lm) {
        mesh.position.set(lm.x, lm.y, lm.z);
        mesh.visible = true;
      } else {
        mesh.visible = false;
      }
    });

    // Update bones
    bonesRef.current.forEach((mesh, bi) => {
      const [from, to] = BONE_CONNECTIONS[bi];
      const a = lmMap.get(from);
      const b = lmMap.get(to);
      if (a && b) {
        const start = new THREE.Vector3(a.x, a.y, a.z);
        const end = new THREE.Vector3(b.x, b.y, b.z);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const dir = end.clone().sub(start);
        const length = dir.length();

        mesh.position.copy(mid);
        mesh.scale.y = length / 2;
        mesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.normalize()
        );
        mesh.visible = length > 0;
      } else {
        mesh.visible = false;
      }
    });
  }, [frameIndex, keypoints]);

  // Auto-play
  useEffect(() => {
    if (!playing || !keypoints) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % totalFrames);
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, [playing, totalFrames, keypoints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 text-sm">3D viewer unavailable — {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="rounded-xl overflow-hidden" />
      {/* Controls */}
      <div className="flex items-center justify-between mt-3 px-1">
        <button
          onClick={() => setPlaying(!playing)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={frameIndex}
            onChange={(e) => setFrameIndex(Number(e.target.value))}
            className="w-32 h-1 accent-amber-400"
          />
          <span className="text-xs text-slate-500 w-16 text-right">
            {frameIndex}/{totalFrames}
          </span>
        </div>
        <span className="text-xs text-slate-600">3D Skeleton 三维骨骼</span>
      </div>
    </div>
  );
}
