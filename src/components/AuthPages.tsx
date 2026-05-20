// src/components/AuthPages.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "../lib/firebase";
import { Eye, EyeOff, AlertCircle, Hand } from "lucide-react";

function friendlyError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-email":          "Invalid email address.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/invalid-credential":     "Incorrect email or password.",
    "auth/email-already-in-use":   "This email is already registered.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Please wait.",
    "auth/popup-closed-by-user":   "Sign-in popup was closed.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

const BG = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "radial-gradient(ellipse at 30% 40%, #0a1628 0%, #020917 70%)",
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  padding: "24px",
};

const CARD: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "linear-gradient(135deg, #080f1e, #0a1628)",
  border: "1px solid rgba(0,180,216,0.12)",
  borderRadius: "20px",
  padding: "40px 36px",
  color: "#e2e8f0",
};

const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#060d1a",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#e2e8f0",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const SOCIAL_BTN: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: "10px",
  background: "#060d1a",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#cbd5e1",
  fontSize: "13px",
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  fontWeight: 600,
};

const PRIMARY_BTN: React.CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "12px",
  letterSpacing: "0.15em",
  cursor: "pointer",
  background: "linear-gradient(135deg, #0077b6, #00b4d8)",
  color: "white",
  border: "none",
  boxShadow: "0 0 24px rgba(0,180,216,0.2)",
};

// ── Login ─────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const [email,    setEmail]   = useState("");
  const [password, setPass]    = useState("");
  const [showPass, setShow]    = useState(false);
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);
  const navigate = useNavigate();

  const after = () => navigate("/scanner");

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      after();
    } catch (err: any) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await signInWithPopup(auth, googleProvider); after(); }
    catch (err: any) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  const handleGithub = async () => {
    setError(""); setLoading(true);
    try { await signInWithPopup(auth, githubProvider); after(); }
    catch (err: any) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <div style={BG}>
      <motion.div style={CARD}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#00b4d8,#0077b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hand size={22} color="white" />
          </div>
          <span style={{ fontSize: 10, letterSpacing: "0.3em", color: "#475569" }}>SIGN2SIGN AI</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Welcome back</h1>
        </div>

        {/* Social buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <button style={SOCIAL_BTN} onClick={handleGoogle} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button style={SOCIAL_BTN} onClick={handleGithub} disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: 11, color: "#334155" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} required style={INPUT} />
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} placeholder="Password"
              value={password} onChange={e => setPass(e.target.value)}
              required style={{ ...INPUT, paddingRight: 44 }} />
            <button type="button" onClick={() => setShow(!showPass)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0, display: "flex" }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 12 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ ...PRIMARY_BTN, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer", marginTop: 4 }}>
            {loading ? "SIGNING IN…" : "SIGN IN"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#334155" }}>
          No account?{" "}
          <Link to="/signup" style={{ color: "#00b4d8", textDecoration: "none" }}>Create one free</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ── Signup ─────────────────────────────────────────────────────────────────────
export function SignupPage() {
  const [email,    setEmail]   = useState("");
  const [password, setPass]    = useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/scanner");
    } catch (err: any) { setError(friendlyError(err.code)); }
    finally { setLoading(false); }
  };

  return (
    <div style={BG}>
      <motion.div style={CARD}
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#00b4d8,#0077b6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hand size={22} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>Create account</h1>
          <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Start recognizing ASL for free</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)} required style={INPUT} />
          <input type="password" placeholder="Password (min 6 characters)" value={password}
            onChange={e => setPass(e.target.value)} required style={INPUT} />

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 12 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ ...PRIMARY_BTN, opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer", marginTop: 4 }}>
            {loading ? "CREATING…" : "CREATE ACCOUNT"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#334155" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#00b4d8", textDecoration: "none" }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

// ── Protected Route ────────────────────────────────────────────────────────────
export function ProtectedRoute({ children, user, loading }: { children: React.ReactNode; user: any; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#020917", gap: 16 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid rgba(0,180,216,0.2)", borderTopColor: "#00b4d8" }}
        />
        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#334155", fontFamily: "monospace" }}>
          VERIFYING SESSION…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
