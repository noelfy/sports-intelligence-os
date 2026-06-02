"use client";

import { useEffect, useRef, useState, useCallback, type ReactElement } from "react";
import { cn } from "@/lib/utils";
import { getExercisePoses, type JointPositions } from "@/data/exercise-poses";

// ============================================================
// Linear interpolation
// ============================================================
function lerpJoints(a: JointPositions, b: JointPositions, t: number): JointPositions {
  const result = { ...a };
  const keys = Object.keys(a) as (keyof JointPositions)[];
  for (const key of keys) {
    const va = a[key]; const vb = b[key];
    if (!va || !vb || !Array.isArray(va) || !Array.isArray(vb) || va.length !== 2 || vb.length !== 2) continue;
    const [a0, a1] = va; const [b0, b1] = vb;
    if (typeof a0 === "number" && typeof b0 === "number") {
      (result as Record<string, unknown>)[key] = [a0 + (b0 - a0) * t, (a1 as number) + ((b1 as number) - (a1 as number)) * t];
    } else if (Array.isArray(a0) && Array.isArray(b0) && Array.isArray(a1) && Array.isArray(b1)) {
      (result as Record<string, unknown>)[key] = [
        [(a0[0] as number) + ((b0[0] as number) - (a0[0] as number)) * t, (a0[1] as number) + ((b0[1] as number) - (a0[1] as number)) * t],
        [(a1[0] as number) + ((b1[0] as number) - (a1[0] as number)) * t, (a1[1] as number) + ((b1[1] as number) - (a1[1] as number)) * t],
      ];
    }
  }
  return result as JointPositions;
}

