import React, { useState } from 'react';

export default function ThreatIntelView({ triggerToast, favorites, toggleFavorite, addRecentSearch }) {
  const [activeTab, setActiveTab] = useState('vt');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [targetType, setTargetType] = useState('ip'); // For VT sub-options: ip, domain, url, hash
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      triggerToast('Query value cannot be empty', 'warn', 'VALIDATION');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    addRecentSearch(query, activeTab);

    let endpoint = '';
    let payload = {};

    if (activeTab === 'vt') {
      endpoint = `/api/intel/vt/${targetType}`;
      payload = { [targetType]: query.trim() };
    } else if (activeTab === 'abuse') {
      endpoint = '/api/intel/abuse/check';
      payload = { ip: query.trim() };
    } else if (activeTab === 'censys') {
      endpoint = targetType === 'certs' ? '/api/intel/censys/certs' : '/api/intel/censys/host';
      payload = targetType === 'certs' ? { query: query.trim() } : { ip: query.trim() };
    } else if (activeTab === 'shodan') {
      if (targetType === 'banners') {
        endpoint = '/api/intel/shodan/banners';
        payload = { query: query.trim() };
      } else {
        endpoint = '/api/intel/shodan/host';
        payload = { ip: query.trim() };
      }
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
        triggerToast(data.error, 'danger', 'INTEL ERROR');
      } else {
        setResult(data.data || data);
        triggerToast('Intel lookup completed successfully', 'success', 'LOOKUP FINISHED');
      }
    } catch (err) {
      setError(err.message);
      triggerToast(err.message, 'danger', 'CONNECTION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view-panel">
      <h1>⚡ Threat Intelligence Search</h1>
      <p style={{ marginBottom: '20px' }}>Query professional databases including VirusTotal, AbuseIPDB, Censys, and Shodan.</p>

      {/* Sub Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'vt' ? 'active' : ''}`} onClick={() => { setActiveTab('vt'); setTargetType('ip'); setResult(null); setError(null); }}>VirusTotal</button>
        <button className={`tab-btn ${activeTab === 'abuse' ? 'active' : ''}`} onClick={() => { setActiveTab('abuse'); setTargetType('ip'); setResult(null); setError(null); }}>AbuseIPDB</button>
        <button className={`tab-btn ${activeTab === 'censys' ? 'active' : ''}`} onClick={() => { setActiveTab('censys'); setTargetType('ip'); setResult(null); setError(null); }}>Censys</button>
        <button className={`tab-btn ${activeTab === 'shodan' ? 'active' : ''}`} onClick={() => { setActiveTab('shodan'); setTargetType('ip'); setResult(null); setError(null); }}>Shodan</button>
      </div>

      <div className="card">
        <h2>{activeTab.toUpperCase()} Query Node</h2>
        <form onSubmit={handleLookup}>
          {/* Query Modifiers */}
          {activeTab === 'vt' && (
            <div className="form-group">
              <label>Lookup Category</label>
              <select className="input-control" value={targetType} onChange={(e) => setTargetType(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)', marginBottom: '12px' }}>
                <option value="ip">IP Reputation</option>
                <option value="domain">Domain Reputation</option>
                <option value="url">URL Reputation</option>
                <option value="hash">File Hash Reputation</option>
              </select>
            </div>
          )}

          {activeTab === 'censys' && (
            <div className="form-group">
              <label>Censys Scope</label>
              <select className="input-control" value={targetType} onChange={(e) => setTargetType(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)', marginBottom: '12px' }}>
                <option value="ip">Host / IP Search</option>
                <option value="certs">Certificate Search</option>
              </select>
            </div>
          )}

          {activeTab === 'shodan' && (
            <div className="form-group">
              <label>Shodan Query Type</label>
              <select className="input-control" value={targetType} onChange={(e) => setTargetType(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)', marginBottom: '12px' }}>
                <option value="ip">Device Details (IP)</option>
                <option value="banners">Banner Search Query</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Search Query Target</label>
            <input 
              type="text" 
              className="input-control" 
              placeholder={
                targetType === 'ip' ? 'e.g. 8.8.8.8' : 
                targetType === 'domain' ? 'e.g. google.com' : 
                targetType === 'hash' ? 'e.g. 44d88612fea8a8f36de82e1278abb02f' : 'e.g. query value'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-cyan" disabled={loading}>
            {loading ? 'Running Intel Query...' : '🔍 Execute Intel Check'}
          </button>
        </form>
      </div>

      {/* Results View */}
      {error && (
        <div className="card red-edge">
          <h3 style={{ color: 'var(--color-red)' }}>Lookup Failed</h3>
          <div className="code-box error">{error}</div>
        </div>
      )}

      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }} className="scanning-pulse">
          QUERYING REMOTE INTELLIGENCE DATABASE...
        </div>
      )}

      {result && (
        <div className="card green-edge">
          <h3 style={{ color: 'var(--color-green)', marginBottom: '12px' }}>Query Success (Stateless Result)</h3>
          <div className="code-box secure" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
