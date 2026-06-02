/**
 * Client-side pose analysis engine.
 *
 * Uses MediaPipe PoseLandmarker (WASM + WebGL) to detect 33 body landmarks
 * in video frames entirely in the browser — no server upload needed.
 *
 * Pipeline: video → frame sampling → pose detection → metric calculation → feedback
 */

import type { AnalysisResult, FeedbackData } from "@/types";

// ── MediaPipe types (imported dynamically to avoid SSR issues) ──
let PoseLandmarker: any;
let FilesetResolver: any;
let DrawingUtils: any;

// ── Singleton state ──
let landmarker: any = null;
let initPromise: Promise<void> | null = null;
let modelLoaded = false;

// ── CDN / model paths ──
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const MODEL_PATH = "/models/pose_landmarker_lite.task";

// ── Landmark indices (MediaPipe Pose) ──
const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// ──────────────────────────────────────────────
// Initialization
// ──────────────────────────────────────────────

export async function initializePoseDetector(
  onProgress?: (msg: string) => void
): Promise<void> {
  if (modelLoaded && landmarker) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      onProgress?.("Loading pose detection engine... (加载姿态检测引擎)");

      // Dynamic import to avoid SSR bundling issues
      const visionModule = await import("@mediapipe/tasks-vision");
      PoseLandmarker = visionModule.PoseLandmarker;
      FilesetResolver = visionModule.FilesetResolver;
      DrawingUtils = visionModule.DrawingUtils;

      onProgress?.("Downloading WASM runtime... (下载运行时)");
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);

      onProgress?.("Loading AI model... (加载AI模型 ~5MB)");
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_PATH,
          delegate: "GPU", // WebGL GPU acceleration
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      modelLoaded = true;
      onProgress?.("Engine ready. (引擎就绪)");
    } catch (err) {
      initPromise = null;
      throw new Error(
        `Failed to load pose detection: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  })();

  return initPromise;
}

export function isPoseDetectorReady(): boolean {
  return modelLoaded && landmarker !== null;
}

// ──────────────────────────────────────────────
// Video Processing
// ──────────────────────────────────────────────

export interface ProcessingProgress {
  pct: number;
  msg: string;
}

export interface FrameAnalysis {
  timestamp: number;
  landmarks: Landmark3D[];
  detected: boolean;
  angles: JointAngles | null;
}

export interface Landmark3D {
  id: number;
  name: string;
  x: number; // image-normalized (or mm after scaling)
  y: number;
  z: number;
  visibility: number;
}

export interface JointAngles {
  leftKnee: number;
  rightKnee: number;
  leftHip: number;
  rightHip: number;
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  spineAngle: number;
}

/**
 * Process a video file and extract pose landmarks frame by frame.
 * Samples at ~10 FPS for a good balance of coverage and speed.
 */
export async function processVideo(
  videoFile: File,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<{ frames: FrameAnalysis[]; metadata: VideoMetadata; keypointsFrames: any[] }> {
  if (!isPoseDetectorReady()) {
    await initializePoseDetector((msg) => onProgress?.({ pct: 0, msg }));
  }

  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.src = URL.createObjectURL(videoFile);

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Cannot load video file. (无法加载视频文件)"));
    video.load();
  });

  const duration = video.duration;
  const sampleFps = 10;
  const frameInterval = 1 / sampleFps;
  const totalFrames = Math.max(1, Math.floor(duration / frameInterval));

  // Cap at 300 frames (~30 seconds at 10fps) to prevent excessive processing
  const effectiveFrames = Math.min(totalFrames, 300);
  if (totalFrames > 300) {
    onProgress?.({
      pct: 0,
      msg: `Video is ${Math.round(duration)}s long. Analyzing first 30s for quicker results. (视频较长，分析前30秒)`,
    });
  }

  const frames: FrameAnalysis[] = [];
  const keypointsFrames: any[] = [];
  const width = video.videoWidth;
  const height = video.videoHeight;

  // Helper: wait for video seek
  const seekTo = (time: number): Promise<void> =>
    new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = time;
    });

  for (let i = 0; i < effectiveFrames; i++) {
    const timestamp = i * frameInterval;
    await seekTo(Math.min(timestamp, duration - 0.01));

    const timeMs = timestamp * 1000;
    let result;
    try {
      result = landmarker.detectForVideo(video, timeMs);
    } catch {
      // If detection fails, push empty frame and continue
      frames.push({
        timestamp: timeMs,
        landmarks: [],
        detected: false,
        angles: null,
      });
      keypointsFrames.push({
        frame_index: i,
        timestamp_ms: timeMs,
        landmarks: [],
        detected: false,
      });
      const pct = Math.round(((i + 1) / effectiveFrames) * 90); // 0-90% is processing
      onProgress?.({ pct, msg: `Analyzing frame ${i + 1}/${effectiveFrames}... (分析帧)` });
      continue;
    }

    let frameLandmarks: Landmark3D[] = [];
    let detected = false;
    let angles: JointAngles | null = null;

    if (result.landmarks && result.landmarks.length > 0) {
      const rawLandmarks = result.landmarks[0];
      detected = rawLandmarks.length >= 12; // need at least 12 keypoints for reliable analysis

      if (detected) {
        frameLandmarks = rawLandmarks.map((lm: any, idx: number) => ({
          id: idx,
          name: LANDMARK_NAMES[idx] || `lm_${idx}`,
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 0,
        }));

        angles = calculateJointAngles(rawLandmarks);

        keypointsFrames.push({
          frame_index: i,
          timestamp_ms: timeMs,
          landmarks: frameLandmarks.map((lm) => ({
            id: lm.id,
            name: lm.name,
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility,
          })),
          detected: true,
        });
      }
    }

    if (!detected) {
      keypointsFrames.push({
        frame_index: i,
        timestamp_ms: timeMs,
        landmarks: [],
        detected: false,
      });
    }

    frames.push({ timestamp: timeMs, landmarks: frameLandmarks, detected, angles });

    const pct = Math.round(((i + 1) / effectiveFrames) * 90);
    onProgress?.({
      pct,
      msg: `Analyzing frame ${i + 1}/${effectiveFrames}... (分析第${i + 1}帧/共${effectiveFrames}帧)`,
    });
  }

  URL.revokeObjectURL(video.src);

  const detectedFrames = frames.filter((f) => f.detected);
  const detectionRate = detectedFrames.length / Math.max(frames.length, 1);

  const metadata: VideoMetadata = {
    video_filename: videoFile.name,
    video_fps: sampleFps,
    video_duration_ms: Math.round(duration * 1000),
    total_frames: frames.length,
    frames_processed: frames.length,
    frames_with_pose: detectedFrames.length,
    width,
    height,
    detection_rate: Math.round(detectionRate * 100) / 100,
  };

  return { frames, metadata, keypointsFrames };
}

export interface VideoMetadata {
  video_filename: string;
  video_fps: number;
  video_duration_ms: number;
  total_frames: number;
  frames_processed: number;
  frames_with_pose: number;
  width: number;
  height: number;
  detection_rate: number;
}

// ──────────────────────────────────────────────
// Landmark Names
// ──────────────────────────────────────────────

const LANDMARK_NAMES: Record<number, string> = {
  0: "nose",
  1: "left_eye_inner",
  2: "left_eye",
  3: "left_eye_outer",
  4: "right_eye_inner",
  5: "right_eye",
  6: "right_eye_outer",
  7: "left_ear",
  8: "right_ear",
  9: "mouth_left",
  10: "mouth_right",
  11: "left_shoulder",
  12: "right_shoulder",
  13: "left_elbow",
  14: "right_elbow",
  15: "left_wrist",
  16: "right_wrist",
  17: "left_pinky",
  18: "right_pinky",
  19: "left_index",
  20: "right_index",
  21: "left_thumb",
  22: "right_thumb",
  23: "left_hip",
  24: "right_hip",
  25: "left_knee",
  26: "right_knee",
  27: "left_ankle",
  28: "right_ankle",
  29: "left_heel",
  30: "right_heel",
  31: "left_foot_index",
  32: "right_foot_index",
};

// ──────────────────────────────────────────────
// Joint Angle Calculation
// ──────────────────────────────────────────────

function angle3pt(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  c: { x: number; y: number; z: number }
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);
  if (magBA < 1e-6 || magBC < 1e-6) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round(Math.acos(cos) * (180 / Math.PI) * 10) / 10;
}

function calculateJointAngles(
  landmarks: Array<{ x: number; y: number; z: number }>
): JointAngles {
  const lShoulder = landmarks[LM.LEFT_SHOULDER];
  const rShoulder = landmarks[LM.RIGHT_SHOULDER];
  const lElbow = landmarks[LM.LEFT_ELBOW];
  const rElbow = landmarks[LM.RIGHT_ELBOW];
  const lWrist = landmarks[LM.LEFT_WRIST];
  const rWrist = landmarks[LM.RIGHT_WRIST];
  const lHip = landmarks[LM.LEFT_HIP];
  const rHip = landmarks[LM.RIGHT_HIP];
  const lKnee = landmarks[LM.LEFT_KNEE];
  const rKnee = landmarks[LM.RIGHT_KNEE];
  const lAnkle = landmarks[LM.LEFT_ANKLE];
  const rAnkle = landmarks[LM.RIGHT_ANKLE];

  // Knee angle: hip → knee → ankle (180° = straight leg, ~90° = deep squat)
  const leftKnee = angle3pt(lHip, lKnee, lAnkle);
  const rightKnee = angle3pt(rHip, rKnee, rAnkle);

  // Hip angle: shoulder → hip → knee (~180° = standing straight)
  const leftHip = angle3pt(lShoulder, lHip, lKnee);
  const rightHip = angle3pt(rShoulder, rHip, rKnee);

  // Shoulder angle: elbow → shoulder → hip
  const leftShoulder = angle3pt(lElbow, lShoulder, lHip);
  const rightShoulder = angle3pt(rElbow, rShoulder, rHip);

  // Elbow angle: shoulder → elbow → wrist (180° = straight arm)
  const leftElbow = angle3pt(lShoulder, lElbow, lWrist);
  const rightElbow = angle3pt(rShoulder, rElbow, rWrist);

  // Spine angle: deviation from vertical
  const shoulderMidX = (lShoulder.x + rShoulder.x) / 2;
  const shoulderMidY = (lShoulder.y + rShoulder.y) / 2;
  const hipMidX = (lHip.x + rHip.x) / 2;
  const hipMidY = (lHip.y + rHip.y) / 2;
  const spineAngle =
    Math.round(
      Math.abs(
        Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY) *
          (180 / Math.PI)
      ) * 10
    ) / 10;

  return {
    leftKnee,
    rightKnee,
    leftHip,
    rightHip,
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    spineAngle,
  };
}

// ──────────────────────────────────────────────
// Metrics Calculation
// ──────────────────────────────────────────────

export interface BiomechanicalMetrics {
  stability: number; // 0-100
  symmetry: number; // 0-100
  range_of_motion: number; // 0-100
  tempo: number; // 0-100
  posture: number; // 0-100
}

export function calculateMetrics(
  frames: FrameAnalysis[]
): BiomechanicalMetrics {
  const detected = frames.filter((f) => f.detected && f.angles);
  if (detected.length < 3) {
    return {
      stability: 50,
      symmetry: 50,
      range_of_motion: 50,
      tempo: 50,
      posture: 50,
    };
  }

  // ── Stability (hip position variance) ──
  const hipXValues = detected.map((f) => {
    const lh = f.landmarks[LM.LEFT_HIP];
    const rh = f.landmarks[LM.RIGHT_HIP];
    return lh && rh ? (lh.x + rh.x) / 2 : 0.5;
  });
  const hipXVariance = variance(hipXValues.filter((v) => v > 0));
  // Normalize: typical variance ~0.0001-0.01. Map to 0-100 (lower variance = higher score)
  const stability = Math.round(clamp(100 - Math.sqrt(hipXVariance) * 1000, 20, 100));

  // ── Symmetry (left-right angle differences) ──
  const kneeDiffs = detected.map(
    (f) => Math.abs(f.angles!.leftKnee - f.angles!.rightKnee)
  );
  const hipDiffs = detected.map(
    (f) => Math.abs(f.angles!.leftHip - f.angles!.rightHip)
  );
  const avgKneeDiff = mean(kneeDiffs);
  const avgHipDiff = mean(hipDiffs);
  // Average difference: 0° = perfect symmetry (100), >15° = poor (0)
  const symmetryRaw = (avgKneeDiff + avgHipDiff) / 2;
  const symmetry = Math.round(clamp(100 - symmetryRaw * 6.67, 10, 100));

  // ── Range of Motion (knee & hip angle excursion) ──
  const kneeAngles = detected.map((f) => (f.angles!.leftKnee + f.angles!.rightKnee) / 2);
  const hipAngles = detected.map((f) => (f.angles!.leftHip + f.angles!.rightHip) / 2);
  const kneeROM = Math.max(...kneeAngles) - Math.min(...kneeAngles);
  const hipROM = Math.max(...hipAngles) - Math.min(...hipAngles);
  // For squats: kneeROM ~40-80° is good. Map to score.
  const romRaw = (kneeROM + hipROM) / 2;
  const range_of_motion = Math.round(clamp(romRaw * 1.5, 15, 100));

  // ── Tempo (regularity of movement rhythm) ──
  // Detect cycles in knee angle and measure consistency
  const cycleDurations = detectMovementCycles(
    detected.map((f) => (f.angles!.leftKnee + f.angles!.rightKnee) / 2),
    detected.map((f) => f.timestamp)
  );
  let tempo: number;
  if (cycleDurations.length >= 2) {
    const meanCycle = mean(cycleDurations);
    const cvCycles = Math.sqrt(variance(cycleDurations)) / Math.max(meanCycle, 0.001);
    // Coefficient of variation: 0 = perfectly regular, >0.3 = very irregular
    tempo = Math.round(clamp(100 - cvCycles * 200, 15, 100));
  } else {
    tempo = 50; // Not enough cycles to assess
  }

  // ── Posture (spine alignment) ──
  const spineAngles = detected.map((f) => f.angles!.spineAngle);
  const avgSpineAngle = mean(spineAngles);
  // 0° deviation = perfect (100), >15° = poor (0)
  const posture = Math.round(clamp(100 - avgSpineAngle * 6.67, 10, 100));

  return {
    stability,
    symmetry,
    range_of_motion,
    tempo,
    posture,
  };
}

// ──────────────────────────────────────────────
// Overall Score
// ──────────────────────────────────────────────

export function calculateOverallScore(metrics: BiomechanicalMetrics): number {
  const weights = {
    stability: 0.2,
    symmetry: 0.2,
    range_of_motion: 0.25,
    tempo: 0.15,
    posture: 0.2,
  };
  const weighted =
    metrics.stability * weights.stability +
    metrics.symmetry * weights.symmetry +
    metrics.range_of_motion * weights.range_of_motion +
    metrics.tempo * weights.tempo +
    metrics.posture * weights.posture;
  return Math.round(clamp(weighted, 10, 98));
}

// ──────────────────────────────────────────────
// Feedback Generation
// ──────────────────────────────────────────────

export function generateFeedback(
  metrics: BiomechanicalMetrics,
  overallScore: number,
  metadata: VideoMetadata,
  exerciseName?: string
): FeedbackData {
  const { stability, symmetry, range_of_motion, tempo, posture } = metrics;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (stability >= 75) {
    strengths.push("Excellent stability throughout the movement (动作非常稳定)");
  } else if (stability < 50) {
    improvements.push("Improve stability — reduce body sway during the movement (减少身体晃动)");
  } else if (stability >= 60) {
    strengths.push("Good core stability (核心稳定性良好)");
  }

  if (symmetry >= 75) {
    strengths.push("Great left-right symmetry (左右对称性优秀)");
  } else if (symmetry < 50) {
    improvements.push("Work on left-right balance — asymmetry detected between sides (改善左右平衡)");
  } else if (symmetry >= 60) {
    strengths.push("Decent symmetry between left and right sides (左右基本对称)");
  }

  if (range_of_motion >= 70) {
    strengths.push("Full range of motion — joints moving through healthy ranges (关节活动范围充分)");
  } else if (range_of_motion < 45) {
    improvements.push("Increase range of motion — try deeper movements or mobility work (增加动作幅度)");
  } else {
    strengths.push("Adequate range of motion (活动范围尚可)");
  }

  if (tempo >= 75) {
    strengths.push("Very consistent movement tempo — great rhythm (节奏非常稳定)");
  } else if (tempo < 50) {
    improvements.push("Maintain a more consistent pace — control each repetition evenly (保持匀速运动)");
  } else if (tempo >= 60) {
    strengths.push("Fairly consistent tempo (节奏基本一致)");
  }

  if (posture >= 75) {
    strengths.push("Excellent spinal alignment — trunk stays upright and braced (脊柱对齐优秀)");
  } else if (posture < 50) {
    improvements.push("Focus on spinal posture — avoid rounding or excessive leaning (注意脊柱姿势)");
  } else if (posture >= 60) {
    strengths.push("Good trunk posture (躯干姿势良好)");
  }

  // If no strengths, add a general one
  if (strengths.length === 0) {
    strengths.push("Movement detected — ready to build better form (检测到运动，可以进一步优化)");
  }

  // If no specific improvements, add a general one
  if (improvements.length === 0 && overallScore < 90) {
    improvements.push("Continue practicing — consistency is key to perfect form (继续练习，一致性是关键)");
  }

  const detectionRate = metadata.detection_rate;
  if (detectionRate < 0.5) {
    improvements.push(
      `Pose detection was low (${Math.round(detectionRate * 100)}% of frames). Ensure full body is visible and well-lit. (姿态检测率低，请确保全身可见且光线充足)`
    );
  } else if (detectionRate < 0.8) {
    improvements.push(
      `Pose detection could be better (${Math.round(detectionRate * 100)}%). Try better lighting or camera angle. (姿态检测率可提升，尝试更好的光线或拍摄角度)`
    );
  }

  // Summary
  const exerciseLabel = exerciseName ? ` for ${exerciseName}` : "";
  let summary: string;
  if (overallScore >= 80) {
    summary = `Great form${exerciseLabel}! Your movement quality is impressive. Minor adjustments can take you to the next level. (动作质量出色！稍作调整即可达到更高水平)`;
  } else if (overallScore >= 65) {
    summary = `Solid form${exerciseLabel}. A few key adjustments will significantly improve your movement efficiency and reduce injury risk. (动作质量扎实，几项关键调整将显著提升效率)`;
  } else if (overallScore >= 50) {
    summary = `Decent effort${exerciseLabel}, but several areas need attention. Focus on the recommended improvements below. (动作尚可，但有好几个方面需要注意)`;
  } else {
    summary = `Significant form issues detected${exerciseLabel}. Focus on mastering the fundamentals with lighter load or bodyweight before progressing. (检测到明显问题，建议先用轻重量或自重打好基础)`;
  }

  // Detailed feedback
  const detailed = [
    `Overall Score: ${overallScore}/100`,
    `Stability: ${stability}/100 — ${describeMetric("stability", stability)}`,
    `Symmetry: ${symmetry}/100 — ${describeMetric("symmetry", symmetry)}`,
    `Range of Motion: ${range_of_motion}/100 — ${describeMetric("rom", range_of_motion)}`,
    `Tempo: ${tempo}/100 — ${describeMetric("tempo", tempo)}`,
    `Posture: ${posture}/100 — ${describeMetric("posture", posture)}`,
    ``,
    `Video: ${metadata.video_filename}`,
    `Frames analyzed: ${metadata.frames_processed}`,
    `Pose detection rate: ${Math.round(metadata.detection_rate * 100)}%`,
    ``,
    `This analysis was performed entirely in your browser using MediaPipe Pose.`,
    `No video was uploaded to any server — your data stays private.`,
    `(本次分析完全在您的浏览器中完成，视频未上传至任何服务器)`,
  ];

  return {
    summary,
    strengths,
    improvements,
    detailed_feedback: detailed.join("\n"),
  };
}

function describeMetric(metric: string, value: number): string {
  if (value >= 80) return "Excellent (优秀)";
  if (value >= 65) return "Good (良好)";
  if (value >= 50) return "Fair — needs work (一般，需要改进)";
  return "Needs significant improvement (需要大幅改进)";
}

// ──────────────────────────────────────────────
// Full Analysis Pipeline
// ──────────────────────────────────────────────

export interface AnalysisOptions {
  exerciseId?: string;
  exerciseName?: string;
}

export async function runFullAnalysis(
  videoFile: File,
  options: AnalysisOptions = {},
  onProgress?: (progress: ProcessingProgress) => void
): Promise<AnalysisResult> {
  // Phase 1: Initialize
  onProgress?.({ pct: 0, msg: "Initializing pose detection... (初始化姿态检测)" });
  await initializePoseDetector();

  // Phase 2: Process video frames
  onProgress?.({ pct: 5, msg: "Extracting video frames... (提取视频帧)" });
  const { frames, metadata, keypointsFrames } = await processVideo(
    videoFile,
    (p) => onProgress?.({ pct: 5 + Math.round(p.pct * 0.75), msg: p.msg })
  );

  // Phase 3: Calculate metrics
  onProgress?.({ pct: 82, msg: "Computing biomechanical metrics... (计算生物力学指标)" });
  const metrics = calculateMetrics(frames);

  // Phase 4: Overall score
  onProgress?.({ pct: 88, msg: "Calculating overall score... (计算综合评分)" });
  const overallScore = calculateOverallScore(metrics);

  // Phase 5: Generate feedback
  onProgress?.({ pct: 93, msg: "Generating feedback... (生成反馈建议)" });
  const feedback = generateFeedback(
    metrics,
    overallScore,
    metadata,
    options.exerciseName
  );

  // Phase 6: Build keypoints data (for download)
  onProgress?.({ pct: 98, msg: "Finalizing results... (整理结果)" });
  const keypointData = {
    metadata: {
      video_filename: metadata.video_filename,
      video_fps: metadata.video_fps,
      video_duration_ms: metadata.video_duration_ms,
      total_frames: metadata.total_frames,
      frames_processed: metadata.frames_processed,
      frames_with_pose: metadata.frames_with_pose,
      width: metadata.width,
      height: metadata.height,
    },
    frames: keypointsFrames,
  };

  // Build AnalysisResult
  const analysisId = generateAnalysisId();
  const videoBlobUrl = URL.createObjectURL(videoFile);
  const keypointsBlob = new Blob([JSON.stringify(keypointData, null, 2)], {
    type: "application/json",
  });
  const keypointsBlobUrl = URL.createObjectURL(keypointsBlob);

  const result: AnalysisResult = {
    analysis_id: analysisId,
    status: "completed",
    video_url: videoBlobUrl,
    overlay_url: "", // No overlay generated client-side
    keypoints_url: keypointsBlobUrl,
    metadata: {
      video_filename: metadata.video_filename,
      video_fps: metadata.video_fps,
      video_duration_ms: metadata.video_duration_ms,
      total_frames: metadata.total_frames,
      frames_processed: metadata.frames_processed,
      frames_with_pose: metadata.frames_with_pose,
      width: metadata.width,
      height: metadata.height,
    },
    feedback,
    sport_type: options.exerciseId || "general",
    overall_score: overallScore,
    capture_mode: "2d",
    is_3d: false,
    camera_count: 1,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    // Client-side extras
    metrics,
    detection_rate: metadata.detection_rate,
  } as AnalysisResult & { metrics: BiomechanicalMetrics; detection_rate: number };

  onProgress?.({ pct: 100, msg: "Analysis complete! (分析完成)" });

  return result;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Detect movement cycles from angle data using zero-crossing of derivative.
 * Returns array of cycle durations in milliseconds.
 */
function detectMovementCycles(
  angleValues: number[],
  timestamps: number[]
): number[] {
  if (angleValues.length < 10) return [];

  // Smooth with simple moving average (window=3)
  const smoothed: number[] = [];
  for (let i = 0; i < angleValues.length; i++) {
    const start = Math.max(0, i - 1);
    const end = Math.min(angleValues.length - 1, i + 1);
    const slice = angleValues.slice(start, end + 1);
    smoothed.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }

  // Find derivative
  const derivative: number[] = [];
  for (let i = 1; i < smoothed.length; i++) {
    derivative.push(smoothed[i] - smoothed[i - 1]);
  }

  // Find zero crossings (direction changes = rep boundaries)
  const crossings: number[] = [];
  for (let i = 1; i < derivative.length; i++) {
    if (
      (derivative[i - 1] > 0 && derivative[i] <= 0) ||
      (derivative[i - 1] < 0 && derivative[i] >= 0)
    ) {
      crossings.push(i);
    }
  }

  // Calculate durations between crossings
  const cycleDurations: number[] = [];
  for (let i = 1; i < crossings.length; i++) {
    const dt = timestamps[crossings[i]] - timestamps[crossings[i - 1]];
    if (dt > 300 && dt < 10000) {
      // Ignore cycles <300ms or >10s (noise)
      cycleDurations.push(dt);
    }
  }

  return cycleDurations;
}

function generateAnalysisId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ──────────────────────────────────────────────
// Skeleton Drawing (for overlay preview)
// ──────────────────────────────────────────────

/**
 * Draw pose skeleton on a canvas context.
 * Used for generating frame previews with skeleton overlay.
 */
export function drawPoseSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark3D[],
  width: number,
  height: number
): void {
  if (!landmarks || landmarks.length < 12) return;

  const connections = [
    // Torso
    [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
    [LM.LEFT_SHOULDER, LM.LEFT_HIP],
    [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
    [LM.LEFT_HIP, LM.RIGHT_HIP],
    // Arms
    [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
    [LM.LEFT_ELBOW, LM.LEFT_WRIST],
    [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
    [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
    // Legs
    [LM.LEFT_HIP, LM.LEFT_KNEE],
    [LM.LEFT_KNEE, LM.LEFT_ANKLE],
    [LM.RIGHT_HIP, LM.RIGHT_KNEE],
    [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
    // Feet
    [LM.LEFT_ANKLE, LM.LEFT_HEEL],
    [LM.LEFT_HEEL, LM.LEFT_FOOT_INDEX],
    [LM.LEFT_ANKLE, LM.LEFT_FOOT_INDEX],
    [LM.RIGHT_ANKLE, LM.RIGHT_HEEL],
    [LM.RIGHT_HEEL, LM.RIGHT_FOOT_INDEX],
    [LM.RIGHT_ANKLE, LM.RIGHT_FOOT_INDEX],
    // Head
    [LM.NOSE, LM.LEFT_EAR],
    [LM.NOSE, LM.RIGHT_EAR],
  ];

  // Draw connections
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  for (const [i, j] of connections) {
    const a = landmarks[i];
    const b = landmarks[j];
    if (!a || !b) continue;
    if (a.visibility < 0.5 || b.visibility < 0.5) continue;

    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }

  // Draw joints
  for (const lm of landmarks) {
    if (!lm || lm.visibility < 0.5) continue;
    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export { LANDMARK_NAMES };
