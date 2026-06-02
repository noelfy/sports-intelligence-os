"use client";

import React, { Suspense, useEffect, useRef, useState, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  useGLTF,
  useAnimations,
  Html,
} from "@react-three/drei";
import * as THREE from "three";

// ============================================================
// Model configuration
// ============================================================
// Drop a human GLB (from Mixamo etc.) into /public/models/athlete.glb
const LOCAL_MODEL = "/models/athlete.glb";
const LOCAL_SCALE = 1;

// Three.js RobotExpressive — always available fallback with animations
const CDN_MODEL =
  "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb";
const CDN_SCALE = 0.5;

// ============================================================
// Exercise category → animation candidate names (tried in order)
// ============================================================
const CATEGORY_ANIMS: Record<string, string[]> = {
  squat: ["Jump", "Sit To Stand", "Crouch", "Walking", "Walk", "animation"],
  hinge: ["Dance", "Walking", "Walk", "Idle", "animation"],
  push: ["Punch", "Push Up", "Wave", "Idle", "Walk", "animation"],
  pull: ["Wave", "Climbing", "Punch", "Idle", "Walk", "animation"],
  core: ["Death", "Dance", "Punch", "Idle", "Walk", "animation"],
  isolation: ["Wave", "Punch", "Yes", "Idle", "Walk", "animation"],
  carry: ["Walking", "Running", "Walk", "animation", "Idle"],
};

const exerciseCategoryMap: Record<string, string> = {
  "barbell-squats": "squat",
  "bulgarian-split-squats": "squat",
  "goblet-squats": "squat",
  "lunges": "squat",
  "deadlifts": "hinge",
  "romanian-deadlifts": "hinge",
  "hip-thrusts": "hinge",
  "glute-bridges": "hinge",
  "barbell-bench-press": "push",
  "incline-dumbbell-press": "push",
  "push-ups": "push",
  "chest-dips": "push",
  "chest-flyes": "push",
  "arnold-press": "push",
  "overhead-press": "push",
  "tricep-dips": "push",
  "tricep-pushdowns": "push",
  "pull-ups": "pull",
  "lat-pulldowns": "pull",
  "bent-over-rows": "pull",
  "face-pulls": "pull",
  "barbell-curls": "isolation",
  "dumbbell-curls": "isolation",
  "hammer-curls": "isolation",
  "lateral-raises": "isolation",
  "planks": "core",
  "hanging-leg-raises": "core",
  "russian-twists": "core",
  "bird-dogs": "core",
};

// ============================================================
// Character Model
// ============================================================
function CharacterModel({
  animationName,
  playing,
  modelUrl,
  scale,
  isLocal,
}: {
  animationName: string;
  playing: boolean;
  modelUrl: string;
  scale: number;
  isLocal: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const { actions, mixer } = useAnimations(animations, group);

  // Clone scene so each instance is independent
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Debug: log available animations (one-time)
  useEffect(() => {
    if (animations.length > 0) {
      console.log(
        `🎬 Model animations (${modelUrl}):`,
        animations.map((a) => a.name)
      );
    }
  }, [animations, modelUrl]);

  // Find best matching animation clip
  const clip = useMemo(() => {
    if (animations.length === 0) return null;
    // Exact match
    let found = animations.find(
      (a) => a.name.toLowerCase() === animationName.toLowerCase()
    );
    // Contains match
    if (!found) {
      found = animations.find((a) =>
        a.name.toLowerCase().includes(animationName.toLowerCase())
      );
    }
    // First animation as fallback (a walking human is better than static)
    return found || animations[0];
  }, [animations, animationName]);

  // Play animation
  useEffect(() => {
    if (!clip || !mixer) return;

    const action = mixer.clipAction(clip);
    if (playing) {
      action.reset().fadeIn(0.3).play();
    }
    return () => {
      action.fadeOut(0.3);
    };
  }, [clip, mixer, playing]);

  return (
    <group ref={group} position={[0, isLocal ? -1.5 : -1.2, 0]} scale={scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ============================================================
// Loading fallback
// ============================================================
function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs">Loading 3D model...</p>
      </div>
    </Html>
  );
}

// ============================================================
// PUBLIC COMPONENT
// ============================================================
interface ExerciseModel3DProps {
  exerciseId: string;
  className?: string;
  playing?: boolean;
}

export function ExerciseModel3D({
  exerciseId,
  className,
  playing = true,
}: ExerciseModel3DProps) {
  const [modelConfig, setModelConfig] = useState<{
    url: string;
    scale: number;
    isFallback: boolean;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Detect best available model: local human > CDN robot
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      // Try local model first
      try {
        const res = await fetch(LOCAL_MODEL, { method: "HEAD" });
        if (res.ok && !cancelled) {
          setModelConfig({ url: LOCAL_MODEL, scale: LOCAL_SCALE, isFallback: false });
          return;
        }
      } catch {
        // Local model not found — use CDN
      }
      if (!cancelled) {
        setModelConfig({ url: CDN_MODEL, scale: CDN_SCALE, isFallback: true });
      }
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  // Determine animation name for this exercise
  const animationName = useMemo(() => {
    const cat = exerciseCategoryMap[exerciseId] || "isolation";
    const candidates = CATEGORY_ANIMS[cat] || ["Idle"];
    return candidates[0]; // Primary candidate (best match)
  }, [exerciseId]);

  // Error boundary
  if (loadError || !modelConfig) {
    return (
      <div className="flex items-center justify-center bg-slate-900/30 rounded-2xl border border-white/5 min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-2xl">🏃</span>
          </div>
          {loadError ? (
            <>
              <p className="text-slate-400 text-sm">Unable to load 3D model</p>
              <p className="text-slate-600 text-xs max-w-xs">
                {`Drop a .glb model file at /public/models/athlete.glb or check your connection.`}
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-500 text-sm">Detecting 3D model...</p>
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "1rem",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Canvas
        camera={{ position: [3, 1.5, 4], fov: 50, near: 0.1, far: 50 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0f172a"));
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={2.5}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight
          position={[-3, 2, 2]}
          intensity={0.8}
          color="#cbd5e1"
        />
        <directionalLight
          position={[0, 1, -4]}
          intensity={0.6}
          color="#f59e0b"
        />

        {/* Ground */}
        <ContactShadows
          position={[0, -2.45, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -2.46, 0]}
          receiveShadow
        >
          <planeGeometry args={[14, 14]} />
          <shadowMaterial transparent opacity={0.12} />
        </mesh>
        <gridHelper
          args={[7, 14, "rgba(245,158,11,0.06)", "rgba(245,158,11,0.03)"]}
          position={[0, -2.45, 0]}
        />

        {/* 3D Character */}
        <ErrorBoundary onError={() => setLoadError(true)}>
          <Suspense fallback={<LoadingSpinner />}>
            <CharacterModel
              animationName={animationName}
              playing={playing}
              modelUrl={modelConfig.url}
              scale={modelConfig.scale}
              isLocal={!modelConfig.isFallback}
            />
          </Suspense>
        </ErrorBoundary>

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={8}
          maxPolarAngle={Math.PI * 0.65}
          minPolarAngle={Math.PI * 0.2}
          autoRotate
          autoRotateSpeed={0.8}
          target={[0, 0.2, 0]}
        />
      </Canvas>

      {/* Model source indicator */}
      {modelConfig.isFallback && (
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-slate-500">
          🤖 Robot placeholder —{" "}
          <span className="text-amber-400/80">
            drop human model at <code className="text-[10px] bg-slate-800 px-1 py-0.5 rounded">/public/models/athlete.glb</code>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Simple error boundary for the 3D scene
// ============================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

