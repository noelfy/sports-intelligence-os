// === Landmark & Keypoint Types ===

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

// === Analysis & Feedback Types ===

export interface MetricBreakdown {
  score: number;
  weight: number;
  contribution: number;
}

export interface FeedbackData {
  overall_score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  metrics?: Record<string, number>;
  error?: string;
}

export interface AnalysisResult {
  analysis_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_url: string;
  overlay_url: string;
  keypoints_url: string;
  metadata: Partial<VideoMetadata>;
  feedback: FeedbackData | null;
  created_at: string | null;
  completed_at: string | null;
}

// === Upload Types ===

export type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export interface UploadState {
  file: File | null;
  progress: number;
  status: UploadStatus;
  analysisId: string | null;
  error: string | null;
}

// === Auth Types ===

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

// === History Types ===

export interface HistoryItem {
  analysis_id: string;
  sport_type: string;
  status: string;
  video_filename: string;
  overall_score: number | null;
  metrics: Record<string, number> | null;
  created_at: string | null;
}