// ============================================================
// REALISTIC HUMAN BODY RENDERER
// Filled body segments with 3D gradient, proportional anatomy
// ============================================================
function renderBody(j: JointPositions): ReactElement[] {
  const el: ReactElement[] = [];
  const FILL = "url(#bg)";
  const STROKE = "rgba(148,163,184,0.2)";
  const J = "#475569";
  const A = "#f59e0b";

  const footY = (j.lAnkle[1] + j.rAnkle[1]) / 2;

  // Ground shadow
  el.push(<ellipse key="sh" cx={(j.lAnkle[0] + j.rAnkle[0]) / 2 + 2} cy={footY + 8} rx="30" ry="4" fill="rgba(0,0,0,0.2)" />);

  // Head
  const hr = 11;
  el.push(<ellipse key="hd" cx={j.head[0]} cy={j.head[1]} rx={hr} ry={hr * 1.15} fill={FILL} stroke={STROKE} strokeWidth="0.8" />);

  // Neck
  const nt = j.head[1] + hr * 1.05;
  const nb = j.neck[1]; const nw = 5;
  el.push(<path key="nk" d={`M${j.neck[0] - nw} ${nt} L${j.neck[0] - nw + 2} ${nb} L${j.neck[0] + nw - 2} ${nb} L${j.neck[0] + nw} ${nt}Z`} fill={FILL} stroke={STROKE} strokeWidth="0.6" />);

  // Torso — tapered
  const tx = j.neck[0];
  const tw = Math.max(14, (j.rShoulder[0] - j.lShoulder[0]) / 2 + 3);
  const bw = Math.max(10, (j.rHip[0] - j.lHip[0]) / 2 + 2);
  const ty = nb + 2;
  const by = (j.lHip[1] + j.rHip[1]) / 2 + 4;
  const my = (ty + by) / 2;
  el.push(<path key="to" d={`M${tx - tw} ${ty} Q${tx - tw - 2} ${my} ${tx - bw} ${by} L${tx + bw} ${by} Q${tx + tw + 2} ${my} ${tx + tw} ${ty}Z`} fill={FILL} stroke={STROKE} strokeWidth="0.8" />);

  // Chest hint line
  const cy = ty + (by - ty) * 0.2;
  el.push(<path key="cl" d={`M${tx - tw + 4} ${cy} Q${tx} ${cy + 2} ${tx + tw - 4} ${cy}`} fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="0.7" />);

  // Limb builder: p1→p2→p3, thickness t1→t2
  function limb(k: string, p1: [number, number], p2: [number, number], p3: [number, number], t1: number, t2: number, r1: number, r2: number) {
    const a1 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
    const a2 = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]);
    const px1 = Math.cos(a1 + Math.PI / 2) * t1, py1 = Math.sin(a1 + Math.PI / 2) * t1;
    const px2 = Math.cos(a2 + Math.PI / 2) * t2, py2 = Math.sin(a2 + Math.PI / 2) * t2;
    el.push(<path key={`${k}u`} d={`M${p1[0] + px1} ${p1[1] + py1} L${p1[0] - px1} ${p1[1] - py1} L${p2[0] - px1 * 0.75} ${p2[1] - py1 * 0.75} L${p2[0] + px1 * 0.75} ${p2[1] + py1 * 0.75}Z`} fill={FILL} stroke={STROKE} strokeWidth="0.7" />);
    el.push(<path key={`${k}l`} d={`M${p2[0] + px2} ${p2[1] + py2} L${p2[0] - px2} ${p2[1] - py2} L${p3[0] - px2 * 0.55} ${p3[1] - py2 * 0.55} L${p3[0] + px2 * 0.55} ${p3[1] + py2 * 0.55}Z`} fill={FILL} stroke={STROKE} strokeWidth="0.7" />);
    el.push(<circle key={`${k}j1`} cx={p2[0]} cy={p2[1]} r={r1} fill={J} opacity="0.6" />);
    el.push(<circle key={`${k}j2`} cx={p3[0]} cy={p3[1]} r={r2} fill={J} opacity="0.4" />);
  }

  limb("la", j.lShoulder, j.lElbow, j.lWrist, 6.5, 5, 3.5, 2.5);
  limb("ra", j.rShoulder, j.rElbow, j.rWrist, 6.5, 5, 3.5, 2.5);
  limb("ll", j.lHip, j.lKnee, j.lAnkle, 8.5, 6.5, 4.5, 3.5);
  limb("rl", j.rHip, j.rKnee, j.rAnkle, 8.5, 6.5, 4.5, 3.5);

  // Joint caps
  for (const k of ["lShoulder", "rShoulder", "lHip", "rHip"] as const) {
    el.push(<circle key={`jc-${k}`} cx={j[k][0]} cy={j[k][1]} r="5.5" fill={J} opacity="0.5" />);
  }

  // Equipment
  if (j.bar) {
    el.push(<line key="bar" x1={j.bar[0][0]} y1={j.bar[0][1]} x2={j.bar[1][0]} y2={j.bar[1][1]} stroke={A} strokeWidth="4" strokeLinecap="round" opacity="0.9" />);
    el.push(<rect key="bp1" x={j.bar[0][0] - 6} y={j.bar[0][1] - 6} width="5" height="12" rx="2" fill="none" stroke={A} strokeWidth="1.5" opacity="0.7" />);
    el.push(<rect key="bp2" x={j.bar[1][0] + 1} y={j.bar[1][1] - 6} width="5" height="12" rx="2" fill="none" stroke={A} strokeWidth="1.5" opacity="0.7" />);
  }
  if (j.dbL) {
    el.push(<rect key="dbl" x={j.dbL[0] - 8} y={j.dbL[1] - 4} width="16" height="8" rx="2.5" fill="none" stroke={A} strokeWidth="1.8" />);
    el.push(<line key="dblb" x1={j.dbL[0] - 8} y1={j.dbL[1]} x2={j.dbL[0] + 8} y2={j.dbL[1]} stroke={A} strokeWidth="2.5" strokeLinecap="round" />);
  }
  if (j.dbR) {
    el.push(<rect key="dbr" x={j.dbR[0] - 8} y={j.dbR[1] - 4} width="16" height="8" rx="2.5" fill="none" stroke={A} strokeWidth="1.8" />);
    el.push(<line key="dbrb" x1={j.dbR[0] - 8} y1={j.dbR[1]} x2={j.dbR[0] + 8} y2={j.dbR[1]} stroke={A} strokeWidth="2.5" strokeLinecap="round" />);
  }

  return el;
}

