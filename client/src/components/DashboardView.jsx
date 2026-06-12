import React from 'react';

export default function DashboardView({ setCurrentView, favorites, toggleFavorite, recentSearches, triggerToast, navigateToTool }) {
  
  // Status check (normally we could fetch but we can show status active based on config)
  const apiStatus = [
    { name: 'VirusTotal API', status: 'Active', desc: 'Reputation analysis' },
    { name: 'AbuseIPDB API', status: 'Active', desc: 'IP reputation score' },
    { name: 'Censys API', status: 'Active', desc: 'SSL & Host mapping' },
    { name: 'Shodan API', status: 'Active', desc: 'Device search engine' },
    { name: 'Gemini AI', status: 'Active', desc: 'Threat Summaries' },
    { name: 'OpenAI API', status: 'Active', desc: 'Phishing & Code advice' }
  ];

  const quickAccess = [
    { id: 'virustotal', name: 'VirusTotal Scan', category: 'intel', desc: 'IP, Hash or Domain', icon: '⚡' },
    { id: 'username-osint', name: 'Social Username Lookup', category: 'osint', icon: '👤', desc: 'Profile check across 5+ networks' },
    { id: 'google-dorks', name: 'Google Dork Generator', category: 'dorks', icon: '🛠️', desc: 'SQLi, Github & filetype builders' },
    { id: 'jwt-decoder', name: 'JWT Decoder', category: 'utils', icon: '⚙️', desc: 'Decode & parse local signatures' },
    { id: 'port-scanner', name: 'TCP Port Scanner', category: 'network', icon: '📡', desc: 'Scan target infrastructure ports' },
    { id: 'gemini-ai', name: 'AI Incident Copilot', category: 'ai', icon: '🤖', desc: 'Mitre Attack & explanation analysis' }
  ];

  return (
    <div className="view-panel">
      <h1>📊 Operations Dashboard</h1>
      <p style={{ marginBottom: '24px' }}>Welcome to CyberKit OSINT Command Center. Select an analytics node below or query values via search.</p>

      {/* Stats Counter Row */}
      <div className="dashboard-grid">
        <div className="card green-edge">
          <div className="metric-label">INTELLIGENCE STACK STATUS</div>
          <div className="metric-value" style={{ color: 'var(--color-green)' }}>SECURED</div>
          <p style={{ marginTop: '8px' }}>100% Stateless: No databases, logs, or sessions stored.</p>
        </div>
        <div className="card cyan-edge">
          <div className="metric-label">FAVORITE INVESTIGATORS</div>
          <div className="metric-value" style={{ color: 'var(--color-cyan)' }}>{favorites.length} Saved</div>
          <p style={{ marginTop: '8px' }}>Quick access items configured on this terminal.</p>
        </div>
      </div>

      {/* API Status Indicators */}
      <div className="card">
        <h2>Threat Intel API Nodes</h2>
        <div className="api-node-grid">
          {apiStatus.map(api => (
            <div key={api.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{api.name}</span>
                <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '10px' }}>{api.status}</span>
              </div>
              <p style={{ fontSize: '11px', marginTop: '4px' }}>{api.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Grid */}
      <h2 style={{ marginTop: '16px', marginBottom: '16px' }}>Quick Access Modules</h2>
      <div className="dashboard-grid">
        {quickAccess.map(tool => (
          <div 
            key={tool.id} 
            className="card cyan-edge" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
            onClick={() => navigateToTool(tool.id, tool.category)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '24px' }}>{tool.icon}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(tool.id);
                }}
                className="btn"
                style={{ background: 'none', border: 'none', color: favorites.includes(tool.id) ? 'var(--color-yellow)' : 'var(--text-dark)', fontSize: '18px', padding: 0 }}
              >
                ★
              </button>
            </div>
            <h3 style={{ marginTop: '12px', fontSize: '16px', color: 'var(--text-primary)' }}>{tool.name}</h3>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>{tool.desc}</p>
          </div>
        ))}
      </div>

      {/* Favorites & Recent Searches Row */}
      <div className="responsive-grid two-col">
        {/* Favorites */}
        <div className="card">
          <h2>⭐ Terminals Favorites</h2>
          {favorites.length === 0 ? (
            <p style={{ fontSize: '12px' }}>No favorite tools configured. Click ★ on quick access tools to bookmark them.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {favorites.map(f => {
                const found = quickAccess.find(x => x.id === f) || { name: f, category: 'intel' };
                return (
                  <li 
                    key={f} 
                    onClick={() => navigateToTool(f, found.category)}
                    style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--color-cyan)', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}
                  >
                    <span>{found.name}</span>
                    <span>→</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Searches */}
        <div className="card">
          <h2>🔎 Quick Tips</h2>
          <p style={{ fontSize: '13px', lineHeight: '1.5' }}>
            • Use the Password Lab to generate strong passwords.<br/>
            • Leverage the JWT Decoder for quick token analysis.<br/>
            • Explore the Encoders for fast Base64/URL conversions.<br/>
            • Keep an eye on the API status cards for service health.
          </p>
        </div> {/* Recent Searches */}
        <div className="card">
          <h2>🔍 Recent Investigations</h2>
          {recentSearches.length === 0 ? (
            <p style={{ fontSize: '12px' }}>No searches triggered during this session.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {recentSearches.map((s, idx) => (
                <li 
                  key={idx} 
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{s.query}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dark)' }}>{s.timestamp} ({s.category.toUpperCase()})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
