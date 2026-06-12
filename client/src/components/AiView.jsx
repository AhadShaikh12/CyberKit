import React, { useState } from 'react';

export default function AiView({ triggerToast, favorites, toggleFavorite }) {
  const [engine, setEngine] = useState('gemini');
  const [task, setTask] = useState('advisor');
  const [inputData, setInputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputData.trim()) {
      triggerToast('Instruction parameter is required', 'warn', 'VALIDATION');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);

    // Formulate a structured prompt depending on the chosen task
    let prompt = '';
    if (task === 'advisor') {
      prompt = `Provide security recommendations and advice regarding the following scenario: ${inputData}`;
    } else if (task === 'ioc') {
      prompt = `Explain the following Indicator of Compromise (IOC) and details: ${inputData}. Map it to MITRE ATT&CK if possible.`;
    } else if (task === 'malware') {
      prompt = `Provide a detailed explanation and analysis of the following malware behavior/logs: ${inputData}`;
    } else if (task === 'phishing') {
      prompt = `Analyze this email content/headers for phishing flags: ${inputData}`;
    } else {
      prompt = `Analyze the risks of the following URL/Domain and provide advice: ${inputData}`;
    }

    const endpoint = engine === 'gemini' ? '/api/intel/ai/gemini' : '/api/intel/ai/openai';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (data.success === false) {
        setError(data.error);
        triggerToast(data.error, 'danger', 'AI ERROR');
      } else {
        setResult(data.text);
        triggerToast('AI analysis completed successfully', 'success', 'COPILOT DONE');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-panel">
      <h1>🤖 AI Cyber Copilot</h1>
      <p style={{ marginBottom: '20px' }}>Employ Gemini or OpenAI model endpoints to explain malware signatures, analyze headers, or parse risk events.</p>

      <div className="card">
        <h2>Model Operations Panel</h2>
        <form onSubmit={handleSubmit}>
          <div className="responsive-grid two-col compact" style={{ marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>CO-PILOT ENGINE</label>
              <select className="input-control" value={engine} onChange={(e) => setEngine(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <option value="gemini">Google Gemini 1.5 Flash</option>
                <option value="openai">OpenAI GPT-4o-Mini</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>SECURITY TASK</label>
              <select className="input-control" value={task} onChange={(e) => setTask(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <option value="advisor">Security Advisor / Recommendations</option>
                <option value="ioc">IOC Explanation & MITRE Map</option>
                <option value="malware">Malware Explainer</option>
                <option value="phishing">Phishing Email Analysis</option>
                <option value="url">URL Risk Analysis</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Intel / Logs Input payload</label>
            <textarea 
              className="input-control" 
              rows="6" 
              placeholder="Paste logs, malicious emails, domain records or suspicious files content..." 
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-cyan" disabled={loading}>
            {loading ? 'AI Engine Processing...' : '🤖 Execute CyberCopilot Assessment'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }} className="scanning-pulse">
          INTERPRETING LOGS AND RUNNING CO-PILOT INFERENCE MODEL...
        </div>
      )}

      {error && (
        <div className="card red-edge">
          <h3 style={{ color: 'var(--color-red)' }}>Model Warning</h3>
          <div className="code-box error">{error}</div>
        </div>
      )}

      {result && (
        <div className="card green-edge">
          <h3 style={{ color: 'var(--color-green)', marginBottom: '12px' }}>AI Incident Response Result</h3>
          <div className="code-box secure" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