// ============================================================
// EXERCISE ANIMATION
// ============================================================
interface ExerciseAnimationProps {
  exerciseId: string; className?: string; autoPlay?: boolean; size?: "sm" | "md" | "lg";
}

export function ExerciseAnimation({ exerciseId, className, autoPlay = true, size = "md" }: ExerciseAnimationProps) {
  const data = getExercisePoses(exerciseId);
  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const tick = useCallback((ts: number) => {
    if (!startRef.current) startRef.current = ts;
    const t = ((ts - startRef.current) % (data?.loopDuration ?? 4000)) / (data?.loopDuration ?? 4000);
    setProgress(t);
    if (data) setActiveIdx(Math.min(Math.floor(t * data.poses.length), data.poses.length - 1));
    animRef.current = requestAnimationFrame(tick);
  }, [data]);

  useEffect(() => {
    if (playing) { startRef.current = 0; animRef.current = requestAnimationFrame(tick); }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, tick]);

  if (!data) return <div className={cn("flex items-center justify-center bg-slate-900/30 rounded-2xl border border-white/5", className)} style={{ minHeight: size === "sm" ? 180 : 300 }}><p className="text-slate-500 text-sm">Coming soon</p></div>;

  const { poses, viewBox } = data;
  const n = poses.length;
  const seg = progress * n;
  const fi = Math.min(Math.floor(seg), n - 1);
  const ti = fi + 1 >= n ? 0 : fi + 1;
  const joints = lerpJoints(poses[fi].joints, poses[ti].joints, seg - fi);

  const sz = { sm: "min-h-[180px] max-w-[200px]", md: "min-h-[320px] max-w-[320px]", lg: "min-h-[420px] max-w-[400px]" };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className={cn("relative bg-gradient-to-b from-slate-900/40 to-slate-950/60 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden", sz[size], "w-full flex items-center justify-center")}>
        <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" /><stop offset="40%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {/* Floor */}
          <rect x="30" y={(joints.lAnkle[1] + joints.rAnkle[1]) / 2 + 12} width="140" height="24" fill="rgba(245,158,11,0.04)" />
          <line x1="30" y1={(joints.lAnkle[1] + joints.rAnkle[1]) / 2 + 12} x2="170" y2={(joints.lAnkle[1] + joints.rAnkle[1]) / 2 + 12} stroke="rgba(245,158,11,0.06)" strokeWidth="0.5" />
          {renderBody(joints)}
        </svg>
        {/* Controls */}
        <button type="button" onClick={() => setPlaying(!playing)} className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center hover:bg-slate-700/80 transition-colors">
          {playing ? <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            : <svg className="w-3 h-3 text-slate-300" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>}
        </button>
      </div>
      {/* Labels */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {poses.map((p, idx) => (
          <button key={p.id} type="button" onClick={() => { setProgress(idx / n); setActiveIdx(idx); startRef.current = performance.now() - (idx / n) * data.loopDuration; if (!playing) setPlaying(true); }}
            className={cn("px-2.5 py-1 text-xs rounded-full border transition-all duration-200", idx === activeIdx ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-slate-800/40 border-white/5 text-slate-500 hover:border-white/10")}>
            {p.labelZh}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// STATIC BREAKDOWN
// ============================================================
interface ExerciseVisualBreakdownProps { exerciseId: string; className?: string; }

export function ExerciseVisualBreakdown({ exerciseId, className }: ExerciseVisualBreakdownProps) {
  const data = getExercisePoses(exerciseId);
  if (!data) return null;
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.poses.map((pose) => (
          <div key={pose.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900/30 border border-white/5">
            <svg viewBox={data.viewBox} className="w-full h-36" preserveAspectRatio="xMidYMid meet">
              <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#334155" /><stop offset="40%" stopColor="#1e293b" /><stop offset="100%" stopColor="#0f172a" /></linearGradient></defs>
              {renderBody(pose.joints)}
            </svg>
            <div className="text-center"><p className="text-xs font-medium text-amber-400">{pose.labelZh}</p><p className="text-[10px] text-slate-500">{pose.label}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
