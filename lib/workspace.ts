import AsyncStorage from "@react-native-async-storage/async-storage";

export type AnnotationKind = "note" | "rectangle" | "circle";

export interface WorkspaceAnnotation {
  id: string;
  kind: AnnotationKind;
  x: number;
  y: number;
  text?: string;
}

export interface WorkspaceSnapshot {
  imageUri: string | null;
  baseAngle: number;
  measureAngle: number;
  opacity: number;
  scale: number;
  center: { x: number; y: number };
  annotations: WorkspaceAnnotation[];
}

export interface SavedWorkspace extends WorkspaceSnapshot {
  id: string;
  title: string;
  savedAt: string;
}

const HISTORY_KEY = "juq-360-workspace-history-v1";

export async function readWorkspaceHistory(): Promise<SavedWorkspace[]> {
  const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
  if (!rawHistory) return [];

  try {
    const parsed = JSON.parse(rawHistory) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedWorkspace[]) : [];
  } catch {
    return [];
  }
}

export async function writeWorkspaceHistory(history: SavedWorkspace[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

export function createWorkspaceTitle(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} 측정 ${hours}:${minutes}`;
}
