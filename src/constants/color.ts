// "ไม่มีสี" แทนด้วย absence ของ field color (undefined) ไม่ใช่ค่า hex
// ค่านี้คือ sentinel ที่ระบบเก่าใช้บันทึกไว้ใน Firestore จึงต้องแปลงเป็น undefined ตอนอ่าน
export const LEGACY_NO_COLOR = "#ffffff";

// ผู้ใช้เลือกสีได้ทุกค่า ข้อจำกัดเดียวคือต้องเป็น hex ที่ normalize แล้วถูกต้อง
export type TagColor = string;

// trim + lowercase + ขยาย #abc ให้เป็น #aabbcc เพื่อให้เทียบสีได้ตรงกันเสมอ
export const normalizeHex = (color?: string) => {
  const raw = color?.trim().toLowerCase() ?? "";
  const body = raw.startsWith("#") ? raw.slice(1) : "";
  if (/^[0-9a-f]{3}$/.test(body)) {
    const [r, g, b] = body.split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^[0-9a-f]{6}$/.test(body)) return `#${body}`;
  return "";
};

// คืน hex ที่ถูกต้องเสมอ ถ้าไม่ใช่สีที่ระบบรับได้ (รวมถึงข้อมูลเก่าสีขาว) ให้คืน undefined
export const toTagColor = (value: unknown): TagColor | undefined => {
  if (typeof value !== "string") return undefined;
  const hex = normalizeHex(value);
  if (!hex || hex === LEGACY_NO_COLOR) return undefined;
  return hex;
};

// สีตัวอักษรไม่เคยใช้ #ffffff เป็น sentinel มาก่อน จึงยอมรับสีขาวได้ตามปกติ
export const toTextColor = (value: unknown): TagColor | undefined => {
  if (typeof value !== "string") return undefined;
  return normalizeHex(value) || undefined;
};

export const PALETTE = [
  { name: "แดง", code: "#ff4d4d" },
  { name: "ส้ม", code: "#ff9f43" },
  { name: "เหลือง", code: "#ffdb4d" },
  { name: "เขียว", code: "#5cd65c" },
  { name: "ฟ้า", code: "#4da6ff" },
  { name: "ม่วง", code: "#a78bfa" },
  { name: "ชมพู", code: "#ff7ab8" },
  { name: "เทา", code: "#94a3b8" },
] as const;

export const hasRealColor = (color?: string) => toTagColor(color) !== undefined;

// ---------- text color บนพื้นหลังสี ----------

export const DEFAULT_TEXT_COLOR = "#0f172a";
export const INVERT_TEXT_COLOR = "#ffffff";

// สูตร relative luminance ของ WCAG ใช้ตัดสินว่าพื้นสีสว่างหรือเข้ม
const relativeLuminance = (hex: TagColor) => {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

const contrastRatio = (a: number, b: number) => {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
};

// ไม่มีสีถือว่าเป็นพื้นสว่าง (พื้นหลังการ์ด) จึงได้ตัวอักษรสีเข้ม
// ถ้ามีสี ให้เทียบค่า contrast ของทั้งสองตัวเลือกแล้วเลือกอันที่อ่านออกกว่า
// (ใช้ค่าความสว่างครึ่งเดียวจะพลาด เช่น #4da6ff ต้องใช้ตัวอักษรสีเข้ม ไม่ใช่สีขาว)
export const autoTextColor = (background?: TagColor) => {
  if (!background) return DEFAULT_TEXT_COLOR;

  const bg = relativeLuminance(background);
  const withDark = contrastRatio(bg, relativeLuminance(DEFAULT_TEXT_COLOR));
  const withLight = contrastRatio(bg, relativeLuminance(INVERT_TEXT_COLOR));

  return withDark >= withLight ? DEFAULT_TEXT_COLOR : INVERT_TEXT_COLOR;
};

// ผู้ใช้เลือกสีตัวอักษรเองได้ ถ้าไม่เลือกจะใช้ค่าที่คำนวณจากพื้นหลังให้อัตโนมัติ
export const resolveTextColor = (
  background?: TagColor,
  override?: TagColor,
) => override ?? autoTextColor(background);