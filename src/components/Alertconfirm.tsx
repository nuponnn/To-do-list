import React from "react";
// import type {  Todolist } from "../components/services";
import "../assets/css/Alertconfirm.css";
import { type Todolist } from "./services";
import { DEFAULT_TEXT_COLOR } from "../constants/color";

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
  pendingStampslength?: number | undefined;
  OldData?: Partial<Todolist>;

  Page: "Calendar" | "Todolist";
}
export default function Alertconfirm({
  DataOpenAlert,
  SetOpenAlert,
  Isconfirm,
  OldData,
  Page,
  pendingStampslength,
}: Props) {
  const { Item } = DataOpenAlert;

  const hasNameChanged =
    Item?.name !== undefined && Item?.name !== OldData?.name;

  const hasValueChanged =
    Item?.value !== undefined && Item?.value !== OldData?.value;

  // เทียบตรงๆ ไม่ต้องกัน undefined เพราะการกด "ไม่มีสี" คือค่า undefined ซึ่งต้องนับว่าเปลี่ยน
  const hasColorChanged = Item?.color !== OldData?.color;

  const hasTextColorChanged = Item?.textColor !== OldData?.textColor;

  const isEdited =
    hasNameChanged || hasValueChanged || hasColorChanged || hasTextColorChanged;
  const hasPendingStamps =
    pendingStampslength !== undefined && pendingStampslength > 0;
  const isConfirmDisabled =
    (DataOpenAlert.action === "Edit" && !isEdited) ||
    (DataOpenAlert.action === "Add" && !Item?.name && !hasPendingStamps);

  if (Page == "Calendar")
    return (
      <div className="alert-confirm">
        <div className="container-alert">
          <h1>Confirm</h1>
          <h2>{DataOpenAlert.action}</h2>
          {DataOpenAlert.action === "Add" ? (
            <>
               {isConfirmDisabled && <h5>Please enter a name</h5>}
              {Item?.name && <p>name :{Item?.name}</p>}
              {Item?.value && <p>value :{Item?.value}</p>}

              {Item?.color&&!isConfirmDisabled && (
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
              {pendingStampslength !== undefined && pendingStampslength > 0 && (
                <p>length: {pendingStampslength}</p>
              )}
            </>
          ) : DataOpenAlert.action === "Delete" ? (
            <>
              <p>name :{Item?.name}</p>
              <p>value :{Item?.value}</p>
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
  if (Page == "Todolist")
    return (
      <div className="alert-confirm">
        <div className="container-alert">
          <h1>Confirm</h1>
          <h2>{DataOpenAlert.action}</h2>
          {DataOpenAlert.action === "Add" ? (
            <>
            {isConfirmDisabled && <h5>Please enter a name</h5>}
              {Item?.name && <p>name :{Item?.name}</p>}
              {Item?.value && <p>value :{Item?.value}</p>}

              {Item?.color&&!isConfirmDisabled && (
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
                        backgroundColor: OldData?.color ?? "#ffffff",
                      }}
                    />
                    →
                    <span
                      className="color-circle"
                      style={{
                        backgroundColor: Item?.color ?? "#ffffff",
                      }}
                    />
                  </p>
                )}
                {hasTextColorChanged && (
                  <p>
                    Text color:
                    <span
                      className="color-circle"
                      style={{
                        backgroundColor:
                          OldData?.textColor ?? DEFAULT_TEXT_COLOR,
                      }}
                    />
                    →
                    <span
                      className="color-circle"
                      style={{
                        backgroundColor:
                          Item?.textColor ?? DEFAULT_TEXT_COLOR,
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
