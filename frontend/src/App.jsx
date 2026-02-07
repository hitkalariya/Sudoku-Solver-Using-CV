import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Grid, Cpu, CheckCircle, ArrowRight } from 'lucide-react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, solved

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

    // Simulate processing steps
    setTimeout(() => {
      // Future backend call would go here
      // For now, we simulate the UX flow
      setStatus('solved');
    }, 3000);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setStatus('idle');
  };

  return (
    <div className="premium-container">
      <header className="hero-section fade-in">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Sudoku <span style={{ color: 'var(--accent-primary)' }}>Vision</span></h1>
          <p className="subtitle">
            Upload your Sudoku puzzle and let our advanced AI vision solve it instantly with precision.
          </p>
        </motion.div>
      </header>

      <main>
        <div className="glass-card fade-in" style={{ animationDelay: '0.2s' }}>
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Upload className="upload-icon" />
                </motion.div>
                <h3>{isDragActive ? "Drop it here!" : "Upload Sudoku Image"}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Drag & drop or click to browse (PNG, JPG)
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="preview-section"
                style={{ textAlign: 'center' }}
              >
                <div className="preview-container">
                  <img src={preview} alt="Sudoku Preview" className="image-preview" />
                  {status === 'idle' && (
                    <button className="remove-btn" onClick={removeImage}>
                      <X size={18} />
                    </button>
                  )}

                  {status === 'processing' && (
                    <motion.div
                      className="processing-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Cpu className="upload-icon" />
                      </motion.div>
                      <p style={{ marginTop: '1rem', fontWeight: 600 }}>Analyzing Grid...</p>
                    </motion.div>
                  )}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  {status === 'idle' && (
                    <button className="btn-premium" onClick={handleSolve}>
                      Identify & Solve
                    </button>
                  )}
                  {status === 'solved' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', color: '#10b981', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
                        <CheckCircle /> Solution Ready!
                      </div>
                      <button className="btn-premium" style={{ marginTop: '1rem' }} onClick={() => setStatus('idle')}>
                        Try Another
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section className="features-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '4rem'
        }}>
          <FeatureCard
            icon={<Grid />}
            title="Grid Detection"
            description="Our neural networks pinpoint the Sudoku box even in cluttered backgrounds."
            delay="0.4s"
          />
          <FeatureCard
            icon={<Cpu />}
            title="Smart OCR"
            description="High-accuracy digit recognition powered by modern Computer Vision."
            delay="0.5s"
          />
          <FeatureCard
            icon={<CheckCircle />}
            title="Instant Solve"
            description="Efficient backtracking algorithms find the valid solution in milliseconds."
            delay="0.6s"
          />
        </section>
      </main>

      <footer style={{ marginTop: 'auto', padding: '4rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>© 2026 Sudoku Vision CV. Built for high performance.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }) {
  return (
    <motion.div
      className="glass-card"
      style={{ padding: '2rem', animationDelay: delay }}
      whileHover={{ y: -5 }}
    >
      <div style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>
        {icon}
      </div>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
    </motion.div>
  );
}

export default App;
