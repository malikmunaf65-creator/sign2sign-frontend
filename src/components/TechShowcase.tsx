import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";

const alphabet = [
  { char: "A", desc: "Form a tight fist and rest your thumb flat against the side of your index finger.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=A+Sign" },
  { char: "B", desc: "Extend all four fingers straight up, pressed together, and fold your thumb across your palm.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=B+Sign" },
  { char: "C", desc: "Curve your hand so all fingers and thumb form a semi-circle, mimicking a large 'C'.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=C+Sign" },
  { char: "D", desc: "Point your index finger straight up while your other three fingers curve to meet your thumb.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=D+Sign" },
  { char: "E", desc: "Fold all fingers inward with nails resting atop your thumb; keep the fist compact.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=E+Sign" },
  { char: "F", desc: "Touch the tip of your index finger to your thumb to form a circle; extend the other three fingers.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=F+Sign" },
  { char: "G", desc: "Point your index finger and thumb horizontally, as if pinching a small object sideways.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=G+Sign" },
  { char: "H", desc: "Extend your index and middle fingers together horizontally while keeping your others tucked.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=H+Sign" },
  { char: "I", desc: "Extend your pinky finger straight up, keeping the rest of your hand in a firm fist.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=I+Sign" },
  { char: "J", desc: "Start with your pinky extended up, then draw a hook shape in the air to form the letter 'J'.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=J+Sign" },
  { char: "K", desc: "Extend your index and middle fingers up in a 'V' and place your thumb between them.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=K+Sign" },
  { char: "L", desc: "Extend your index finger straight up and your thumb outward to form a right-angle 'L'.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=L+Sign" },
  { char: "M", desc: "Make a fist and tuck your thumb underneath your index, middle, and ring fingers.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=M+Sign" },
  { char: "N", desc: "Make a fist and tuck your thumb underneath your index and middle fingers.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=N+Sign" },
  { char: "O", desc: "Touch all your fingertips to the tip of your thumb to form a clean circular shape.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=O+Sign" },
  { char: "P", desc: "Extend your index finger forward and middle finger downward, with your thumb in between.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=P+Sign" },
  { char: "Q", desc: "Point your index finger and thumb downward, as if reaching to pick up a small object.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=Q+Sign" },
  { char: "R", desc: "Cross your middle finger over your index finger and keep your other fingers tucked.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=R+Sign" },
  { char: "S", desc: "Make a tight fist and wrap your thumb across the front of your folded fingers.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=S+Sign" },
  { char: "T", desc: "Make a fist and tuck your thumb between your index and middle fingers (tucked further than 'M/N').", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=T+Sign" },
  { char: "U", desc: "Extend your index and middle fingers together and point them straight up.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=U+Sign" },
  { char: "V", desc: "Extend your index and middle fingers up and spread them apart in a 'Victory' or 'V' shape.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=V+Sign" },
  { char: "W", desc: "Extend your index, middle, and ring fingers up and spread them apart in a 'W' shape.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=W+Sign" },
  { char: "X", desc: "Form a fist and crook your index finger into a hook, pointing it upwards.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=X+Sign" },
  { char: "Y", desc: "Extend your thumb and pinky finger outward while keeping your middle fingers tucked.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=Y+Sign" },
  { char: "Z", desc: "Extend your index finger and draw the shape of a 'Z' in the air with a single motion.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=Z+Sign" },
  { char: "DEL", desc: "Hold your hand up with fingers slightly curved towards you to signify a backspace or delete command.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=DEL+Sign" },
  { char: "SPACE", desc: "Hold your hand flat and move it in a horizontal slide to represent a space between words.", image: "https://placehold.co/600x600/0b0b0b/D0BCFF?text=SPACE+Sign" }
];

export default function TechShowcase() {
  const [selectedChar, setSelectedChar] = useState<typeof alphabet[0] | null>(null);

  return (
    <section className="relative z-20 w-full bg-background pb-32">
      <div className="max-w-7xl mx-auto px-6 md:px-20">
        <div className="flex flex-col gap-12">
          
          {/* Header Content */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-8 max-w-3xl"
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 w-fit">
              <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_12px_rgba(76,215,246,1)] animate-pulse" />
              <span className="font-label text-[10px] text-primary uppercase tracking-widest font-bold">Comprehensive Dataset</span>
            </div>

            <h2 className="font-display text-4xl md:text-6xl text-on-surface leading-tight tracking-tight">
              Translating the gestures <br /><span className="text-on-surface-variant font-light">around the globe.</span>
            </h2>

            <h3 className="font-display text-2xl md:text-3xl text-primary font-light border-l-4 border-secondary pl-6 py-2">
              Based on 87,000+ hand gestures of ASL around the globe
            </h3>
          </motion.div>

          {/* Alphabet Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="relative pt-8"
          >
            <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-10 gap-3">
              {alphabet.map((item) => (
                <motion.button
                  key={item.char}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedChar(item)}
                  className={`relative p-4 rounded-xl border transition-all flex items-center justify-center font-display text-xl sm:text-2xl font-bold
                    ${selectedChar?.char === item.char 
                      ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(208,188,255,0.2)] text-primary" 
                      : "bg-surface/20 border-white/10 text-on-surface-variant hover:border-secondary/40 hover:text-white"
                    }`}
                >
                  {item.char}
                  {selectedChar?.char === item.char && (
                    <motion.div 
                      layoutId="outline" 
                      className="absolute -inset-1 rounded-xl border-2 border-primary/40 pointer-events-none" 
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Interactive Detail Overlay/Info */}
          <AnimatePresence mode="wait">
            {selectedChar && (
              <motion.div
                key={selectedChar.char}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="glass-card p-8 md:p-12 rounded-3xl flex flex-col md:flex-row gap-12 items-center bg-surface/40"
              >
                <div className="glass-card-edge" />
                <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center p-4 border border-white/5 relative group">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img 
                    referrerPolicy="no-referrer"
                    src={selectedChar.image}
                    alt={`Sign for ${selectedChar.char}`}
                    className="w-full h-full object-contain relative z-10 transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://placehold.co/600x600/0b0b0b/4cd7f6?text=${selectedChar.char}+Sign`;
                    }}
                  />
                  <div className="absolute bottom-4 right-4 text-[10px] uppercase tracking-widest text-primary/40 font-mono">
                    Visual ID: {selectedChar.char}_SIG_01
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                      {selectedChar.char}
                    </div>
                    <h4 className="font-display text-3xl text-on-surface font-semibold tracking-tight">Instruction</h4>
                  </div>
                  <div className="flex gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                    <Info className="w-6 h-6 text-secondary shrink-0" />
                    <p className="font-body text-xl text-on-surface-variant leading-relaxed font-light">
                      {selectedChar.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
