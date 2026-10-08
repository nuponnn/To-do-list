import { useState } from "react";
import "../assets/css/ColorPicker.css";
import {
  PALETTE,
  autoTextColor,
  toTagColor,
  toTextColor,
  type TagColor,
} from "../constants/color";
import { useColors } from "../Context/ColorProvider";

export interface ColorPickerProps {
  value?: TagColor;
  onChange: (hex?: TagColor) => void;
  textValue?: TagColor;
  onTextChange?: (hex?: TagColor) => void;
  label?: string;
  showSaved?: boolean;
}

// <input type="color"> บังคับให้มีค่าเสมอ และรับได้แค่ 6 หลัก
// ถ้ายังไม่เคยเลือกสี ใช้สีเทาอ่อนเป็นค่าเริ่มต้นเพื่อไม่ให้กรอบสีขาวกลืนกับพื้นหลัง
const FALLBACK_SWATCH = "#ffffff";

export default function ColorPicker({
  value,
  onChange,
  textValue,
  onTextChange,
  label = "Tag color",
  showSaved = true,
}: ColorPickerProps) {
  const { savedColors, saveColor, deleteColor } = useColors();
  const [isSaving, setIsSaving] = useState(false);

  // เก็บสีที่เลือกผ่าน native picker ไว้ เพื่อให้กรอบยังแสดงสีเดิมตอนกด "ไม่มีสี"
  const [swatch, setSwatch] = useState(FALLBACK_SWATCH);
  const currentSwatch = value ?? swatch;

  // ยังไม่ได้เลือกเอง → สีที่ native picker แสดงต้องเป็นค่าอัตโนมัติของพื้นหลังเสมอ
  const textSwatch = textValue ?? autoTextColor(value);

  const isSaved = savedColors.some((item) => item.hex === value);
  const canSave = Boolean(value) && !isSaved;

  async function handleSave() {
    if (!value || isSaved) return;

    setIsSaving(true);
    try {
      await saveColor(value);
    } finally {
      setIsSaving(false);
    }
  }

  function handleNativeChange(next: string) {
    setSwatch(next);
    onChange(toTagColor(next));
  }

  function handleTextNativeChange(next: string) {
    onTextChange?.(toTextColor(next));
  }

  function handleClear() {
    setSwatch(FALLBACK_SWATCH);
    onChange(undefined);
  }

  // ปุ่ม "อัตโนมัติ" ล้าง override ออก ให้ระบบเดาจากพื้นหลังอีกครั้ง
  function handleTextAuto() {
    onTextChange?.(undefined);
  }

  return (
    <div className="cp-area">
      <span className="cp-label">{label}</span>

      <div className="cp-row">
        {PALETTE.map((color) => (
          <button
            key={color.code}
            type="button"
            aria-label={color.name}
            title={color.name}
            aria-pressed={value === color.code}
            onClick={() => onChange(color.code)}
            className={`cp-dot ${value === color.code ? "cp-dot-active" : ""}`}
            style={{ backgroundColor: color.code }}
          />
        ))}

        <label className="cp-native" title="Pick any color">
          <input
            type="color"
            value={currentSwatch}
            onChange={(event) => handleNativeChange(event.target.value)}
            aria-label="Pick any color"
          />
        </label>

        <button
          type="button"
          className={`cp-dot cp-dot-none ${!value ? "cp-dot-active" : ""}`}
          onClick={handleClear}
          aria-pressed={!value}
          title="No color"
          aria-label="No color"
        />

        <button
          type="button"
          className="cp-save-btn"
          onClick={handleSave}
          disabled={!canSave || isSaving}
          title="Save this color for later"
        >
          {isSaved ? "Saved ✓" : "Save color"}
        </button>
      </div>

      {onTextChange && (
        <div className="cp-text-row">
          <span className="cp-label cp-text-label">Text color</span>
          <div className="cp-row">
            <button
              type="button"
              className={`cp-auto-btn ${!textValue ? "active" : ""}`}
              onClick={handleTextAuto}
              aria-pressed={!textValue}
              title="Automatically pick the most readable text color"
            >
              Auto
            </button>

            <label className="cp-native" title="Pick a text color">
              <input
                type="color"
                value={textSwatch}
                onChange={(event) => handleTextNativeChange(event.target.value)}
                aria-label="Pick a text color"
              />
            </label>

            {textValue && (
              <button
                type="button"
                className="cp-auto-btn"
                onClick={handleTextAuto}
                title="Go back to automatic text color"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {showSaved && savedColors.length > 0 && (
        <div className="cp-saved">
          {savedColors.map((item) => {
            const isActive = item.hex === value;
            return (
              <div
                key={item.id}
                className={`cp-saved-item ${isActive ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="cp-saved-dot"
                  style={{ backgroundColor: item.hex }}
                  onClick={() => onChange(item.hex)}
                  title={item.hex}
                  aria-label={`Use color ${item.hex}`}
                />
                <button
                  type="button"
                  className="cp-saved-del"
                  onClick={() => deleteColor(item.id)}
                  title="Delete this color"
                  aria-label={`Delete color ${item.hex}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}