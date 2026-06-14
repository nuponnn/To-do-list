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
  DataOpenAlert: { isOpen: boolean; Item?: Partial<Todolist> };
  SetOpenAlert: React.Dispatch<
    React.SetStateAction<{ isOpen: boolean; Item?: Partial<Todolist> }>
  >;
  Isconfirm: () => void;
  StatusMode: "Add" | "Edit" | "Delete"|null;
  OldData?:Partial<Todolist>;
}
export default function Alertconfirm({
  DataOpenAlert,
  SetOpenAlert,
  Isconfirm,
  StatusMode,
  OldData,
  
}: Props) {
  const { Item } = DataOpenAlert;

  const hasNameChanged =
    Item?.name !== undefined && Item?.name !== null && Item?.name !== "";
  const hasValueChanged =
    Item?.value !== undefined &&
    Item?.value !== null &&
    Item?.value !== "" &&
    Number(Item?.value) !== Number(OldData?.value);
  const isEdited = hasNameChanged || hasValueChanged;
  const isConfirmDisabled = StatusMode === "Edit" && !isEdited;
  return (
    <div className="alert-confirm">
      <div className="container-alert">
        <h1>Confirm</h1>
        <h2>{StatusMode}</h2>
        {StatusMode === "Add" ? (
          <>
            <p>name :{Item?.name}</p>
            <p>value :{Item?.value}</p>
          </>
        ) : StatusMode === "Edit" ? (
          isEdited ? (
            <>
              <p>name :{Item?.name}</p>
              <p>value :{Item?.value}</p>
              <h4>To</h4>
              {hasNameChanged && <p>New Name: {Item?.name}</p>}
              {hasValueChanged && <p>New Value: {Item?.value}</p>}
            </>
          ) : (
            <h5>Not Changes</h5>
          )
        ) : StatusMode === "Delete" ? (
          <>
            <p>name :{OldData?.name}</p>
            <p>value :{OldData?.value}</p>
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

              console.log("Cancel");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
