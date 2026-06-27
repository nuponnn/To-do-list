import React from "react";
// import type {  Todolist } from "../components/services";
import "../assets/css/Alertconfirm.css";

interface Todolist {
  id: string;
  name: string;
  value: string;
  complete: boolean;
  createdAt: Date;
  datekey: string;
  color?: string;
}
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
    Item?.name !== undefined && Item?.name !== null && Item?.name !== "";
  const hasValueChanged =
    Item?.value !== undefined &&
    Item?.value !== null &&
    Item?.value !== "" &&
    Item?.value !== OldData?.value;
  const isEdited = hasNameChanged || hasValueChanged;
  const isConfirmDisabled =
    (DataOpenAlert.action === "Edit" && !isEdited) ||
    (DataOpenAlert.action === "Add" && (!Item?.name || !Item?.value));
    console.log(DataOpenAlert)
  return (
    <div className="alert-confirm">
      <div className="container-alert">
        <h1>Confirm</h1>
        <h2>{DataOpenAlert.action}</h2>
        {DataOpenAlert.action === "Add" ? (
          <>
            <p>name :{Item?.name}</p>
            <p>value :{Item?.value}</p>
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
