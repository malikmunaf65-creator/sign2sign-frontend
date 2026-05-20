// src/components/ASLScanner.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { Hand, Zap, ZapOff, Activity, RotateCcw, Clock, Wifi, LogOut } from "lucide-react";

const RAILWAY_URL       = import.meta.env.VITE_RAILWAY_API_URL as string;
const FRAME_INTERVAL_MS = 700;
const HISTORY_THRESHOLD = 0.78;
const MAX_HISTORY       = 14;

function confColor(c: number) {
  if (c >= 0.85) return "#00ffaa";
  if (c >= 0.65) return "#facc15";
  return "#f87171";
}

interface Prediction {
  topSign: string;
  confidence: number;
  topFive: { sign: string; confidence: number }[];
  handDetected: boolean;
  latencyMs: number;
}

export default function ASLScanner() {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval>>();

  const [phase,      setPhase]      = useState<"idle"|"initializing"|"active"|"stopped"|"error">("idle");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history,    setHistory]    = useState<string[]>([]);
  const [fps,        setFps]        = useState(0);
  const [ping,       setPing]       = useState<number | null>(null);
  const [error,      setError]      = useState("");
  const fpsRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => { setFps(fpsRef.current); fpsRef.current = 0; }, 1000);
    return () => clearInterval(t);
  }, []);

  const loadMediaPipe = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });
  }, []);

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }, audio: false,
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    const user = auth.currentUser;
    // Dev mode: no token needed
    if (!user) return "dev";
    return user.getIdToken(false);
  }, []);

  const processFrame = useCallback(async () => {
    const video     = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    const result = landmarker.detectForVideo(video, performance.now());

    if (!result.landmarks || result.landmarks.length === 0) {
      setPrediction(prev => prev ? { ...prev, handDetected: false } : null);
      return;
    }

    const landmarks = result.landmarks[0].flatMap(lm => [lm.x, lm.y, lm.z]);

    try {
      const token = await getToken();
      const t0    = performance.now();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token !== "dev") headers["Authorization"] = `Bearer ${token}`;

      const res  = await fetch(`${RAILWAY_URL}/predict`, {
        method: "POST", headers,
        body: JSON.stringify({ landmarks }),
      });

      setPing(Math.round(performance.now() - t0));
      fpsRef.current += 1;

      const data = await res.json();
      if (!data.success) return;

      setPrediction({
        topSign:     data.top_sign,
        confidence:  data.confidence,
        topFive:     data.top_five || [],
        handDetected: true,
        latencyMs:   data.latency_ms,
      });

      if (data.confidence >= HISTORY_THRESHOLD) {
        setHistory(prev => {
          if (prev[prev.length - 1] === data.top_sign) return prev;
          return [...prev.slice(-(MAX_HISTORY - 1)), data.top_sign];
        });
      }
    } catch (err) {
      console.warn("Frame error:", err);
    }
  }, [getToken]);

  const initScanner = useCallback(async () => {
    setPhase("initializing");
    setError("");
    try {
      await loadMediaPipe();
      await startCamera();
      setPhase("active");
      intervalRef.current = setInterval(processFrame, FRAME_INTERVAL_MS);
    } catch (err: any) {
      setError(err.message || "Failed to start scanner");
      setPhase("error");
    }
  }, [loadMediaPipe, startCamera, processFrame]);

  const stopScanner = useCallback(() => {
    clearInterval(intervalRef.current);
    videoRef.current?.srcObject && (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarkerRef.current = null;
    setPhase("stopped");
    setPrediction(null);
  }, []);

  useEffect(() => () => stopScanner(), [stopScanner]);

  const isActive = phase === "active";
  const user = auth.currentUser;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "radial-gradient(ellipse at 20% 50%, #0a1628 0%, #020917 60%)",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#e2e8f0",
    }}>
      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,180,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,0.025) 1px,transparent 1px)",
        backgroundSize: "48px 48px" }} />

      {/* Header */}
      <header style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "14px 28px",
        borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(2,9,23,0.8)",
        backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center",
            justifyContent: "center", background: "linear-gradient(135deg,#00b4d8,#0077b6)" }}>
            <Hand size={16} color="white" />
          </div>
          <span style={{ fontSize: 11, letterSpacing: "0.25em", color: "#94a3b8", fontWeight: 700 }}>SIGN2SIGN AI</span>
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.2em",
            border: `1px solid ${isActive ? "rgba(0,255,170,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: isActive ? "#00ffaa" : "#475569" }}>
            {phase.toUpperCase()}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 11, color: "#475569" }}>
          {ping !== null && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Wifi size={12} />{ping}ms</span>}
          {isActive && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Activity size={12} color="#4ade80" />{fps} fps</span>}
          {user && <span style={{ color: "#334155" }}>{user.email?.split("@")[0] ?? "user"}</span>}
          {user && (
            <button onClick={() => signOut(auth)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <LogOut size={13} /> Sign out
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex",
        flexDirection: "row", overflow: "hidden" }}>

        {/* Camera panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", flex: 1, margin: 20, borderRadius: 20, overflow: "hidden",
            border: `1px solid ${isActive ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.05)"}`,
            background: "#020917", minHeight: 320 }}>

            <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} muted playsInline />

            {/* Scan line */}
            {isActive && (
              <motion.div style={{ position: "absolute", left: 0, right: 0, height: 2, pointerEvents: "none",
                background: "linear-gradient(90deg,transparent,rgba(0,180,216,0.3),#00b4d8,rgba(0,180,216,0.3),transparent)" }}
                animate={{ top: ["4%", "96%", "4%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
            )}

            {/* Corners */}
            {isActive && [
              { top: 14, left: 14, borderTop: "2px solid #00b4d8", borderLeft: "2px solid #00b4d8", borderRadius: "8px 0 0 0" },
              { top: 14, right: 14, borderTop: "2px solid #00b4d8", borderRight: "2px solid #00b4d8", borderRadius: "0 8px 0 0" },
              { bottom: 14, left: 14, borderBottom: "2px solid #00b4d8", borderLeft: "2px solid #00b4d8", borderRadius: "0 0 0 8px" },
              { bottom: 14, right: 14, borderBottom: "2px solid #00b4d8", borderRight: "2px solid #00b4d8", borderRadius: "0 0 8px 0" },
            ].map((s, i) => <div key={i} style={{ position: "absolute", width: 28, height: 28, ...s }} />)}

            {/* State overlay */}
            <AnimatePresence>
              {!isActive && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 16,
                    background: "rgba(2,9,23,0.93)" }}>
                  {phase === "initializing" ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid rgba(0,180,216,0.15)", borderTopColor: "#00b4d8" }} />
                      <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#00b4d8" }}>LOADING MEDIAPIPE…</p>
                      <p style={{ fontSize: 10, color: "#334155" }}>First load downloads AI model (~5s)</p>
                    </>
                  ) : phase === "error" ? (
                    <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", maxWidth: 280 }}>⚠ {error}</p>
                  ) : (
                    <>
                      <Hand size={52} color="#1e3a5a" />
                      <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#1e3a5a" }}>SCANNER OFFLINE</p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Latency */}
            {isActive && prediction?.latencyMs && (
              <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 10, padding: "2px 8px",
                borderRadius: 4, background: "rgba(2,9,23,0.8)", color: "#475569",
                border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} />{prediction.latencyMs}ms
              </div>
            )}
          </div>

          {/* History strip */}
          <div style={{ margin: "0 20px 20px", padding: 16, borderRadius: 16,
            background: "#080f1e", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "#334155" }}>SIGN HISTORY</span>
              <button onClick={() => setHistory([])}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", fontSize: 10,
                  display: "flex", alignItems: "center", gap: 4 }}>
                <RotateCcw size={10} /> CLEAR
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 36, alignItems: "center" }}>
              <AnimatePresence>
                {history.length > 0
                  ? history.map((sign, i) => (
                    <motion.span key={`${sign}-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ padding: "4px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                        background: "#0a1628", border: "1px solid rgba(0,180,216,0.2)", color: "#7dd3fc" }}>
                      {sign === "space" ? "⎵" : sign === "del" ? "⌫" : sign}
                    </motion.span>
                  ))
                  : <span style={{ color: "#1e3a5a", fontSize: 12 }}>High-confidence signs appear here…</span>
                }
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 290, display: "flex", flexDirection: "column", gap: 16, padding: 20,
          borderLeft: "1px solid rgba(255,255,255,0.04)" }}>

          {/* Big sign */}
          <div style={{ borderRadius: 20, padding: 24, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12,
            background: "linear-gradient(135deg,#080f1e,#0a1628)",
            border: "1px solid rgba(0,180,216,0.08)", minHeight: 200, flex: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.3em", color: "#334155" }}>DETECTED SIGN</span>
            <AnimatePresence mode="wait">
              {isActive && prediction?.handDetected ? (
                <motion.div key={prediction.topSign}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 96, height: 96, borderRadius: 16, display: "flex",
                    alignItems: "center", justifyContent: "center", background: "#0a2040",
                    border: `2px solid ${confColor(prediction.confidence)}25`,
                    boxShadow: `0 0 32px ${confColor(prediction.confidence)}12` }}>
                    <span style={{ fontSize: prediction.topSign.length > 2 ? 28 : 56,
                      color: confColor(prediction.confidence), fontWeight: 700, lineHeight: 1 }}>
                      {prediction.topSign === "space" ? "⎵" : prediction.topSign === "del" ? "⌫" : prediction.topSign}
                    </span>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.2em",
                    color: confColor(prediction.confidence) }}>
                    {prediction.topSign === "space" ? "SPACE" : prediction.topSign === "del" ? "DELETE" : prediction.topSign}
                  </span>
                  <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 20,
                    background: `${confColor(prediction.confidence)}10`,
                    border: `1px solid ${confColor(prediction.confidence)}20`,
                    color: confColor(prediction.confidence) }}>
                    {(prediction.confidence * 100).toFixed(1)}% confidence
                  </span>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ opacity: 0.25, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <Hand size={40} color="#475569" />
                  <p style={{ fontSize: 12, color: "#475569" }}>{isActive ? "Show a hand sign…" : "—"}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Confidence bars */}
          <div style={{ borderRadius: 16, padding: 16, background: "#080f1e",
            border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "#334155",
              display: "block", marginBottom: 12 }}>TOP CANDIDATES</span>
            {(prediction?.topFive?.length > 0
              ? prediction.topFive
              : Array.from({ length: 5 }, () => ({ sign: "—", confidence: 0 }))
            ).map(({ sign, confidence }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 36, fontSize: 12, fontWeight: 700,
                  color: i === 0 ? "#7dd3fc" : "#334155" }}>{sign}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 4, background: "#0a1628", overflow: "hidden" }}>
                  <motion.div style={{ height: "100%", borderRadius: 4,
                    background: i === 0 ? "linear-gradient(90deg,#0077b6,#00b4d8)" : "#1e3a5a" }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 0.3 }} />
                </div>
                <span style={{ width: 36, fontSize: 10, textAlign: "right",
                  color: i === 0 ? "#7dd3fc" : "#1e3a5a" }}>
                  {confidence > 0 ? `${(confidence * 100).toFixed(0)}%` : ""}
                </span>
              </div>
            ))}
          </div>

          {/* Control button */}
          <div style={{ marginTop: "auto" }}>
            {phase !== "active" ? (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={initScanner} disabled={phase === "initializing"}
                style={{ width: "100%", padding: "14px", borderRadius: 12, fontWeight: 700,
                  fontSize: 11, letterSpacing: "0.2em", border: "none",
                  cursor: phase === "initializing" ? "wait" : "pointer",
                  background: phase === "initializing" ? "#0a1628" : "linear-gradient(135deg,#0077b6,#00b4d8)",
                  color: phase === "initializing" ? "#334155" : "white",
                  boxShadow: phase === "initializing" ? "none" : "0 0 24px rgba(0,180,216,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Zap size={15} />
                {phase === "initializing" ? "LOADING…" : "INITIALIZE SCANNER"}
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={stopScanner}
                style={{ width: "100%", padding: "14px", borderRadius: 12, fontWeight: 700,
                  fontSize: 11, letterSpacing: "0.2em", cursor: "pointer",
                  background: "transparent", border: "1px solid rgba(239,68,68,0.25)",
                  color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ZapOff size={15} /> STOP SCANNER
              </motion.button>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 10, letterSpacing: "0.15em", color: "#0f2744" }}>
            MEDIAPIPE JS · TENSORFLOW · SIGN2SIGN
          </p>
        </div>
      </div>
    </div>
  );
}
