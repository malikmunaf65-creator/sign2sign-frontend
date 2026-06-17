import { motion } from "motion/react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-background"
    >
      {/* Background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-20 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left content */}
        <div className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/5 w-fit"
          >
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label text-xs text-secondary tracking-widest uppercase">
              Live ASL Prediction
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-6xl md:text-8xl text-on-surface tracking-tighter leading-none"
          >
            See the Invisible.{" "}
            <span className="text-primary">Translate Instantly.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-body-lg text-on-surface-variant/70 max-w-lg leading-relaxed"
          >
            Our proprietary neural engine maps hand morphology in real-time,
            translating spatial gestures into semantic meaning with zero latency.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-8 pt-4 border-t border-white/5"
          >
            {[
              { value: "28",   label: "ASL Signs" },
              { value: "95%",  label: "Accuracy" },
              { value: "<1s",  label: "Latency" },
              { value: "11",   label: "Languages" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-display text-2xl font-bold text-primary">{value}</div>
                <div className="font-body text-xs text-on-surface-variant/50 mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — neural hand visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative w-[480px] h-[480px] rounded-3xl overflow-hidden border border-white/5 bg-surface-container">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPZ6AAKn8bHVAXzfUsz0z9GHU8g_lfEB6uaqKn8L-5RsLWhjQM06F0LKvF7GhuTK3CHJbuKOndeGT9EEuwnHr-ahG2VuuZmNnADR-2Zy4AfggiU366a8tZMbtcRBE4k_3UxjcVqZ11kvW0Qz5oKg5VCoFe06jJ_xD6d3S541NMQUnh_RYFhagz_8OJmQXruJJOp0N_p9MP50hSwzg9I33fTOFtTM0f6MwgC7Zei3_kLKXQMudKtuFuFWdpNvEsnCbxsroh9sCCWyOX"
              alt="Neural hand tracking visualization"
              className="w-full h-full object-cover opacity-60 mix-blend-screen grayscale"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <div className="font-mono text-xs text-secondary/60 tracking-widest">
                NEURAL ENGINE ACTIVE_
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
