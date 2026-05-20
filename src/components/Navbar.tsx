import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-surface/5 backdrop-blur-xl border-b border-white/10"
    >
      <div className="flex justify-between items-center w-full px-6 md:px-20 py-6 max-w-7xl mx-auto">
        <div 
          onClick={() => scrollTo('hero')}
          className="font-display text-2xl font-bold tracking-tighter text-primary cursor-pointer active:scale-95 transition-transform"
        >
          Sign2Sign
        </div>
        
        {/* Web Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Technology", id: "hero" },
            { label: "Vision", id: "vision-header" },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => scrollTo(item.id)}
              className="text-on-surface-variant font-body text-sm hover:text-secondary transition-all duration-300 cursor-pointer"
            >
              {item.label}
            </button>
          ))}

          {/* Live Prediction → goes to scanner */}
          <button
            onClick={() => navigate("/scanner")}
            className="text-on-surface-variant font-body text-sm hover:text-secondary transition-all duration-300 cursor-pointer"
          >
            Live Prediction
          </button>

          <a href="#" className="text-on-surface-variant font-body text-sm hover:text-secondary transition-all duration-300">Early Access</a>
        </div>

        {/* Experience Connect button → goes to scanner */}
        <button
          onClick={() => navigate("/scanner")}
          className="bg-gradient-to-r from-secondary to-primary text-on-primary font-label text-xs uppercase tracking-widest px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(76,215,246,0.3)] hover:shadow-[0_0_30px_rgba(208,188,255,0.5)] transition-all duration-300 flex items-center gap-2 group"
        >
          Experience Connect
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.nav>
  );
}