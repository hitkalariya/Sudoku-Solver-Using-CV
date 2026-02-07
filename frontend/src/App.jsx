import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Grid, Cpu, CheckCircle, Clock, Sparkles, Eye, Download, Camera } from 'lucide-react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, solved
  const [history, setHistory] = useState([
    { id: 1, date: '2026-02-05', time: '14:20', preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200', difficulty: 'Expert' },
    { id: 2, date: '2026-02-04', time: '09:15', preview: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200', difficulty: 'Hard' }
  ]);

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSolve = () => {
    if (!file) return;
    setStatus('processing');

    setTimeout(() => {
      const newSolve = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        preview: preview,
        difficulty: 'Medium'
      };
      setHistory(prev => [newSolve, ...prev]);
      setStatus('solved');
    }, 4000);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setStatus('idle');
  };

  return (
    <div className="premium-container">
      {/* Header */}
      <header className="hero-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="subtitle animate-glow">The Pinnacle of Logic</p>
          <h1>Sudoku <span className="luxury-italic luxury-font">Vision</span></h1>
          <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.2rem', color: 'rgba(245, 245, 240, 0.7)' }}>
            An exquisite computer vision experience, transcribing complexity into clarity.
          </p>
        </motion.div>
      </header>

      {/* Main Solver Card */}
      <main>
        <motion.div
          className="luxury-card"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getRootProps()}
                className="dropzone-luxury"
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload size={40} strokeWidth={1} style={{ color: 'var(--accent-gold)' }} />
                </motion.div>
                <h2 className="luxury-font" style={{ marginTop: '1.5rem', fontWeight: 400 }}>
                  Present Your <span className="luxury-italic">Puzzle</span>
                </h2>
                <p style={{ color: 'rgba(245, 245, 240, 0.5)', marginTop: '0.5rem' }}>
                  Drop the image within these borders
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="preview-section"
                style={{ textAlign: 'center' }}
              >
                <div style={{ position: 'relative', maxWidth: '450px', margin: '0 auto' }}>
                  <img src={preview} alt="Puzzle" style={{ width: '100%', border: '1px solid var(--accent-gold)' }} />
                  {status === 'idle' && (
                    <button onClick={removeImage} style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'var(--bg-primary)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '5px', borderRadius: '50%', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  )}

                  {status === 'processing' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles size={40} color="var(--accent-gold)" />
                      </motion.div>
                      <p className="luxury-font" style={{ marginTop: '1rem', letterSpacing: '0.2em', color: 'var(--accent-gold)' }}>ORCHESTRATING SOLUTION</p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '3rem' }}>
                  {status === 'idle' && (
                    <button className="gold-btn" onClick={handleSolve}>
                      Transcribe & Solve
                    </button>
                  )}
                  {status === 'solved' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="luxury-font" style={{ color: 'var(--accent-gold)', fontSize: '1.5rem' }}>Success <CheckCircle size={20} /></p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                        <button className="gold-btn" style={{ fontSize: '0.9rem' }} onClick={() => setStatus('idle')}>New Request</button>
                        <button className="gold-btn" style={{ fontSize: '0.9rem' }}><Download size={14} /> Export Grid</button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* History Section */}
        <section className="history-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <Clock size={24} color="var(--accent-gold)" />
            <h2 className="luxury-font" style={{ fontSize: '2.5rem', fontWeight: 400 }}>
              Past <span className="luxury-italic">Histories</span>
            </h2>
          </div>

          <div className="history-grid">
            {history.map((item) => (
              <motion.div
                key={item.id}
                className="history-item"
                whileHover={{ scale: 1.02 }}
              >
                <img src={item.preview} className="history-thumb" alt="History" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.date} at {item.time}</p>
                    <p className="luxury-font" style={{ color: 'var(--accent-gold)' }}>{item.difficulty} Level</p>
                  </div>
                  <Eye size={18} style={{ opacity: 0.4, cursor: 'pointer' }} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Future Features (Luxury Style) */}
      <section className="features-section">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="subtitle" style={{ color: 'var(--accent-forest)' }}>Evolution</p>
          <h2 className="luxury-font" style={{ fontSize: '3rem', color: 'var(--text-dark)' }}>
            The Future of <span className="luxury-italic">Sudoku Vision</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
          <FutureFeatureCard
            icon={<Camera />}
            title="Real-time Perception"
            description="Live grid detection directly from your camera feed, solving as you watch."
            tag="Coming Soon"
          />
          <FutureFeatureCard
            icon={<Sparkles />}
            title="The Mentor"
            description="Intelligent hints that explain 'why' a move is made, not just 'what'."
            tag="In Development"
          />
          <FutureFeatureCard
            icon={<Grid />}
            title="Handwriting Synthesis"
            description="Advanced OCR capable of reading even the most artistic handwritten digits."
            tag="Alpha"
          />
        </div>
      </section>

      <footer style={{ padding: '6rem 0', textAlign: 'center', color: 'rgba(245, 245, 240, 0.4)', borderTop: '1px solid rgba(245, 245, 240, 0.05)', marginTop: '5rem' }}>
        <p className="luxury-font">EST. 2026 — SUDOKU VISION CURATED FOR EXCELLENCE</p>
      </footer>
    </div>
  );
}

function FutureFeatureCard({ icon, title, description, tag }) {
  return (
    <div style={{ border: '1px solid rgba(26,26,26,0.1)', padding: '2.5rem', transition: 'all 0.4s' }}>
      <span className="feature-tag">{tag}</span>
      <div style={{ color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>{icon}</div>
      <h3 className="luxury-font" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-dark)' }}>{title}</h3>
      <p style={{ color: 'rgba(26,26,26,0.6)', fontSize: '0.95rem' }}>{description}</p>
    </div>
  );
}

export default App;
