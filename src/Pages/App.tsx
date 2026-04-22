import { useEffect, useState } from "react";
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'

import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { AuthContext } from "../Context/AuthPreventContext";
import "../assets/css/App.css";

function App() {
  const { user, login, signup, logout } = AuthContext();

  const [email, setemail] = useState<string>("");
  const [password, setpassword] = useState<string>("");

  const [mode, setmode] = useState<"signin" | "signup">("signin");
  async function Signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await signup(email, password);
    // Handle signup logic here
  }
  async function Signin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await login(email, password);
    // Handle signup logic here
  }
  async function addData() {
    try {
      await addDoc(collection(db, "todos"), {
        title: "My Todo",
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  useEffect(() => {
    console.log("user", user);
  }, [user]);

  return (
    <>
    <section>

    {mode === "signup" ? (
      <section>
        <form onSubmit={Signup}>
          <div>
            <input
              type="text"
              placeholder="email"
              value={email}
              onChange={(e) => setemail(e.target.value)}
            />
          </div>
          <div>
            {" "}
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
            />
          </div>
          <button type="submit">Signup</button>
        </form>
      
      </section>) : (<section>
        <form onSubmit={Signin}>
          <div>
            <input
              type="text"
              placeholder="email"
              value={email}
              onChange={(e) => setemail(e.target.value)}
            />
          </div>
          <div>
            {" "}
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
            />
          </div>
          <button type="submit">Signin</button>
        </form>
       
      </section>)}
       <button
              type="button"
             
              onClick={() => setmode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin"
                ? "Don't have an account? Sign Up"
                : "Already have an account?Sign In"}
            </button>
    </section>
     <button onClick={logout}>logout</button>

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
