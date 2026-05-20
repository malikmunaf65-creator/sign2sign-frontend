export default function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 w-full py-12 px-6 md:px-20 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-primary/5 blur-[120px] pointer-events-none -translate-y-1/2 -z-10" />
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-secondary/5 blur-[120px] pointer-events-none -translate-y-1/2 -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex flex-col gap-3 items-center md:items-start text-center md:text-left">
          <span className="font-display text-3xl font-bold tracking-tighter text-on-surface">Sign2Sign</span>
          <span className="font-body text-sm text-on-surface-variant/40 tracking-wide font-light">
            © 2026 Sign2Sign AI. Experience Connect
          </span>
        </div>

        <nav className="flex flex-wrap justify-center gap-10">
          {["Privacy", "Terms", "Research", "Contact"].map((link) => (
            <a 
              key={link} 
              href="#" 
              className="font-body text-sm text-on-surface-variant/50 hover:text-primary transition-colors duration-300 font-medium"
            >
              {link}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
