import React, { useState } from 'react';

export default function OsintView({ triggerToast, favorites, toggleFavorite, addRecentSearch }) {
  const [activeTab, setActiveTab] = useState('username');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // For Username Gen
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');

  const calculateEntropy = (str) => {
    if (!str) return 0;
    const freqs = {};
    for (let char of str) {
      freqs[char] = (freqs[char] || 0) + 1;
    }
    let entropy = 0;
    for (let char in freqs) {
      const p = freqs[char] / str.length;
      entropy -= p * Math.log2(p);
    }
    return entropy.toFixed(2);
  };

  const handleUsernameGen = () => {
    const rands = ['cyber', 'sec', 'root', 'admin', 'operator', 'net', 'lock', 'crypt'];
    const rand = rands[Math.floor(Math.random() * rands.length)];
    const generated = `${prefix || rand}_${suffix || Math.floor(Math.random() * 999)}`;
    setResult({
      generated,
      entropy: calculateEntropy(generated)
    });
    triggerToast('Generated mock username identity', 'success', 'OSINT IDENT');
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      triggerToast('Query is required', 'warn', 'VALIDATION');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    addRecentSearch(query, `osint-${activeTab}`);

    let endpoint = '';
    let payload = {};

    if (activeTab === 'username') {
      endpoint = '/api/intel/free/username';
      payload = { username: query.trim() };
    } else if (activeTab === 'email') {
      endpoint = '/api/intel/free/email';
      payload = { email: query.trim() };
    } else if (activeTab === 'domain') {
      endpoint = '/api/intel/free/whois';
      payload = { domain: query.trim() };
    } else if (activeTab === 'ip') {
      endpoint = '/api/intel/free/geo';
      payload = { ip: query.trim() };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success === false) {
        setError(data.error);
      } else {
        setResult(data.data || data);
        triggerToast('OSINT lookup complete', 'success', 'LOOKUP FINISHED');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-panel">
      <h1>🌍 OSINT Investigation Node</h1>
      <p style={{ marginBottom: '20px' }}>Extract public information regarding usernames, email structures, domain registrars, and IPv4 addresses.</p>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'username' ? 'active' : ''}`} onClick={() => { setActiveTab('username'); setQuery(''); setResult(null); setError(null); }}>Username investigation</button>
        <button className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`} onClick={() => { setActiveTab('email'); setQuery(''); setResult(null); setError(null); }}>Email OSINT</button>
        <button className={`tab-btn ${activeTab === 'domain' ? 'active' : ''}`} onClick={() => { setActiveTab('domain'); setQuery(''); setResult(null); setError(null); }}>Domain Intelligence</button>
        <button className={`tab-btn ${activeTab === 'ip' ? 'active' : ''}`} onClick={() => { setActiveTab('ip'); setQuery(''); setResult(null); setError(null); }}>IP Lookup</button>
      </div>

      <div className="card">
        <h2>{activeTab.toUpperCase()} Profiler</h2>
        
        {activeTab === 'username' && (
          <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <h3>Identity Generator</h3>
            <div className="responsive-form-row" style={{ marginTop: '12px' }}>
              <input type="text" placeholder="Prefix (optional)" className="input-control" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
              <input type="text" placeholder="Suffix (optional)" className="input-control" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
              <button type="button" className="btn btn-cyan" onClick={handleUsernameGen}>Generate</button>
            </div>
          </div>
        )}

        <form onSubmit={handleLookup}>
          <div className="form-group">
            <label>Target Query</label>
            <input 
              type="text" 
              className="input-control" 
              placeholder={
                activeTab === 'username' ? 'Enter username (e.g. root)' :
                activeTab === 'email' ? 'Enter email address (e.g. test@example.com)' :
                activeTab === 'domain' ? 'Enter domain (e.g. google.com)' : 'Enter IP address'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Performing OSINT Query...' : '🌍 Start Target Investigation'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }} className="scanning-pulse">
          AUDITING TARGET VIA OPEN-SOURCE CHANNELS...
        </div>
      )}

      {error && (
        <div className="card red-edge">
          <h3 style={{ color: 'var(--color-red)' }}>Search Error</h3>
          <div className="code-box error">{error}</div>
        </div>
      )}

      {result && (
        <div className="card green-edge">
          <h3 style={{ color: 'var(--color-green)', marginBottom: '12px' }}>OSINT Profile Output</h3>
          <div className="code-box secure" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
