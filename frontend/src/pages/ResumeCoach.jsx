import { useState } from 'react';
import { FaUpload, FaFileAlt, FaCheck, FaComments, FaChartPie, FaPaperPlane } from 'react-icons/fa';

function ResumeCoach() {
  const [resumeText, setResumeText] = useState("");
  const [targetJob, setTargetJob] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis"); // analysis, suggestions, chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      const response = await fetch('/api/resume/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setResumeText(data.text);
      } else {
        alert("Failed to parse file: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error parsing file.");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!resumeText.trim()) {
      alert("Please upload a resume or paste text first.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, target_job: targetJob })
      });
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
        setActiveTab("analysis");
      } else {
        alert("Failed to analyze: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error running analysis.");
    } finally {
      setLoading(false);
    }
  };

  const applyRewrite = (original, suggested) => {
    setResumeText(prev => prev.replace(original, suggested));
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newMessages = [...chatMessages, { role: 'user', text: chatInput }];
    setChatMessages(newMessages);
    const currentInput = chatInput;
    setChatInput("");
    
    try {
      const history = chatMessages.map(m => ({
        role: m.role,
        content: m.text
      }));
      
      const response = await fetch('/api/resume/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          history: history,
          resume_context: resumeText
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setChatMessages([...newMessages, { role: 'model', text: data.reply }]);
      } else {
        console.error("Chat error:", data.error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return '#f39c12'; // warning/orange
    return 'var(--error)';
  };

  return (
    <div className="app-container" style={{ maxWidth: '1400px' }}>
      <div className="glass-panel" style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <header>
          <h1>Virtual Resume Coach</h1>
          <p className="subtitle">Upload your resume to get instant, AI-powered feedback tailored to your target job.</p>
        </header>

        <div className="resume-workspace" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Left Side: Editor */}
          <div className="editor-section" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Resume Editor</h2>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr', marginBottom: '1rem' }}>
              <div className="input-group">
                <label>Target Role / Industry (Optional)</label>
                <input 
                  type="text" 
                  value={targetJob} 
                  onChange={e => setTargetJob(e.target.value)} 
                  placeholder="e.g. Warehouse Associate, Nurse, etc." 
                />
              </div>
              <div className="input-group">
                <label>Upload Resume</label>
                <label className="btn secondary-btn" style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer', justifyContent: 'center' }}>
                  <FaUpload /> Choose File (.pdf, .txt, .docx)
                  <input type="file" accept=".pdf,.txt,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
            <textarea 
              value={resumeText} 
              onChange={e => setResumeText(e.target.value)} 
              placeholder="Paste your resume text here, or upload a file above..." 
              style={{ width: '100%', flexGrow: 1, minHeight: '400px', resize: 'vertical', padding: '1rem', fontFamily: 'monospace' }}
            />
            <button className="btn primary-btn mt-2" onClick={runAnalysis} disabled={loading}>
              {loading ? "Processing..." : "Analyze Resume"}
            </button>
          </div>

          {/* Right Side: AI Assistant */}
          <div className="assistant-section" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="tab-headers" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '1rem' }}>
              <button 
                className={`btn ${activeTab === 'analysis' ? 'primary-btn' : 'secondary-btn'}`} 
                onClick={() => setActiveTab('analysis')}
                style={{ flex: 1, padding: '0.6rem' }}
              >
                <FaChartPie style={{ marginRight: '5px' }} /> Score
              </button>
              <button 
                className={`btn ${activeTab === 'suggestions' ? 'primary-btn' : 'secondary-btn'}`} 
                onClick={() => setActiveTab('suggestions')}
                style={{ flex: 1, padding: '0.6rem' }}
              >
                <FaCheck style={{ marginRight: '5px' }} /> Suggestions
              </button>
              <button 
                className={`btn ${activeTab === 'chat' ? 'primary-btn' : 'secondary-btn'}`} 
                onClick={() => setActiveTab('chat')}
                style={{ flex: 1, padding: '0.6rem' }}
              >
                <FaComments style={{ marginRight: '5px' }} /> Chat
              </button>
            </div>

            <div className="tab-content" style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '600px', paddingTop: '1rem' }}>
              {!analysis && activeTab !== 'chat' && (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '2rem' }}>
                  <FaFileAlt style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Run the analysis to see your scores and suggestions.</p>
                </div>
              )}

              {activeTab === 'analysis' && analysis && (
                <div className="analysis-tab">
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Overall Score</h3>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', color: getScoreColor(analysis.overall_score) }}>
                      {analysis.overall_score}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="score-card" style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Readability</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(analysis.readability_score) }}>{analysis.readability_score}</div>
                    </div>
                    <div className="score-card" style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Impact</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getScoreColor(analysis.impact_score) }}>{analysis.impact_score}</div>
                    </div>
                  </div>

                  <h4 style={{ color: 'var(--success)' }}>Strengths</h4>
                  <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-dark)' }}>
                    {analysis.strengths.map((s, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{s}</li>)}
                  </ul>
                  
                  <h4 style={{ color: 'var(--error)' }}>Areas for Improvement</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-dark)' }}>
                    {analysis.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{w}</li>)}
                  </ul>
                </div>
              )}

              {activeTab === 'suggestions' && analysis && (
                <div className="suggestions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {analysis.suggestions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-light)' }}>No rewrite suggestions right now!</p>
                  ) : (
                    analysis.suggestions.map((s, idx) => (
                      <div key={idx} className="suggestion-card" style={{ background: 'white', borderLeft: '4px solid var(--primary-color)', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'white', background: 'var(--primary-color)', display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '4px', marginBottom: '1rem' }}>
                          {s.section}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.3rem' }}>Original:</p>
                          <p style={{ textDecoration: 'line-through', color: '#7f8c8d' }}>{s.original}</p>
                        </div>
                        <div style={{ marginBottom: '1rem', background: 'rgba(46, 204, 113, 0.1)', padding: '1rem', borderRadius: '6px' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--success)', marginBottom: '0.3rem', fontWeight: 'bold' }}>Suggested Rewrite:</p>
                          <p style={{ color: '#27ae60' }}>{s.suggested}</p>
                        </div>
                        <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-light)', marginBottom: '1rem' }}>"{s.rationale}"</p>
                        <button className="btn secondary-btn" style={{ width: '100%', fontSize: '0.9rem' }} onClick={() => applyRewrite(s.original, s.suggested)}>
                          Apply Rewrite to Editor
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="chat-history" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                    {chatMessages.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '2rem' }}>
                        <FaComments style={{ fontSize: '2rem', opacity: 0.3, marginBottom: '1rem' }} />
                        <p>Ask the AI Coach a question about your resume!</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ 
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? 'var(--primary-color)' : '#e2e8f0',
                        color: msg.role === 'user' ? 'white' : '#1e293b',
                        padding: '1rem',
                        borderRadius: '12px',
                        borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                        borderBottomLeftRadius: msg.role === 'model' ? '2px' : '12px',
                        maxWidth: '85%',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}>
                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5', color: msg.role === 'user' ? 'white' : '#1e293b' }}>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="chat-input-area" style={{ display: 'flex', gap: '0.5rem', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      placeholder="Ask how to improve a section..." 
                      style={{ flexGrow: 1, border: 'none', background: 'transparent', outline: 'none' }}
                    />
                    <button onClick={sendChatMessage} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                      <FaPaperPlane />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResumeCoach;
