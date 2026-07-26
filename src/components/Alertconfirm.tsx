import React from "react";
// import type {  Todolist } from "../components/services";
import "../assets/css/Alertconfirm.css";
import { type Todolist } from "./services";

interface Props {
  DataOpenAlert: {
    isOpen: boolean;
    Item?: Partial<Todolist>;
    action?: "Add" | "Edit" | "Delete";
  };
  SetOpenAlert: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      Item?: Partial<Todolist>;
      action?: "Add" | "Edit" | "Delete";
    }>
  >;
  Isconfirm: () => void;

  OldData?: Partial<Todolist>;
}
export default function Alertconfirm({
  DataOpenAlert,
  SetOpenAlert,
  Isconfirm,
  OldData,
}: Props) {
  const { Item } = DataOpenAlert;

  const hasNameChanged =
    Item?.name !== undefined && Item?.name !== OldData?.name;

  const hasValueChanged = Item?.value !== undefined && Item?.value !== OldData?.value;

  const hasColorChanged =
    Item?.color !== undefined && Item?.color !== OldData?.color;
  const isEdited = hasNameChanged || hasValueChanged || hasColorChanged;
  const isConfirmDisabled =
    (DataOpenAlert.action === "Edit" && !isEdited) ||
    (DataOpenAlert.action === "Add" && !Item?.name);

  return (
    <div className="alert-confirm">
      <div className="container-alert">
        <h1>Confirm</h1>
        <h2>{DataOpenAlert.action}</h2>
        {DataOpenAlert.action === "Add" ? (
          <>
            <p>name :{Item?.name}</p>
            {Item?.value && <p>value :{Item?.value}</p>}

            {Item?.color && (
              <p>
                Color:
                <span
                  className="color-circle"
                  style={{
                    backgroundColor: Item.color,
                  }}
                />
              </p>
            )}
          </>
        ) : DataOpenAlert.action === "Edit" ? (
          isEdited ? (
            <>
              {/* แสดงค่าเดิมจาก OldData → ค่าใหม่จาก Item */}
              {hasNameChanged && (
                <p>
                  Name: {OldData?.name} → {Item?.name}
                </p>
              )}
              {hasValueChanged && (
                <p>
                  Value: {OldData?.value} → {Item?.value}
                </p>
              )}
              {hasColorChanged && (
                <p>
                  Color:
                  <span
                    className="color-circle"
                    style={{
                      backgroundColor: OldData?.color,
                    }}
                  />
                  →
                  <span
                  className="color-circle"
                    style={{
                      backgroundColor: Item?.color,
                    }}
                  />
                </p>
              )}
            </>
          ) : (
            <h5>Not Changes</h5>
          )
        ) : DataOpenAlert.action === "Delete" ? (
          <>
            <p>name :{Item?.name}</p>
            <p>value :{Item?.value}</p>
          </>
        ) : null}

        <div className="button-container-alert">
          <button
            className="button-confirm"
            onClick={() => {
              SetOpenAlert({ isOpen: false });
              Isconfirm();
            }}
            disabled={isConfirmDisabled}
          >
            Confirm
          </button>
          <button
            className="button"
            onClick={() => {
              SetOpenAlert({ isOpen: false });
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
