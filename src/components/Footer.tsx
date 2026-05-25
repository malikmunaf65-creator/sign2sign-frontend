import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Send, Hand } from "lucide-react";
 
// ── Modal content ─────────────────────────────────────────────────────────────
const MODALS = {
  privacy: {
    title: "Privacy Policy",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13, lineHeight: 1.7, color: "#94a3b8" }}>
        <p><strong style={{ color: "#e2e8f0" }}>Last updated:</strong> May 2026</p>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Data We Collect</h3>
          <p>Sign2Sign AI collects only what's necessary: your email address for authentication, and anonymized gesture prediction data to improve model accuracy. We do not store raw video or images from your webcam.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>How We Use It</h3>
          <p>Your prediction history is stored securely in our database to power your personal progress tracking. We never sell your data to third parties. Aggregate, anonymized data may be used to improve the AI model.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Camera Access</h3>
          <p>Camera access is requested only when you initialize the scanner. Video frames are processed locally in your browser by MediaPipe — only extracted landmark coordinates (63 numbers, no image) are sent to our server.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Your Rights</h3>
          <p>You can request deletion of your account and all associated data at any time by contacting us at privacy@sign2sign.ai.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Cookies</h3>
          <p>We use only essential cookies for authentication. No tracking or advertising cookies.</p>
        </section>
      </div>
    ),
  },
  terms: {
    title: "Terms of Service",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 13, lineHeight: 1.7, color: "#94a3b8" }}>
        <p><strong style={{ color: "#e2e8f0" }}>Effective:</strong> May 2026</p>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Acceptance</h3>
          <p>By using Sign2Sign AI, you agree to these terms. If you do not agree, please do not use the service.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Use of Service</h3>
          <p>Sign2Sign AI is provided for personal and educational use. You may not use the service to: violate any laws, harass others, attempt to reverse-engineer the AI model, or scrape data in bulk.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>AI Accuracy</h3>
          <p>Our ASL recognition AI achieves ~95% accuracy under ideal conditions but is not perfect. Sign2Sign AI is not intended for safety-critical communication. Always verify important communications through additional means.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Intellectual Property</h3>
          <p>The Sign2Sign AI platform, including the trained model, UI, and brand, is proprietary. You may not reproduce or distribute any part without written permission.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Limitation of Liability</h3>
          <p>Sign2Sign AI is provided "as is" without warranties of any kind. We are not liable for any damages arising from use of the service.</p>
        </section>
      </div>
    ),
  },
  research: {
    title: "Research",
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 13, lineHeight: 1.7, color: "#94a3b8" }}>
        <div style={{ padding: 20, borderRadius: 12, background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.15)" }}>
          <h3 style={{ color: "#00b4d8", marginBottom: 8 }}>Sign2Sign AI v5 — Technical Overview</h3>
          <p>Our latest model uses a landmark-based deep learning approach, achieving <strong style={{ color: "#e2e8f0" }}>~95.27% validation accuracy</strong> across 28 ASL classes.</p>
        </div>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Architecture</h3>
          <p>Instead of raw image classification, we extract 21 hand landmarks (x, y, z coordinates each = 63 features) using Google MediaPipe Hands. These landmarks are fed into a TensorFlow/Keras dense neural network trained on the ASL Alphabet Dataset.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Why Landmarks?</h3>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Lighting-invariant — works in any lighting condition</li>
            <li>Privacy-preserving — no raw image leaves the browser</li>
            <li>10x smaller model size vs. CNN image classifiers</li>
            <li>Real-time performance on CPU with &lt;100ms latency</li>
          </ul>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Dataset & Training</h3>
          <p>Trained on the ASL Alphabet Dataset with 29 classes (A–Z, space, delete). Early stopping was used to prevent overfitting. Batch size: 64. Final model: sign2sign_v5_final.keras.</p>
        </section>
        <section>
          <h3 style={{ color: "#e2e8f0", marginBottom: 6 }}>Future Research</h3>
          <p>We are exploring: dynamic gesture recognition (not just static letters), word-level ASL recognition using sequence models (LSTM/Transformer), and multilingual sign language support (BSL, ISL, etc.).</p>
        </section>
      </div>
    ),
  },
  contact: {
    title: "Contact Us",
    content: null, // handled separately with form
  },
};
 
