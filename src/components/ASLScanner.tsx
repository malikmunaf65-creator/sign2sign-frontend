// src/components/ASLScanner.tsx — with webcam + file upload
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import {
  Hand, Zap, ZapOff, Activity, RotateCcw,
  Clock, Wifi, LogOut, Upload, Camera
} from "lucide-react";

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

type Mode = "webcam" | "upload";

export default function ASLScanner() {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const imageRef       = useRef<HTMLImageElement>(null);
  const landmarkerRef  = useRef<HandLandmarker | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval>>();

  const [mode,       setMode]       = useState<Mode>("webcam");
  const [phase,      setPhase]      = useState<"idle"|"initializing"|"active"|"stopped"|"error">("idle");
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [history,    setHistory]    = useState<string[]>([]);
  const [fps,        setFps]        = useState(0);
  const [ping,       setPing]       = useState<number | null>(null);
  const [error,      setError]      = useState("");
  const [uploadedImg, setUploadedImg] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fpsRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => { setFps(fpsRef.current); fpsRef.current = 0; }, 1000);
    return () => clearInterval(t);
  }, []);

  const loadMediaPipe = useCallback(async () => {
    if (landmarkerRef.current) return;
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numHands: 1,
    });
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) return "dev";
    return user.getIdToken(false);
  }, []);

  const sendLandmarks = useCallback(async (landmarks: number[]) => {
    try {
      const token = await getToken();
      const t0 = performance.now();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token !== "dev") headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${RAILWAY_URL}/predict`, {
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
      console.warn("Predict error:", err);
    }
  }, [getToken]);

  // ── IMAGE UPLOAD MODE ──────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setPrediction(null);
    setError("");

    try {
      await loadMediaPipe();
      if (!landmarkerRef.current) throw new Error("MediaPipe not loaded");

      // Switch to IMAGE mode
      await landmarkerRef.current.setOptions({ runningMode: "IMAGE" });

      const url = URL.createObjectURL(file);
      setUploadedImg(url);

      const img = new Image();
      img.src = url;
      await new Promise(resolve => img.onload = resolve);

      const result = landmarkerRef.current.detect(img);

      if (!result.landmarks || result.landmarks.length === 0) {
        setError("No hand detected in image. Try a clearer photo.");
        setIsAnalyzing(false);
        return;
      }

      const landmarks = result.landmarks[0].flatMap(lm => [lm.x, lm.y, lm.z]);
      await sendLandmarks(landmarks);
    } catch (err: any) {
      setError(err.message || "Failed to analyze image");
    } finally {
      setIsAnalyzing(false);
    }
  }, [loadMediaPipe, sendLandmarks]);

  // ── WEBCAM MODE ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }, audio: false,
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }, []);

  const processFrame = useCallback(async () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    await landmarker.setOptions({ runningMode: "VIDEO" });
    const result = landmarker.detectForVideo(video, performance.now());

    if (!result.landmarks || result.landmarks.length === 0) {
      setPrediction(prev => prev ? { ...prev, handDetected: false } : null);
      return;
    }

    const landmarks = result.landmarks[0].flatMap(lm => [lm.x, lm.y, lm.z]);
    await sendLandmarks(landmarks);
  }, [sendLandmarks]);

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
    setPhase("stopped");
    setPrediction(null);
  }, []);

  const switchMode = (newMode: Mode) => {
    stopScanner();
    setPrediction(null);
    setUploadedImg(null);
    setError("");
    setMode(newMode);
    setPhase("idle");
  };

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
        </div>

        {/* Mode switcher */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["webcam", "upload"] as Mode[]).map(m => (
            <button key={m} onClick={() => switchMode(m)}
              style={{ padding: "6px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                letterSpacing: "0.15em", cursor: "pointer", border: "none",
                background: mode === m ? "linear-gradient(135deg,#0077b6,#00b4d8)" : "#0a1628",
                color: mode === m ? "white" : "#475569",
                display: "flex", alignItems: "center", gap: 6 }}>
              {m === "webcam" ? <Camera size={12} /> : <Upload size={12} />}
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 11, color: "#475569" }}>
          {ping !== null && <span>{ping}ms</span>}
          {isActive && <span style={{ color: "#4ade80" }}>{fps} fps</span>}
          {user && <span>{user.email?.split("@")[0]}</span>}
          {user && (
            <button onClick={() => signOut(auth)}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#475569", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
              <LogOut size={13} /> Sign out
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── WEBCAM MODE ── */}
          {mode === "webcam" && (
            <div style={{ position: "relative", flex: 1, margin: 20, borderRadius: 20, overflow: "hidden",
              border: `1px solid ${isActive ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.05)"}`,
              background: "#020917", minHeight: 320 }}>
              <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} muted playsInline />

              {isActive && (
                <motion.div style={{ position: "absolute", left: 0, right: 0, height: 2, pointerEvents: "none",
                  background: "linear-gradient(90deg,transparent,rgba(0,180,216,0.3),#00b4d8,rgba(0,180,216,0.3),transparent)" }}
                  animate={{ top: ["4%", "96%", "4%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
              )}

              {isActive && [
                { top: 14, left: 14, borderTop: "2px solid #00b4d8", borderLeft: "2px solid #00b4d8", borderRadius: "8px 0 0 0" },
                { top: 14, right: 14, borderTop: "2px solid #00b4d8", borderRight: "2px solid #00b4d8", borderRadius: "0 8px 0 0" },
                { bottom: 14, left: 14, borderBottom: "2px solid #00b4d8", borderLeft: "2px solid #00b4d8", borderRadius: "0 0 0 8px" },
                { bottom: 14, right: 14, borderBottom: "2px solid #00b4d8", borderRight: "2px solid #00b4d8", borderRadius: "0 0 8px 0" },
              ].map((s, i) => <div key={i} style={{ position: "absolute", width: 28, height: 28, ...s }} />)}

              <AnimatePresence>
                {!isActive && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 16, background: "rgba(2,9,23,0.93)" }}>
                    {phase === "initializing" ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid rgba(0,180,216,0.15)", borderTopColor: "#00b4d8" }} />
                        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#00b4d8" }}>LOADING MEDIAPIPE…</p>
                        <p style={{ fontSize: 10, color: "#334155" }}>First load ~5 seconds</p>
                      </>
                    ) : phase === "error" ? (
                      <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", maxWidth: 280 }}>⚠ {error}</p>
                    ) : (
                      <>
                        <Camera size={52} color="#1e3a5a" />
                        <p style={{ fontSize: 11, letterSpacing: "0.3em", color: "#1e3a5a" }}>SCANNER OFFLINE</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isActive && prediction?.latencyMs && (
                <div style={{ position: "absolute", bottom: 12, right: 12, fontSize: 10,
                  padding: "2px 8px", borderRadius: 4, background: "rgba(2,9,23,0.8)",
                  color: "#475569", border: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={10} />{prediction.latencyMs}ms
                </div>
              )}
            </div>
          )}

          {/* ── UPLOAD MODE ── */}
          {mode === "upload" && (
            <div style={{ flex: 1, margin: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Drop zone */}
              <label style={{ position: "relative", flex: uploadedImg ? 0 : 1, minHeight: uploadedImg ? "auto" : 320,
                borderRadius: 20, border: "2px dashed rgba(0,180,216,0.3)",
                background: "#020917", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12, cursor: "pointer",
                transition: "border-color 0.2s", padding: 24 }}>
                <input type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <Upload size={40} color="#1e3a5a" />
                <p style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
                  Click to upload a hand sign image
                </p>
                <p style={{ fontSize: 11, color: "#334155" }}>JPG, PNG, WEBP supported</p>
                <div style={{ padding: "8px 20px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  background: "linear-gradient(135deg,#0077b6,#00b4d8)", color: "white",
                  letterSpacing: "0.15em" }}>
                  BROWSE FILES
                </div>
              </label>

              {/* Preview */}
              {uploadedImg && (
                <div style={{ position: "relative", borderRadius: 20, overflow: "hidden",
                  border: "1px solid rgba(0,180,216,0.15)", background: "#020917", flex: 1, minHeight: 280 }}>
                  <img src={uploadedImg} alt="uploaded"
                    style={{ width: "100%", height: "100%", objectFit: "contain", maxHeight: 400 }} />

                  {isAnalyzing && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 12,
                      background: "rgba(2,9,23,0.85)" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ width: 40, height: 40, borderRadius: "50%",
                          border: "2px solid rgba(0,180,216,0.2)", borderTopColor: "#00b4d8" }} />
                      <p style={{ fontSize: 11, color: "#00b4d8", letterSpacing: "0.2em" }}>ANALYZING…</p>
                    </div>
                  )}

                  {error && (
                    <div style={{ position: "absolute", bottom: 12, left: 12, right: 12,
                      padding: "10px 16px", borderRadius: 10,
                      background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                      color: "#fca5a5", fontSize: 12, textAlign: "center" }}>
                      {error}
                    </div>
                  )}

                  {/* Re-upload button */}
                  <label style={{ position: "absolute", top: 12, right: 12, cursor: "pointer",
                    padding: "6px 12px", borderRadius: 8, background: "rgba(2,9,23,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "#94a3b8",
                    display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="file" accept="image/*" style={{ display: "none" }}
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    <Upload size={12} /> New image
                  </label>
                </div>
              )}
            </div>
          )}

          {/* History strip */}
          <div style={{ margin: "0 20px 20px", padding: 16, borderRadius: 16,
            background: "#080f1e", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "#334155" }}>SIGN HISTORY</span>
              <button onClick={() => setHistory([])}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#334155",
                  fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
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
                  : <span style={{ color: "#1e3a5a", fontSize: 12 }}>Recognized signs appear here…</span>
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
            border: "1px solid rgba(0,180,216,0.08)", minHeight: 200 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.3em", color: "#334155" }}>DETECTED SIGN</span>
            <AnimatePresence mode="wait">
              {prediction?.handDetected ? (
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
                  <p style={{ fontSize: 12, color: "#475569" }}>
                    {mode === "upload" ? "Upload an image…" : isActive ? "Show a hand sign…" : "—"}
                  </p>
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

          {/* Control */}
          <div style={{ marginTop: "auto" }}>
            {mode === "webcam" && (
              phase !== "active" ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={initScanner} disabled={phase === "initializing"}
                  style={{ width: "100%", padding: "14px", borderRadius: 12, fontWeight: 700,
                    fontSize: 11, letterSpacing: "0.2em", border: "none",
                    cursor: phase === "initializing" ? "wait" : "pointer",
                    background: phase === "initializing" ? "#0a1628" : "linear-gradient(135deg,#0077b6,#00b4d8)",
                    color: phase === "initializing" ? "#334155" : "white",
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
              )
            )}

            {mode === "upload" && (
              <label style={{ width: "100%", padding: "14px", borderRadius: 12, fontWeight: 700,
                fontSize: 11, letterSpacing: "0.2em", cursor: "pointer",
                background: "linear-gradient(135deg,#0077b6,#00b4d8)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 0 24px rgba(0,180,216,0.2)" }}>
                <input type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                <Upload size={15} /> UPLOAD IMAGE
              </label>
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