import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Grid, Cpu, CheckCircle, Clock, Sparkles, Eye, Download, Camera, Layout, Layers } from 'lucide-react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle');
  const [steps, setSteps] = useState(null);
  const [board, setBoard] = useState(null);
  const [solution, setSolution] = useState(null);
  const [showSteps, setShowSteps] = useState(false);
  const [history, setHistory] = useState([
    { id: 1, date: 'Feb 5', time: '14:20', preview: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=200', difficulty: 'Hard' },
    { id: 2, date: 'Feb 4', time: '09:15', preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200', difficulty: 'Medium' }
  ]);

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus('ready');
      setSteps(null);
      setBoard(null);
      setSolution(null);
      setShowSteps(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSolve = async () => {
    if (!file) return;

    setStatus('processing');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/extract-sudoku', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPreview(data.image_data); // Show the extracted grid as the main preview
        setSteps(data.steps);       // Store intermediate steps
        setBoard(data.board);       // Store extracted board
        setStatus('solved');

        // Add to history
        const newSolve = {
          id: Date.now(),
          date: 'Today',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          preview: data.image_data,
          difficulty: 'Extracted'
        };
        setHistory([newSolve, ...history]);
      } else {
        console.error('Extraction failed:', data.error);
        alert('Failed to extract Sudoku: ' + data.error);
        setStatus('ready');
        if (data.steps) setSteps(data.steps); // Show steps even on failure if available
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server.');
      setStatus('ready');
    }
  };

  const handleSolvePuzzle = async () => {
    if (!board) return;

    setStatus('solving_logic');

    try {
      const response = await fetch('http://localhost:5000/api/solve-sudoku', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board }),
      });

      const data = await response.json();

      if (response.ok) {
        setSolution(data.solution);
        setStatus('fully_solved');

        // Update history if needed
      } else {
        alert('Failed to solve: ' + data.error);
        setStatus('solved'); // Go back to extracted state
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server.');
      setStatus('solved');
    }
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setSteps(null);
    setBoard(null);
    setSolution(null);
    setShowSteps(false);
  };

  return (
    <div className="app-container">
      {/* 1. Header Row */}
      <header className="header">
        <h1 className="logo">sudoku<span className="italic serif" style={{ color: 'var(--accent-gold)' }}>vision</span></h1>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>v1.0.0-Beta</span>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-gold)', border: '1px solid var(--accent-gold)' }}></div>
        </div>
      </header>

      {/* 2. Main Dashboard Grid */}
      <main className="dashboard-grid">

        {/* Left Panel: History */}
        <section className="panel">
          <div className="panel-header">
            <Clock size={16} color="var(--accent-gold)" />
            <span className="panel-title">Previous Insights</span>
          </div>
          <div className="panel-content">
            {history.map((item) => (
              <motion.div
                key={item.id}
                className="history-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <img src={item.preview} className="history-thumb" alt="History" />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.date}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.time}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>{item.difficulty}</span>
                    <Eye size={14} className="text-muted" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Center Panel: Main Solver */}
        <section className="panel solver-panel">
          {/* Main Action Area */}
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="dropzone"
                {...getRootProps()}
                className="dropzone-area animate-float"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <input {...getInputProps()} />
                <Upload size={64} color="var(--accent-gold)" strokeWidth={1} style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-main)' }} className="serif">
                  Initialize <span className="italic">Sequence</span>
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>Drag and drop or click to upload puzzle</p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                className="dropzone-area"
                style={{ border: 'none', background: 'transparent' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div style={{ position: 'relative', width: '100%', height: '80%', display: 'flex', justifyContent: 'center' }}>
                  <img src={preview} className="main-preview" alt="Solver Target" />

                  {status === 'processing' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass"
                      style={{
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', zIndex: 10
                      }}
                    >
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                        <Cpu size={80} color="var(--accent-gold)" strokeWidth={1} />
                      </motion.div>
                      <h3 style={{ marginTop: '2rem', letterSpacing: '0.2rem' }} className="serif">COMPUTING LOGIC</h3>
                    </motion.div>
                  )}

                  {/* Remove Button */}
                  {status !== 'processing' && (
                    <button
                      onClick={removeImage}
                      style={{
                        position: 'absolute', top: 20, right: 20, background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--accent-gold)', borderRadius: '50%', padding: '0.8rem', cursor: 'pointer', color: '#fff'
                      }}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  {status === 'ready' && (
                    <button className="btn-gold" onClick={handleSolve}>
                      Execute Solver
                    </button>
                  )}
                  {(status === 'solved' || (steps && status !== 'processing')) && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', color: '#4ade80', display: 'flex', gap: '0.5rem' }}>
                        <CheckCircle /> Extracted
                      </span>
                      {steps && (
                        <button className="btn-gold" onClick={() => setShowSteps(true)} style={{ fontSize: '0.9rem', padding: '0.8rem 2rem', display: 'flex', gap: '0.5rem' }}>
                          <Layers size={16} /> View Logic
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Extracted Board Debug */}
                {/* Extracted Board & Solver Interface */}
                {board && (
                  <div className="board-container" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

                    {board.flat().every(c => c === 0) && (
                      <div style={{ color: '#ff4d4d', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        ⚠️ No digits detected. Please check image clarity or type manually.
                      </div>
                    )}

                    <div className="board-grid" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(9, 1fr)',
                      gap: '2px',
                      background: 'var(--border-subtle)',
                      padding: '2px',
                      width: '100%',
                      maxWidth: '350px',
                      aspectRatio: '1',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      {(solution || board).flat().map((cell, idx) => {
                        const row = Math.floor(idx / 9);
                        const col = idx % 9;
                        const isOriginal = board[row][col] !== 0;
                        const value = (solution && solution[row][col]) || (board && board[row][col]);

                        return (
                          <div key={idx} style={{
                            background: isOriginal ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            {/* Input for editing before solve, or display after solve */}
                            {!solution ? (
                              <input
                                type="text"
                                maxLength="1"
                                value={value === 0 ? '' : value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^[1-9]$/.test(val)) {
                                    // Deep copy to avoid mutating state directly
                                    const newBoard = board.map(row => [...row]);
                                    newBoard[row][col] = val === '' ? 0 : parseInt(val);
                                    setBoard(newBoard);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  color: isOriginal ? 'var(--accent-gold)' : 'var(--text-main)',
                                  textAlign: 'center',
                                  fontSize: '1.2rem',
                                  fontWeight: 'bold',
                                  outline: 'none',
                                  caretColor: 'var(--accent-gold)'
                                }}
                              />
                            ) : (
                              <span style={{
                                color: isOriginal ? 'var(--accent-gold)' : '#4ade80',
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                              }}>
                                {value}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Solve Action */}
                    {!solution && status === 'solved' && (
                      <button className="btn-gold" onClick={handleSolvePuzzle} style={{ width: '100%' }}>
                        Solve Puzzle
                      </button>
                    )}

                    {solution && (
                      <div style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                        <CheckCircle size={20} /> Puzzle Solved!
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Panel: Features & Future */}
        <section className="panel">
          <div className="panel-header">
            <Sparkles size={16} color="var(--accent-gold)" />
            <span className="panel-title">System Evolution</span>
          </div>
          <div className="panel-content" style={{ padding: 0 }}>
            {/* Feature List */}
            {[
              { title: 'Real-time Vision', status: 'Coming Soon', desc: 'Live camera feed analysis with AR overlay.', icon: Camera },
              { title: 'The Mentor', status: 'In Dev', desc: 'AI reasoner to teach you the logic behind moves.', icon: Cpu },
              { title: 'Handwriting 2.0', status: 'Alpha', desc: 'Neural network tuned for artistic digits.', icon: Layout },
            ].map((feat, i) => (
              <div key={i} className="feature-item">
                <span className="status-badge" style={{ opacity: i === 0 ? 1 : 0.7 }}>{feat.status}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <feat.icon size={18} color="var(--accent-gold)" />
                  <h4 style={{ fontWeight: 500 }}>{feat.title}</h4>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{feat.desc}</p>
              </div>
            ))}

            <div style={{ padding: '1.5rem', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                System Status: <span style={{ color: '#4ade80' }}>Online</span>
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Steps Overlay Modal */}
      <AnimatePresence>
        {showSteps && steps && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSteps(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 className="serif" style={{ color: 'var(--accent-gold)' }}>Processing Logic</h2>
                <button onClick={() => setShowSteps(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
              </div>
              <div className="steps-grid">
                {Object.entries(steps).map(([name, imgSrc]) => (
                  <div key={name} className="step-card">
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem' }}>{name}</h4>
                    <img src={imgSrc} alt={name} style={{ width: '100%', borderRadius: '4px', border: '1px solid var(--border-subtle)' }} />
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default App;
