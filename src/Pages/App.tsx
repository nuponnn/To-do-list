import { useEffect, useReducer } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'

import { db } from "../firebase";
import { collection, doc, writeBatch } from "firebase/firestore";
import { AuthContext } from "../Context/AuthPreventContext";
import "../assets/css/App.css";

interface MyData {
  uid?: string;
  name?: string;
  updatedAt?: Date;
}

type AuthMode = "signin" | "signup";
interface AuthState {
  Mode: AuthMode;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  isLoading: boolean;
}
type AuthAction =
  | { type: "SWITCH_MODE" }
  | { type: "SET_FIELD"; field: keyof AuthState; value: string }
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS" }
  | { type: "AUTH_ERROR"; error: string };

const translateError = (errorCode: string): string => {
  const errors: Record<string, string> = {
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/user-not-found": "ไม่พบผู้ใช้งานนี้ในระบบ",
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
    "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
    "auth/email-already-in-use": "อีเมลนี้ถูกใช้งานไปแล้ว",
    "auth/weak-password": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
    "auth/too-many-requests": "ถูกระงับชั่วคราวเนื่องจากพยายามผิดหลายครั้ง",
  };
  return errors[errorCode] || "เกิดข้อผิดพลาดบางอย่าง กรุณาลองใหม่อีกครั้ง";
};
const initialState = {
  Mode: "signin" as AuthMode,
  email: "",
  password: "",
  confirmPassword: "",
  error: null,
  isLoading: false,
};
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SWITCH_MODE":
      return {
        ...initialState,
        Mode: state.Mode === "signin" ? "signup" : "signin",
      };
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...initialState,
        Mode: state.Mode,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        isLoading: false,
        error: translateError(action.error),
      };
    default:
      return state;
  }
}


function App() {
  const { user, login, signup, logout } = AuthContext();

  const [authState, dispatch] = useReducer(authReducer, initialState);

  // const [email, setemail] = useState<string>("");
  // const [password, setpassword] = useState<string>("");

  // const [mode, setmode] = useState<"signin" | "signup">("signin");

  //  async function Setdata(){
  //   await setDoc(collection(db, "users"), user.uid, {
  // }

  //   async function SetData(conlectionName:string,userId:string|undefined, data:object) {
  //   try {
  //     bacth.set(doc(collection(db, conlectionName),userId), {
  //       data
  //     });
  //   } catch (error:unknown  ) {
  //     console.error("Failed to set data:", error);
  //     dispatch({
  //       type: "AUTH_ERROR",
  //       error: (error as { code?: string }).code || "Failed to set data. Please try again.",
  //     });
  //   }
  // }

  console.log("authState", authState);
  async function submitHandler(e: React.FormEvent<HTMLFormElement>) {
    try{
    e.preventDefault();
    dispatch({ type: "AUTH_START" });

    const batch = writeBatch(db);
    if (authState.Mode === "signup") {
      if (authState.password !== authState.confirmPassword) {
        throw { code: "passwords-not-match" }; // ส่ง Error ไปที่ catch
      }

      const userCredential = await signup(authState.email, authState.password);
      const uid = userCredential.user.uid;

      // 3. เตรียมข้อมูล (ไม่ต้อง await เพราะ batch.set ทำงานทันทีในเครื่อง)
      const userRef = doc(db, "AuthUser", uid);
      const logRef = doc(db, "UserData", uid); // สมมติว่าต้องการเก็บ 2 ที่

      batch.set(userRef, { email: authState.email, updatedAt: new Date(),role:"User",uid:uid });
      batch.set(logRef, { email: authState.email, uid:uid, updatedAt: new Date() }); // ข้อมูลตัวอย่างสำหรับ log

      // 4. ส่งข้อมูลทั้งหมดขึ้น Server พร้อมกัน
      await batch.commit();

      dispatch({ type: "AUTH_SUCCESS" });
    } else {
      
      await login(authState.email, authState.password);
      dispatch({ type: "AUTH_SUCCESS" });
    }
  } catch (error: unknown) {
      console.error("Signup error:", error);
      dispatch({
        type: "AUTH_ERROR",
        error: (error as { code?: string }).code || "",
      });
    }
  }
  

  useEffect(() => {
    console.log("user", user);
    
  }, [user]);

  return (
    <>
      <section>
        <form onSubmit={submitHandler}>
          <div>
            <input
              type="text"
              placeholder="email"
              value={authState.email}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "email",
                  value: e.target.value,
                })
              }
            />
          </div>
          <div>
            {" "}
            <input
              type="password"
              placeholder="password"
              value={authState.password}
              onChange={(e) =>
                dispatch({
                  type: "SET_FIELD",
                  field: "password",
                  value: e.target.value,
                })
              }
            />
          </div>
          <div>
            {authState.Mode === "signup" && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={authState.confirmPassword}
                onChange={(e) =>
                  dispatch({
                    type: "SET_FIELD",
                    field: "confirmPassword",
                    value: e.target.value,
                  })
                }
              />
            )}
          </div>
          <div>{authState.error}</div>
          <button type="submit">
            {authState.Mode !== "signin" ? " Sign Up" : "Sign In"}
          </button>
          <div>
            {authState.isLoading ? "Loading..." :(
            <button
              type="button"
              onClick={() => dispatch({ type: "SWITCH_MODE" })}
            >
              {authState.Mode === "signin"
                ? "Don't have an account? Sign Up"
                : "Already have an account?Sign In"}
            </button>)}
          </div>
        </form>
        <button onClick={logout}>logout</button>
      </section>

      {/* ********************************************** */}
      {/* <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section> */}
    </>
  );
}

export default App;