type ModalKey = keyof typeof MODALS;
 
// ── Slide-up Modal ────────────────────────────────────────────────────────────
function SlideModal({ modalKey, onClose }: { modalKey: ModalKey; onClose: () => void }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [sent,    setSent]    = useState(false);
 
  const modal = MODALS[modalKey];
 
  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    // In production: send to your backend or a service like Resend/Formspree
    setSent(true);
  };
 
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 720, maxHeight: "85vh",
          background: "#080f1e", borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "none", display: "flex", flexDirection: "column",
          overflow: "hidden" }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>
 
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#00b4d8,#0077b6)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Hand size={16} color="white" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{modal.title}</h2>
          </div>
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: 6, cursor: "pointer", color: "#475569", display: "flex" }}>
            <X size={16} />
          </button>
        </div>
 
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          {modalKey === "contact" ? (
            sent ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
                <h3 style={{ color: "#e2e8f0", marginBottom: 8 }}>Message Sent!</h3>
                <p style={{ color: "#64748b", fontSize: 13 }}>We'll get back to you within 24-48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContact} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
                  Have a question, feedback, or partnership inquiry? We'd love to hear from you.
                </p>
                {[
                  { label: "Your Name", value: name, set: setName, type: "text", placeholder: "Munaf Malik" },
                  { label: "Email Address", value: email, set: setEmail, type: "email", placeholder: "you@example.com" },
                ].map(({ label, value, set, type, placeholder }) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, letterSpacing: "0.15em", color: "#475569" }}>{label.toUpperCase()}</label>
                    <input type={type} value={value} onChange={e => set(e.target.value)}
                      placeholder={placeholder} required
                      style={{ padding: "11px 14px", borderRadius: 10, background: "#060d1a",
                        border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0",
                        fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, letterSpacing: "0.15em", color: "#475569" }}>MESSAGE</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind…" required rows={4}
                    style={{ padding: "11px 14px", borderRadius: 10, background: "#060d1a",
                      border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0",
                      fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                  <button type="submit"
                    style={{ padding: "11px 24px", borderRadius: 10, fontWeight: 700, fontSize: 12,
                      letterSpacing: "0.15em", border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg,#0077b6,#00b4d8)", color: "white",
                      display: "flex", alignItems: "center", gap: 8 }}>
                    <Send size={14} /> SEND MESSAGE
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Mail size={14} color="#475569" />
                    <span style={{ fontSize: 11, color: "#334155" }}>hello@sign2sign.ai</span>
                  </div>
                </div>
              </form>
            )
          ) : (
            modal.content
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
 
// ── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
 
  const links: { label: string; key: ModalKey }[] = [
    { label: "Privacy", key: "privacy" },
    { label: "Terms",   key: "terms" },
    { label: "Research", key: "research" },
    { label: "Contact", key: "contact" },
  ];
 
  return (
    <>
      <footer className="relative w-full border-t border-white/5 bg-background py-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div style={{ width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg,#00b4d8,#0077b6)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Hand size={16} color="white" />
            </div>
            <span className="font-display text-lg font-bold text-primary tracking-tighter">Sign2Sign</span>
          </div>
 
          {/* Links — open modals */}
          <div className="flex items-center gap-8">
            {links.map(({ label, key }) => (
              <button
                key={key}
                onClick={() => setActiveModal(key)}
                className="font-body text-sm text-on-surface-variant/50 hover:text-secondary transition-colors cursor-pointer bg-transparent border-none"
              >
                {label}
              </button>
            ))}
          </div>
 
          {/* Copyright */}
          <p className="font-body text-xs text-on-surface-variant/30">
            © {new Date().getFullYear()} Sign2Sign AI. All rights reserved.
          </p>
        </div>
      </footer>
 
      {/* Slide-up modals */}
      <AnimatePresence>
        {activeModal && (
          <SlideModal
            key={activeModal}
            modalKey={activeModal}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}