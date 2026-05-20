import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Hand, Gauge, Globe, Users, Smile, Play, Video, StopCircle, Upload } from "lucide-react";

export default function VisionSection() {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startScanner = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Please ensure you have granted camera permissions to use the scanner.");
    }
  };

  const stopScanner = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsScanning(false);
  };

  const handleFileBrowse = () => {
    fileInputRef.current?.click();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <section className="relative w-full py-32 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-20">
        
        {/* Live Prediction Showcase Header */}
        <div id="live-scanner" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-40">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-secondary/20 bg-secondary/5 w-fit">
              <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? "bg-red-500 animate-pulse" : "bg-secondary"} shadow-[0_0_10px_#4cd7f6]`} />
              <span className="font-label text-[10px] text-secondary uppercase tracking-[0.2em] font-bold">
                {isScanning ? "Live Scanner Active" : "Live ASL Prediction"}
              </span>
            </div>
            
            <h2 className="font-display text-4xl md:text-5xl text-on-surface leading-tight">
              See the Invisible. <br />
              <span className="text-gradient">Translate Instantly.</span>
            </h2>
            
            <p className="font-body text-body-lg text-on-surface-variant max-w-md opacity-80">
              Our proprietary neural engine maps hand morphology in real-time, translating spatial gestures into semantic meaning with zero latency.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <button 
                onClick={isScanning ? stopScanner : startScanner}
                className={`flex-1 min-w-[200px] px-8 py-5 ${isScanning ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-gradient-to-r from-primary/20 to-secondary/20 border-white/10 text-on-surface"} border hover:border-primary/40 rounded-full font-label text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isScanning ? (
                  <>
                    <StopCircle className="w-5 h-5" />
                    Terminate Session
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5" />
                    Initialize Scanner
                  </>
                )}
              </button>

              <button 
                onClick={handleFileBrowse}
                className="flex-1 min-w-[200px] px-8 py-5 bg-white/5 border border-white/10 hover:border-secondary/40 rounded-full font-label text-xs uppercase tracking-[0.2em] text-on-surface transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                <Upload className="w-5 h-5 text-secondary transition-transform group-hover:-translate-y-1" />
                Browse Files
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/*,image/*" 
                onChange={(e) => console.log("File selected:", e.target.files?.[0])}
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-12 xl:col-span-7 relative"
          >
            <div className="glass-card rounded-[2.5rem] p-4 md:p-8 aspect-video relative flex items-center justify-center group overflow-hidden bg-black/40 shadow-inner">
              <div className="glass-card-edge opacity-50" />
              
              {/* HUD Grid */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] z-10 pointer-events-none" />
              
              {/* Live Video Feeds */}
              <div className="absolute inset-0 w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isScanning ? "opacity-60 grayscale-[40%]" : "opacity-0"}`}
                />
                
                <AnimatePresence>
                  {!isScanning && (
                    <motion.img 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      referrerPolicy="no-referrer"
                      alt="Scanning..." 
                      className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity grayscale group-hover:scale-105 transition-transform duration-[10s]"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB067cDIxfHh7S1Ff_cayXOs8fK_1BS4MPXYVdEdJB67iXBKEOdKcmcv92uXH6LlyBIU9LMbB4knPpnymfaqgiUD_eYgySYq_KediK1NR1yLCGX2jsWXa7n8FINDiGv8msAHTVT0ep614wy4A19m7v0_oh2Qm_DYUgI6FH3ddQk6O5JgZ1cVFdiJcrR8e5nPwxC7unoRl4N8aYXwqDVBxprZn2NJzYCkgPCchsh1ejKA_fSJFUE8LP8TFURZcMzUIGL47TZ8qQ9vqZY"
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Centered Hand Skeleton Illustration (Simulated) */}
              <motion.div 
                animate={isScanning ? { scale: [1, 1.02, 1], opacity: [0.6, 0.9, 0.6] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative w-80 h-80 z-30 pointer-events-none"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(76,215,246,0.8)]">
                  <motion.path 
                    animate={isScanning ? { pathLength: [0, 1], opacity: [0.3, 0.8] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    d="M50 85 L50 45 L30 25 M50 45 L42 10 M50 45 L58 10 M50 45 L70 20 M50 55 L75 35" 
                    fill="none" 
                    stroke="#4cd7f6" 
                    strokeWidth="0.8" 
                    strokeLinecap="round" 
                    opacity="0.8" 
                  />
                  {[
                    [50,85, "primary"], [50,45, "primary"], [30,25, "secondary"], 
                    [42,10, "secondary"], [58,10, "secondary"], [70,20, "secondary"], 
                    [75,35, "secondary"]
                  ].map(([x, y, color], i) => (
                    <motion.circle 
                      key={i} 
                      cx={x as number} 
                      cy={y as number} 
                      r="1.6" 
                      fill={color === "primary" ? "#d0bcff" : "#4cd7f6"} 
                      initial={false}
                      animate={isScanning ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
                      transition={{ delay: i * 0.1, duration: 2, repeat: Infinity }}
                    />
                  ))}
                </svg>
              </motion.div>

              <div className="absolute bottom-8 right-8 font-label text-[10px] text-on-surface/40 uppercase tracking-[0.4em] font-medium z-30">
                {isScanning ? "Live Stream Optimized_" : "Neural Engine Active_"}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Vision Header */}
        <div id="vision-header" className="text-center max-w-3xl mx-auto mb-20 px-6">
          <motion.h2 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-6xl text-on-surface mb-8 tracking-tight"
          >
            A World Without <br /><span className="text-on-surface-variant font-light">Communication Barriers</span>
          </motion.h2>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-body text-body-lg text-on-surface-variant/70 leading-relaxed"
          >
            Our vision extends beyond technology. We are building an ecosystem where seamless communication is a fundamental right, blending physical presence with digital translation.
          </motion.p>
        </div>

        {/* Vision Component Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-40">
          {[
            { icon: <Globe />, title: "Universal Integration", desc: "Embedding Sign2Sign nodes in public infrastructure, ensuring instant translation at transit hubs, hospitals, and govt facilities.", delay: 0 },
            { icon: <Users />, title: "Empowered Workspaces", desc: "Real-time augmented reality overlays call for professional environments, allowing deaf professionals to lead meetings with zero friction.", delay: 0.1 }
          ].map((card, i) => (
            <motion.div 
              key={card.title}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: card.delay, duration: 0.6 }}
              className={`glass-card p-10 rounded-3xl group flex flex-col gap-8 transition-all hover:-translate-y-2 ${i === 1 ? "bg-primary/5 border-primary/20 scale-105 shadow-[0_0_60px_rgba(208,188,255,0.1)]" : ""}`}
            >
              <div className="glass-card-edge" />
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${i === 1 ? "bg-primary/20 text-primary glow-primary" : "bg-white/5 text-on-surface-variant"}`}>
                {card.icon}
              </div>
              <div className="space-y-4">
                <h3 className="font-display text-2xl text-on-surface font-semibold">{card.title}</h3>
                <p className="font-body text-on-surface-variant/80 leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
