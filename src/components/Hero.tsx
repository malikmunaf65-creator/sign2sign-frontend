import { motion } from "motion/react";
import { BrainCircuit } from "lucide-react";

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden bg-background">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-7xl px-6 md:px-20 flex flex-col items-center text-center gap-8">
        {/* Giant Typography */}
        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6 max-w-4xl"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-on-surface tracking-tighter leading-[1.1] drop-shadow-2xl">
            The future of <span className="text-gradient">human communication</span>
          </h1>
          <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mx-auto opacity-80 leading-relaxed uppercase tracking-[0.2em] font-bold">
            AI Powered Sign Translation
          </p>
        </motion.div>

        {/* Holographic Visual Asset */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-5xl mt-12 aspect-video rounded-3xl overflow-hidden glass-card bg-surface/20 flex items-center justify-center p-1"
        >
          <div className="glass-card-edge" />
          
          {/* Main Visual */}
          <div className="relative w-full h-full rounded-[23px] overflow-hidden">
            <img 
              referrerPolicy="no-referrer"
              alt="Holographic Sign Language Representation" 
              className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-70 scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4v7ONMkyq34mJhbnMEhtlJvHzdcO4cKq8kRi1ZTjQGFiB3iExweBkF6IMTUBeJ8H8TQj94dLsV3SVALKZrV6vYObVs5gsfYR8sp1gehB9kXQknrkVBOwOi6ln9xYfq-HItr3dkyKSkxR9qivvhp5OPqPJSVfGSVPx5Z9LB0NG7av2PyjTPJDkWCWDcj0iKNZNGiI1UJ9M6QGRi6oFWRZCp3ibA6bj_89h55QmyCKwA5H0n5mkiuuHRVVmO6B5i7rXWRD_-E0g_L-1" 
            />
            
            {/* Scanner Line Overlay */}
            <motion.div 
              animate={{ y: ["-100%", "100%", "-100%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent via-secondary/20 to-transparent pointer-events-none border-y border-secondary/20" 
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
