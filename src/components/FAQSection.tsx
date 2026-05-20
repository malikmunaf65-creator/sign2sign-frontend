import { motion } from "motion/react";

const faqs = [
  { 
    q: "How accurate is the real-time translation?", 
    a: "Our neural engine achieves 99.2% accuracy by analyzing 87,000+ spatial gestures." 
  },
  { 
    q: "Does it support international sign languages?", 
    a: "We currently prioritize ASL but are expanding into BSL and ISL based on user data." 
  },
  { 
    q: "Can I use external cameras for scanning?", 
    a: "Yes, Sign2Sign is compatible with most standard high-definition webcams and mobile cameras." 
  },
  { 
    q: "What makes Sign2Sign different from standard dictionaries?", 
    a: "We use context-aware parsing to understand full sentences rather than isolated static gestures." 
  }
];

export default function FAQSection() {
  return (
    <section className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-20 relative z-10">
        <h2 className="font-display text-4xl md:text-5xl text-on-surface mb-20 text-center">Frequently Asked Questions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {faqs.map((faq, i) => (
            <motion.div 
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-2xl group"
            >
              <div className="glass-card-edge" />
              <h3 className="font-display text-xl text-primary mb-3">{faq.q}</h3>
              <p className="font-body text-on-surface-variant/70 leading-relaxed font-light">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
