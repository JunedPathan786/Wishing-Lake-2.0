import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import { Sparkles, ArrowDown, Heart, Users, Zap, Shield, Wand2, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HERO_BG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/551640e87425f247df4ff054683acfcf0b32ec86d8781185480bd73c4b340037.png';
const ORB_IMG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/14f585043dd5f541c93a9002f48c4fe5e53106e673238d3b2b2b573d1567ba33.png';



function ThreeLakeScene() {
  return (
    <>
      <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#FDE047" />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#38BDF8" />
    </>
  );
}

const FEATURES = [
  {
    icon: Heart,
    title: 'Share Your Wishes',
    desc: 'Drop your deepest desires into the lake and let the community see what your heart needs.',
    color: '#FBBF24',
  },
  {
    icon: Users,
    title: 'Fulfill Others',
    desc: 'Become a guardian angel. Find wishes you can make real and change someone\'s story.',
    color: '#38BDF8',
  },
  {
    icon: Wand2,
    title: 'Wish Oracle',
    desc: 'Our mystical AI Oracle analyzes your wish, reads the emotion, and guides you toward fulfillment.',
    color: '#A78BFA',
  },
  {
    icon: MessageCircle,
    title: 'Sacred Chat',
    desc: 'Connect privately with wish-fulfillers through our permission-based, secure messaging.',
    color: '#34D399',
  },
  {
    icon: Shield,
    title: 'Safe & Moderated',
    desc: 'Every wish is reviewed. Every connection is consensual. The lake is always a safe space.',
    color: '#FB923C',
  },
  {
    icon: Zap,
    title: 'Earn Karma',
    desc: 'Fulfill wishes, earn karma points, unlock badges. Be rewarded for every act of kindness.',
    color: '#F87171',
  },
];

const TESTIMONIALS = [
  { name: 'Aria K.', text: 'Someone fulfilled my wish to find a mentor in 3 days. I cried happy tears.', emotion: '✨', role: 'Designer' },
  { name: 'Noa R.', text: 'Being a wish-fulfiller gave me more joy than any gift I\'ve ever received.', emotion: '💛', role: 'Teacher' },
  { name: 'Lena M.', text: 'The Oracle told me exactly what steps to take. My wish came true in a month.', emotion: '🔮', role: 'Student' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 -z-10">
          <img src={HERO_BG} alt="Wishing Lake" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-lake-bg" />
        </motion.div>

        {/* Three.js canvas overlay */}
        <div className="absolute inset-0 -z-5 pointer-events-none">
          <Suspense fallback={null}>
            <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
              <ThreeLakeScene />
            </Canvas>
          </Suspense>
        </div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 badge mb-8 px-5 py-2 text-sm"
            style={{ borderColor: 'rgba(253,224,71,0.3)', background: 'rgba(253,224,71,0.08)' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-gold font-body">The Wishing Lake is open</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-tighter leading-none mb-6"
          >
            Welcome to the
            <br />
            <span className="gradient-gold italic">Magical Wishing Lake</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-slate-300 text-md md:text-xl font-body font-light max-w-3xl mx-auto mb-16 leading-relaxed"
       
          >
          step into the world of <span className="gradient-gold italic">The Wishing Lake</span>, where every whispered wish sinks like a coin and every act of kindness returns as shimmering ripples. <span className="gradient-gold italic">Magic and wishes come true.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to={isAuthenticated ? '/lake' : '/signup'}
              className="btn-primary text-base px-10 py-4 animate-pulse-glow"
              data-testid="dare-to-wish-button"
            >
              <Sparkles className="w-5 h-5" />
              Dare to Wish
            </Link>
            <Link to="/lake" className="btn-ghost text-base px-8 py-4">
              Explore the Lake
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-8 mt-16 text-center"
          >
            {[
              { value: '12K+', label: 'Wishes Made' },
              { value: '8K+', label: 'Fulfilled' },
              { value: '4K+', label: 'Kind Souls' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="font-heading text-3xl gradient-gold">{value}</span>
                <span className="text-xs font-body text-slate-500 tracking-widest uppercase mt-1">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="w-5 h-5 text-slate-500" />
        </motion.div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <section className="relative py-32 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="label text-gold mb-3">How it works</p>
            <h2 className="section-heading">A Lake Full of <span className="gradient-gold italic">Magic</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="glass-card p-6 rounded-2xl group"
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="font-heading text-xl text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 font-body leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="label text-gold mb-3">Real stories</p>
          <h2 className="section-heading mb-12">Wishes That <span className="gradient-silver italic">Came True</span></h2>

          <div className="relative h-48">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 glass rounded-3xl p-8 flex flex-col items-center justify-center"
              >
                <span className="text-3xl mb-4">{TESTIMONIALS[activeTestimonial].emotion}</span>
                <p className="font-heading text-xl text-white italic mb-4 max-w-lg">
                  "{TESTIMONIALS[activeTestimonial].text}"
                </p>
                <p className="text-sm text-slate-500 font-body">
                  — {TESTIMONIALS[activeTestimonial].name}, {TESTIMONIALS[activeTestimonial].role}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeTestimonial ? 'bg-gold w-6' : 'bg-slate-700'
                }`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative glass rounded-3xl p-12 md:p-16 text-center overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 -z-10"
              style={{ background: 'radial-gradient(ellipse at center, rgba(253,224,71,0.08) 0%, transparent 70%)' }} />

            <span className="text-5xl block mb-6">🌙</span>
            <h2 className="font-heading text-4xl md:text-5xl text-white tracking-tighter mb-4">
              Your Wish Is Waiting
            </h2>
            <p className="text-slate-400 font-body text-lg mb-10 max-w-xl mx-auto">
              Every wish dropped in the lake creates a ripple. Join thousands of dreamers and wish-makers.
            </p>
            <Link to={isAuthenticated ? '/lake' : '/signup'}
              className="btn-primary text-base px-12 py-4 inline-flex">
              <Sparkles className="w-5 h-5" />
              {isAuthenticated ? 'Drop a Wish' : 'Join the Lake — It\'s Free'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="font-heading text-lg text-white">Wishing Lake</span>
          </div>
          <p className="text-xs text-slate-600 font-body">
            © {new Date().getFullYear()} Wishing Lake of Smiles. Made with 💛
          </p>
          <div className="flex gap-6 text-xs text-slate-600 font-body">
            <Link to="/lake" className="hover:text-slate-400 transition-colors">The Lake</Link>
            <Link to="/signup" className="hover:text-slate-400 transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
