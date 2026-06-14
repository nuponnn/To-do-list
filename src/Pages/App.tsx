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
    "auth/invalid-credential": "Invalid email or password.",
    "auth/user-not-found": "User not found in the system.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-email": "Invalid email format.",
    "auth/email-already-in-use": "This email is already in use.",
    "auth/weak-password": "Password must be at least 6 characters long.",
    "auth/too-many-requests": "Account temporarily suspended due to multiple failed attempts.",
    "auth/user-logining": "Please sign out before signing in with a new account.",
  };
  return errors[errorCode] || "Something went wrong. Please try again.";
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
  const { user, login, signup } = AuthContext();

  const [authState, dispatch] = useReducer(authReducer, initialState);



  async function submitHandler(e: React.FormEvent<HTMLFormElement>) {
    try{
    e.preventDefault();
    if (authState.isLoading) return; // ป้องกันการส่งซ้ำขณะกำลังโหลด

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
      if(user){
        throw { code: "auth/user-logining" }; // ส่ง Error ไปที่ catch
      }
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
  

  

  return (
    <>
      <section className="auth-container">
        <h1>{authState.Mode === "signin" ? "Sign In" : "Sign Up"}</h1>
        <form onSubmit={submitHandler} className="auth-form">
          <div className="input-group">
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
            <label htmlFor="email">Email</label>
          </div>
          <div className="input-group">
            
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
            <label htmlFor="password">Password</label>
          </div>
          <div className="input-group">
            {authState.Mode === "signup" && (<>
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
                <label htmlFor="confirmPassword">Confirm Password</label>
                </>
            )}
          </div>
          {authState.error && <div className="error-box">{authState.error}</div>}
          <button type="submit" disabled={authState.isLoading} className="submit-button button-auth">
            {authState.Mode !== "signin" ? " Sign Up" : "Sign In"}
          </button>
          <div>
            {authState.isLoading ? "Loading..." :(
            <button
              type="button"
              onClick={() => dispatch({ type: "SWITCH_MODE" })}
              className="switch-mode-button button-auth"
            >
              {authState.Mode === "signin"
                ? "Don't have an account? Sign Up"
                : "Already have an account?Sign In"}
            </button>)}
          </div>
        </form>
        
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
