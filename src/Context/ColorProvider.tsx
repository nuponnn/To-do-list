/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthPreventContext";
import { services, type SavedColor } from "../components/services";
import { readSavedColors, writeSavedColors } from "../utils/colorStorage";
import { type TagColor } from "../constants/color";

interface ColorContextType {
  savedColors: SavedColor[];
  saveColor: (hex: TagColor) => Promise<void>;
  deleteColor: (id: string) => Promise<void>;
}
const ColorContext = createContext<ColorContextType | undefined>(undefined);

export default function ColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = AuthContext();
  const uid = user?.uid ?? "";

  // AuthPreventContext ไม่ render children ตอน loading เด็กไว้นี้คือ uid จริงของ user ที่ login อยู่
  // การอ่าน localStorage ตรงนี้ทำให้รอบสีที่บันทึกไว้แสดงทันทีในรอบ render แรก ไม่ต้องรอเครือข่าย
  const [palette, setPalette] = useState<{ uid: string; colors: SavedColor[] }>(
    () => ({ uid, colors: uid ? readSavedColors(uid) : [] }),
  );
  const [trackedUid, setTrackedUid] = useState(uid);

  if (trackedUid !== uid) {
    setTrackedUid(uid);
    setPalette({ uid, colors: uid ? readSavedColors(uid) : [] });
  }

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;

    async function fetchSavedColors() {
      try {
        const data = await services.getSavedColors(uid);
        if (cancelled) return;
        setPalette({ uid, colors: data });
      } catch (error) {
        console.error("Failed to load saved colors:", error);
      }
    }

    fetchSavedColors();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  // ทำหน้าที่เป็น cache ฝั่ง client: Firestore คือ source of truth เสมอ
  useEffect(() => {
    if (!palette.uid) return;
    writeSavedColors(palette.uid, palette.colors);
  }, [palette]);

  async function saveColor(hex: TagColor) {
    if (!uid) return;

    // กันบันทึกซ้ำ: ค่า hex ถูก normalize มาตั้งแต่ตอนอ่าน จึงเทียบตรงๆ ได้
    if (palette.colors.some((item) => item.hex === hex)) return;

    try {
      const savedId = await services.addSavedColor(uid, hex);
      setPalette((prev) => {
        if (prev.uid !== uid) return prev;
        if (prev.colors.some((item) => item.hex === hex)) return prev;
        return { uid, colors: [...prev.colors, { id: savedId, hex }] };
      });
    } catch (error) {
      console.error("Error saving color:", error);
    }
  }

  async function deleteColor(id: string) {
    if (!uid) return;

    const target = palette.colors.find((item) => item.id === id);
    if (!target) return;

    try {
      await services.deleteSavedColor(uid, id);
      setPalette((prev) =>
        prev.uid === uid
          ? { uid, colors: prev.colors.filter((item) => item.id !== id) }
          : prev,
      );
    } catch (error) {
      console.error("Error deleting saved color:", error);
    }
  }

  return (
    <ColorContext.Provider
      value={{
        savedColors: palette.uid === uid ? palette.colors : [],
        saveColor,
        deleteColor,
      }}
    >
      {children}
    </ColorContext.Provider>
  );
}

export const useColors = () => {
  const context = useContext(ColorContext);
  if (!context)
    throw new Error("useColors must be used within a ColorProvider");
  return context;
};