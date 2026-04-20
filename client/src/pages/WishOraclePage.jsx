import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Wand2, Sparkles, RefreshCw } from 'lucide-react';
import { aiAPI, wishAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ORB_IMG = 'https://static.prod-images.emergentagent.com/jobs/21c4ead7-8d22-49ca-8219-134df3c9901b/images/14f585043dd5f541c93a9002f48c4fe5e53106e673238d3b2b2b573d1567ba33.png';

const STARTER_PROMPTS = [
  "I have a wish but I don't know where to start.",
  "Help me understand the emotion behind my wish.",
  "What steps can I take to make my wish real?",
  "I feel stuck — can the Oracle guide me?",
];

export default function WishOraclePage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Greetings, ${user?.displayName || 'dear wisher'}. I am the Wish Oracle — keeper of the lake's deepest wisdom. The waters have been still, awaiting your question. What wish stirs within you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [myWishes, setMyWishes] = useState([]);
  const [selectedWish, setSelectedWish] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [tab, setTab] = useState('chat'); // chat | analyze | discover
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    wishAPI.getMyWishes({ limit: 10 })
      .then(({ data }) => setMyWishes(data?.data?.wishes || data?.wishes || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'discover') {
      setLoadingRecs(true);
      aiAPI.getRecommendations()
        .then(({ data }) => setRecommendations(data?.data?.recommendations || data?.recommendations || []))
        .catch((err) => {
          if (err.response?.status === 404) {
            setAiUnavailable(true);
            setRecommendations([]);
            return;
          }
          toast.error('Could not load recommendations', { className: 'toast-dark' });
        })
        .finally(() => setLoadingRecs(false));
    }
  }, [tab]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const context = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const { data } = await aiAPI.oracleChat(msg, context);
      setMessages(prev => [...prev, { role: 'assistant', content: data?.data?.reply || data?.reply || 'The Oracle whispers, but no clear message arrived.' }]);
    } catch (err) {
      if (err.response?.status === 404) {
        setAiUnavailable(true);
      }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'The Oracle\'s vision is briefly clouded. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWish = async (wish) => {
    setSelectedWish(wish);
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await aiAPI.analyzeWish(wish._id);
      setAnalysis(data?.data?.analysis || data?.analysis || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setAiUnavailable(true);
        return;
      }
      toast.error('Oracle analysis failed', { className: 'toast-dark' });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: `The waters reset, ${user?.displayName}. A new question, a new ripple. What shall we explore?`,
    }]);
  };

  return (
    <div className="page-container pb-20">
      {/* Header */}
      <div className="text-center mb-10">
        {aiUnavailable && (
          <div className="glass rounded-xl px-4 py-2 text-sm text-slate-300 inline-block mb-4">
            Oracle AI service is not available in the current backend build yet.
          </div>
        )}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block mb-4"
        >
          <img src={ORB_IMG} alt="Oracle" className="w-20 h-20 mx-auto"
            style={{ filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.7))' }} />
        </motion.div>
        <h1 className="font-heading text-4xl md:text-5xl text-white tracking-tighter mb-2">
          Wish <span className="gradient-silver italic">Oracle</span>
        </h1>
        <p className="text-slate-400 font-body text-sm">
          Ancient wisdom for modern wishes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-1 mb-8">
        {[
          { id: 'chat', label: '💬 Chat with Oracle', icon: Wand2 },
          { id: 'analyze', label: '🔮 Analyze My Wish', icon: Sparkles },
          { id: 'discover', label: '✨ Discover for Me', icon: RefreshCw },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-body transition-all ${
              tab === t.id
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Oracle Chat ─────────────────────────────────────────── */}
        {tab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto">
            <div className="glass rounded-3xl overflow-hidden">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                        <img src={ORB_IMG} alt="Oracle" className="w-full h-full object-contain"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' }} />
                      </div>
                    )}
                    <div className={`max-w-sm px-4 py-3 rounded-2xl text-sm font-body leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-gold to-gold-muted text-lake-bg rounded-br-sm'
                        : 'bg-white/8 text-slate-100 border border-white/5 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img src={ORB_IMG} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="px-4 py-3 bg-white/8 rounded-2xl rounded-bl-sm border border-white/5">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-purple-400/60 rounded-full"
                            animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Starter prompts */}
              {messages.length === 1 && (
                <div className="px-6 pb-3 flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map(p => (
                    <button key={p} onClick={() => sendMessage(p)}
                      className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all font-body">
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-white/10 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Ask the Oracle..."
                  className="input-field flex-1"
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="btn-primary px-4 py-2.5 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #A78BFA, #818CF8)' }}>
                  <Send className="w-4 h-4" />
                </button>
                <button onClick={resetChat} className="btn-ghost px-3 py-2.5" title="Reset">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Analyze My Wish ─────────────────────────────────────── */}
        {tab === 'analyze' && (
          <motion.div key="analyze" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto space-y-6">
            <div className="glass rounded-3xl p-6">
              <p className="label text-gold mb-3">Choose a wish to analyze</p>
              {myWishes.length === 0 ? (
                <p className="text-slate-500 font-body text-sm text-center py-8">You haven't made any wishes yet.</p>
              ) : (
                <div className="space-y-2">
                  {myWishes.map(wish => (
                    <button key={wish._id} onClick={() => analyzeWish(wish)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedWish?._id === wish._id
                          ? 'border-gold/40 bg-gold/8'
                          : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                      }`}>
                      <p className="text-sm font-medium text-white font-body">{wish.title}</p>
                      <p className="text-xs text-slate-500 font-body mt-0.5">{wish.emotion} • {wish.category}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Analysis result */}
            <AnimatePresence>
              {(analyzing || analysis) && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="glass rounded-3xl p-8">
                  {analyzing ? (
                    <div className="flex flex-col items-center py-8">
                      <motion.img src={ORB_IMG} alt="Oracle" className="w-16 h-16 mb-4"
                        animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        style={{ filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.6))' }} />
                      <p className="font-heading text-xl text-slate-300">The Oracle reads the waters...</p>
                    </div>
                  ) : analysis && (
                    <>
                      <h3 className="font-heading text-2xl text-white mb-4">Oracle's Vision</h3>
                      <div className="glass-card p-5 rounded-xl mb-6">
                        <p className="text-slate-300 font-body leading-relaxed italic">"{analysis.oracleMessage}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="label text-slate-400 mb-2">Detected Emotion</p>
                          <p className="text-white font-body capitalize">{analysis.sentiment}</p>
                        </div>
                        <div>
                          <p className="label text-slate-400 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.tags?.map(tag => (
                              <span key={tag} className="badge text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {analysis.suggestedActions?.length > 0 && (
                        <div>
                          <p className="label text-gold mb-3">Steps to fulfillment</p>
                          <div className="space-y-2">
                            {analysis.suggestedActions.map((action, i) => (
                              <div key={i} className="flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-gold/15 text-gold text-xs font-body font-medium flex items-center justify-center flex-shrink-0">
                                  {i + 1}
                                </span>
                                <p className="text-sm text-slate-300 font-body leading-relaxed">{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── Discover Recommendations ─────────────────────────────── */}
        {tab === 'discover' && (
          <motion.div key="discover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="text-center text-slate-400 font-body text-sm mb-6">
              The Oracle has matched these wishes to your spirit ✨
            </p>
            {loadingRecs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-48" />)}
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-center text-slate-600 font-body py-16">No recommendations yet. Make some wishes first!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map(wish => (
                  <div key={wish._id} className="glass-card p-5 rounded-2xl">
                    <p className="text-xs text-slate-500 font-body uppercase tracking-widest mb-2">{wish.emotion}</p>
                    <h3 className="font-heading text-lg text-white mb-2">{wish.title}</h3>
                    <p className="text-sm text-slate-400 font-body line-clamp-2 mb-4">{wish.description}</p>
                    <button className="btn-primary w-full justify-center text-sm py-2">
                      <Sparkles className="w-3.5 h-3.5" /> Offer to Fulfill
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
