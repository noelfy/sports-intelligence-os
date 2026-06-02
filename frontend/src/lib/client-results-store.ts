/**
 * Client-side results store — persists analysis results in sessionStorage
 * so the results page can retrieve them without a server API call.
 */

import type { AnalysisResult } from "@/types";

const STORAGE_KEY = "sports_ai_client_results";

interface StoredResult {
  analysisId: string;
  result: AnalysisResult;
  storedAt: number;
}

function getStore(): Record<string, StoredResult> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStore(store: Record<string, StoredResult>): void {
  if (typeof window === "undefined") return;
  try {
    // Only keep the 10 most recent results to avoid filling storage
    const entries = Object.values(store).sort((a, b) => b.storedAt - a.storedAt);
    const trimmed: Record<string, StoredResult> = {};
    for (const entry of entries.slice(0, 10)) {
      trimmed[entry.analysisId] = entry;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable — clear old entries and retry once
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    } catch {
      // Give up silently
    }
  }
}

export function storeClientResult(
  analysisId: string,
  result: AnalysisResult
): void {
  const store = getStore();
  store[analysisId] = {
    analysisId,
    result,
    storedAt: Date.now(),
  };
  setStore(store);
}

export function getClientResult(
  analysisId: string
): AnalysisResult | null {
  const store = getStore();
  const entry = store[analysisId];
  if (!entry) return null;
  return entry.result;
}

export function removeClientResult(analysisId: string): void {
  const store = getStore();
  delete store[analysisId];
  setStore(store);
}

export function getRecentClientResults(): AnalysisResult[] {
  const store = getStore();
  return Object.values(store)
    .sort((a, b) => b.storedAt - a.storedAt)
    .map((entry) => entry.result);
}

export function clearAllClientResults(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
