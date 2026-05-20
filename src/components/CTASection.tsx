import { motion } from "motion/react";
import { ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-[800px] flex items-center justify-center py-32 px-6 md:px-20 overflow-hidden bg-background">
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0">
        <img 
          referrerPolicy="no-referrer"
          alt="Neural expansion"
          className="w-full h-full object-cover opacity-20 mix-blend-screen grayscale"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPZ6AAKn8bHVAXzfUsz0z9GHU8g_lfEB6uaqKn8L-5RsLWhjQM06F0LKvF7GhuTK3CHJbuKOndeGT9EEuwnHr-ahG2VuuZmNnADR-2Zy4AfggiU366a8tZMbtcRBE4k_3UxjcVqZ11kvW0Qz5oKg5VCoFe06jJ_xD6d3S541NMQUnh_RYFhagz_8OJmQXruJJOp0N_p9MP50hSwzg9I33fTOFtTM0f6MwgC7Zei3_kLKXQMudKtuFuFWdpNvEsnCbxsroh9sCCWyOX"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 w-20 h-20 rounded-full bg-secondary-container/20 flex items-center justify-center backdrop-blur-xl border border-secondary-container/30 shadow-[0_0_50px_rgba(3,181,211,0.3)] animate-pulse"
        >
          <InfinityIcon className="w-10 h-10 text-secondary" strokeWidth={1.5} />
        </motion.div>

        <motion.h2 
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="font-display text-5xl md:text-8xl text-on-surface mb-8 tracking-tighter leading-none"
        >
          Experience <br /> <span className="text-on-surface-variant font-light">Futurism</span>
        </motion.h2>

        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-body text-body-lg text-on-surface-variant/70 max-w-2xl mb-16 leading-relaxed"
        >
          Join the vanguard of intelligent design. Sign2Sign blends high-end luxury with cutting-edge neural networks to create interfaces that feel alive.
        </motion.p>

        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="group relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-secondary to-primary opacity-20 blur-2xl group-hover:opacity-40 transition-opacity rounded-full" />
          <button
            onClick={() => navigate("/scanner")}
            className="relative px-12 py-5 bg-surface-container-highest backdrop-blur-3xl border border-white/10 rounded-full flex items-center gap-4 hover:bg-white/[0.08] transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_50px_-10px_rgba(208,188,255,0.3)]"
          >
            <span className="font-label text-sm uppercase tracking-[0.3em] font-bold text-on-surface">Experience Connect</span>
            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}