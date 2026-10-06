import { parseSavedColor, type SavedColor } from "../components/services";

const storageKey = (uid: string) => `todolist:savedColors:${uid}`;

export const readSavedColors = (uid: string): SavedColor[] => {
  if (!uid) return [];

  try {
    const raw = window.localStorage.getItem(storageKey(uid));
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(parseSavedColor)
      .filter((color): color is SavedColor => color !== null);
  } catch (error) {
    console.error("Failed to read saved colors from localStorage:", error);
    return [];
  }
};

export const writeSavedColors = (uid: string, colors: SavedColor[]) => {
  if (!uid) return;

  try {
    window.localStorage.setItem(storageKey(uid), JSON.stringify(colors));
  } catch (error) {
    console.error("Failed to mirror saved colors to localStorage:", error);
  }
};