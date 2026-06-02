/**
 * Lightweight API store — in-memory data for Vercel serverless demo.
 * Full persistence requires connecting to the Python backend or Vercel Postgres.
 */

interface User {
  id: string;
  email: string;
  username: string;
  password: string; // plain text for demo only!
}

export interface Analysis {
  id: string;
  user_id: string | null;
  sport_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  video_filename: string;
  overall_score: number | null;
  metrics: Record<string, number> | null;
  feedback: Record<string, unknown> | null;
  capture_mode: string | null;
  is_3d: boolean;
  camera_count: number;
  created_at: string;
  completed_at: string | null;
}

// Global store (resets on cold start — demo only)
declare global {
  var __apiStore: {
    users: User[];
    analyses: Analysis[];
  } | undefined;
}

const store = globalThis.__apiStore ?? {
  users: [],
  analyses: [],
};

if (!globalThis.__apiStore) {
  globalThis.__apiStore = store;
}

export function getStore() {
  return store;
}

export function createUser(email: string, username: string, password: string): User {
  const user: User = {
    id: crypto.randomUUID(),
    email,
    username,
    password,
  };
  store.users.push(user);
  return user;
}

export function findUserByEmail(email: string): User | undefined {
  return store.users.find((u) => u.email === email);
}

export function createAnalysis(
  userId: string | null,
  filename: string,
  sportType: string = "general",
  is3d: boolean = false,
  cameraCount: number = 1
): Analysis {
  const analysis: Analysis = {
    id: crypto.randomUUID(),
    user_id: userId,
    sport_type: sportType,
    status: "processing",
    video_filename: filename,
    overall_score: null,
    metrics: null,
    feedback: null,
    capture_mode: is3d ? "3d" : "2d",
    is_3d: is3d,
    camera_count: cameraCount,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
  store.analyses.push(analysis);
  return analysis;
}

export function updateAnalysis(
  id: string,
  updates: Partial<Analysis>
): Analysis | undefined {
  const analysis = store.analyses.find((a) => a.id === id);
  if (!analysis) return undefined;
  Object.assign(analysis, updates);
  return analysis;
}

export function getAnalyses(userId?: string | null): Analysis[] {
  if (userId) return store.analyses.filter((a) => a.user_id === userId);
  return store.analyses;
}

export function getAnalysis(id: string): Analysis | undefined {
  return store.analyses.find((a) => a.id === id);
}
