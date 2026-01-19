import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Products', items: ['Feature One', 'Feature Two', 'Feature Three'] },
    { name: 'Solutions', items: ['Enterprise', 'Startups', 'Education'] },
    { name: 'Resources', items: ['Documentation', 'Blog', 'Support'] },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'py-6'}`}>
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#" className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex-center">
              <div className="w-4 h-4 bg-black rounded-sm" />
            </div>
            ROOOM
          </a>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <div
                key={item.name}
                onMouseEnter={() => setActiveMenu(item.name)}
                onMouseLeave={() => setActiveMenu(null)}
                className="relative cursor-pointer py-2"
              >
                <span className="flex items-center gap-1 text-sm font-medium hover:text-white transition-colors">
                  {item.name} <ChevronDown size={14} />
                </span>

                <AnimatePresence>
                  {activeMenu === item.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 w-48 glass rounded-xl p-3 mt-2"
                    >
                      {item.items.map((subItem) => (
                        <div key={subItem} className="p-2 text-sm hover:bg-white/10 rounded-lg transition-colors">
                          {subItem}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="btn btn-secondary text-sm hidden sm:block">Log in</button>
          <button className="btn btn-primary text-sm">Join now</button>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="section min-h-screen flex items-center pt-24 relative overflow-hidden">
      <div className="container relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="glass px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6 inline-block">
            Introducing ROOOM 2.0
          </span>
          <h1 className="text-6xl md:text-8xl mb-8 leading-[0.9]">
            Design that <br />
            <span className="text-white/40">moves with you.</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg md:text-xl mb-12">
            A premium workspace for the next generation of creative minds.
            Built for speed, styled for impact.
          </p>
          <div className="flex flex-center gap-4">
            <button className="btn btn-primary px-10 py-4 text-lg group">
              Get Started
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn btn-secondary px-10 py-4 text-lg">
              Watch Demo
            </button>
          </div>
        </motion.div>
      </div>

      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 translate-x-half translate-y-half w-[800px] h-[800px] bg-accent-overlay blur-hero rounded-full -z-10" />
    </section>
  );
};

const Features = () => {
  const items = [
    { icon: <Zap size={24} />, title: 'Incredible Speed', desc: 'Optimized for performance with Zero latency architecture.' },
    { icon: <Shield size={24} />, title: 'Secure by Design', desc: 'Enterprise-grade encryption for all your creative assets.' },
    { icon: <Sparkles size={24} />, title: 'Magical Experience', desc: 'Intuitive micro-interactions that make you smile.' },
  ];

  return (
    <section className="section bg-secondary">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="glass p-8 rounded-3xl"
            >
              <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex-center mb-6">
                {item.icon}
              </div>
              <h3 className="text-2xl mb-4">{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

function App() {
  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <Features />

      <footer className="py-12 border-t border-glass-border">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm text-text-secondary">
            © 2026 ROOOM Studio. All rights reserved.
          </div>
          <div className="flex gap-8 text-sm text-text-secondary">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
