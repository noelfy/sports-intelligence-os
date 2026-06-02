// === Fitness Types ===

export interface MuscleData {
  id: string;
  name: string;
  scientificName: string;
  group: string;
  region: "upper" | "lower" | "core";
  function: string;
  description: string;
  dailyUse: string;
  primaryExercises: string[];
  synergists: string[];
  antagonists: string[];
  svgZone: string;
  stretchTips: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  nameZh: string;
  icon: string;
  description: string;
}

export interface ExerciseData {
  id: string;
  name: string;
  nameZh: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
  benefits: string[];
  category: string;
}

export interface GoalData {
  id: string;
  title: string;
  titleZh: string;
  subtitle: string;
  icon: string;
  targetGroups: string[];
  description: string;
  featuredExercises: string[];
  tip: string;
}

// === Legacy Types (kept for existing analysis features) ===

export interface Landmark {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface KeypointFrame {
  frame_index: number;
  timestamp_ms: number;
  landmarks: Landmark[];
  detected: boolean;
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
}

export interface KeypointData {
  metadata: VideoMetadata;
  frames: KeypointFrame[];
}

export interface FeedbackData {
  summary: string;
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
}

export interface AnalysisResult {
  analysis_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url: string;
  overlay_url: string;
  keypoints_url: string;
  metadata: Partial<VideoMetadata>;
  feedback: FeedbackData | null;
  sport_type?: string;
  overall_score?: number;
  capture_mode?: string;
  is_3d?: boolean;
  camera_count?: number;
  created_at: string | null;
  completed_at: string | null;
}

// 3D / Calibration types
export interface CameraInfo {
  index: number;
  name: string;
  max_width: number;
  max_height: number;
}

export interface CalibrationSession {
  session_id: string;
  name: string;
  camera_count: number;
  status: string;
  reprojection_error: number | null;
  frame_counts: number[];
  created_at: string;
}

export interface ThreeDLandmark {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
  reprojection_error: number;
}

export interface ThreeDKeypointFrame {
  frame_index: number;
  timestamp_ms: number;
  landmarks: ThreeDLandmark[];
  detected: boolean;
}

export interface ThreeDKeypointData {
  metadata: {
    video_fps: number;
    total_frames: number;
    camera_count: number;
    calibration_session_id: string;
    world_units: string;
    dimensions: number;
    frames_processed: number;
    frames_with_pose: number;
    detection_rate: number;
    triangulation_rate: number;
    landmark_count: number;
  };
  frames: ThreeDKeypointFrame[];
}

export type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export interface UploadState {
  file: File | null;
  files: File[];
  progress: number;
  status: UploadStatus;
  analysisId: string | null;
  error: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface HistoryItem {
  analysis_id: string;
  sport_type: string;
  status: string;
  video_filename: string;
  overall_score: number | null;
  metrics: Record<string, number> | null;
  created_at: string | null;
}
