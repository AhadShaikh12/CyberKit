import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import ThreatIntelView from './components/ThreatIntelView';
import OsintView from './components/OsintView';
import CryptoToolsView from './components/CryptoToolsView';
import DorkGenView from './components/DorkGenView';
import AiView from './components/AiView';
import NetworkToolsView from './components/NetworkToolsView';

// Central toast manager inside React state
let toastId = 0;

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberkit_favorites')) || [];
    } catch {
      return [];
    }
  });
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cyberkit_recents')) || [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    localStorage.setItem('cyberkit_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('cyberkit_recents', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const triggerToast = (message, type = 'info', title = 'SYSTEM') => {
    const id = toastId++;
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const toggleFavorite = (toolId) => {
    if (favorites.includes(toolId)) {
      setFavorites(prev => prev.filter(f => f !== toolId));
      triggerToast('Removed from favorites', 'info', 'FAVORITES');
    } else {
      setFavorites(prev => [...prev, toolId]);
      triggerToast('Added to favorites', 'success', 'FAVORITES');
    }
  };

  const addRecentSearch = (query, category) => {
    if (!query.trim()) return;
    const item = { query: query.trim(), category, timestamp: new Date().toLocaleTimeString() };
    setRecentSearches(prev => {
      const filtered = prev.filter(p => p.query !== item.query);
      return [item, ...filtered].slice(0, 10);
    });
  };

  // List of all tools for global search
  const tools = [
    { id: 'virustotal', name: 'VirusTotal Threat Scan', category: 'intel', desc: 'Scan IP, Domain, Hash or URL reputation' },
    { id: 'abuseipdb', name: 'AbuseIPDB Lookup', category: 'intel', desc: 'Verify IP report history and abuse score' },
    { id: 'censys', name: 'Censys Intel Search', category: 'intel', desc: 'Audit hosts, services, and SSL certs' },
    { id: 'shodan', name: 'Shodan Device Discovery', category: 'intel', desc: 'Identify open ports and banners' },
    { id: 'free-dns', name: 'DNS / MX / SPF / DKIM Record Lookup', category: 'osint', desc: 'Lookup DNS TXT records, SPF, and MX keys' },
    { id: 'whois', name: 'Domain WHOIS', category: 'osint', desc: 'Query registrar details' },
    { id: 'username-osint', name: 'Social Username Lookup', category: 'osint', desc: 'Search username availability across profiles' },
    { id: 'email-osint', name: 'Disposable Email & Gravatar Search', category: 'osint', desc: 'Analyze email risk profile' },
    { id: 'google-dorks', name: 'Google Dork Generator', category: 'dorks', desc: 'Build GitHub, OSINT, and SQLi dorks' },
    { id: 'command-builders', name: 'Command Builders', category: 'dorks', desc: 'Nmap, SQLMap and Shodan builder' },
    { id: 'jwt-decoder', name: 'JWT Decoder / Parser', category: 'utils', desc: 'Decode JSON Web Tokens' },
    { id: 'base64-url', name: 'Base64 & URL Encoder/Decoder', category: 'utils', desc: 'Encode or decode payloads' },
    { id: 'text-diff', name: 'Text Diff Utility', category: 'utils', desc: 'Compare text and find differences' },
    { id: 'regex-tester', name: 'Regex Tester', category: 'utils', desc: 'Evaluate regular expressions' },
    { id: 'port-scanner', name: 'Port Scanner UI', category: 'network', desc: 'Scan TCP ports of network nodes' },
    { id: 'cidr-calc', name: 'CIDR Calculator', category: 'network', desc: 'Calculate subnet masks' },
    { id: 'ping-tool', name: 'Ping Utility', category: 'network', desc: 'Perform live ICMP ping checks' },
    { id: 'gemini-ai', name: 'Gemini Copilot', category: 'ai', desc: 'AI Security advisor' },
    { id: 'openai-ai', name: 'OpenAI Threat Explainer', category: 'ai', desc: 'AI Malware and phishing analyst' }
  ];

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  const navigateToTool = (toolId, category) => {
    setCurrentView(category);
    setSidebarOpen(false);
    setSearchQuery('');
    setShowSearchResults(false);
    setTimeout(() => {
      const element = document.getElementById(toolId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.style.boxShadow = '0 0 20px var(--color-cyan-glow)';
        setTimeout(() => { element.style.boxShadow = ''; }, 2000);
      }
    }, 200);
  };

  const filteredTools = searchQuery.trim() 
    ? tools.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const changeView = (view) => {
    setCurrentView(view);
    setSidebarOpen(false);
  };

  return (
    <div id="app" className={sidebarOpen ? 'sidebar-open' : ''}>
      <header className="mobile-top-nav">
        <button
          type="button"
          className="hamburger-btn"
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(prev => !prev)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="mobile-brand">
          <span className="mobile-brand-icon">CK</span>
          <span>CyberKit</span>
        </div>
      </header>

      <button
        type="button"
        className="sidebar-backdrop"
        aria-label="Close navigation menu"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🛡️</div>
          <div className="logo-text">CyberKit</div>
          <div className="logo-version">OSINT</div>
        </div>

        <div className="user-profile" style={{ border: '1px solid var(--border-glow-cyan)' }}>
          <div className="user-avatar" style={{ border: '1px solid var(--color-cyan)' }}>CK</div>
          <div className="user-info">
            <span className="user-name">OPERATOR CONSOLE</span>
            <span className="user-status" style={{ color: 'var(--color-cyan)' }}>
              <span className="status-dot" style={{ backgroundColor: 'var(--color-cyan)', boxShadow: '0 0 8px var(--color-cyan)' }}></span>
              Intel Node Active
            </span>
          </div>
        </div>

        <nav className="nav-menu">
          <li className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => changeView('dashboard')}>
            📊 Dashboard
          </li>
          <li className={`nav-item ${currentView === 'intel' ? 'active' : ''}`} onClick={() => changeView('intel')}>
            ⚡ Threat Intelligence
          </li>
          <li className={`nav-item ${currentView === 'osint' ? 'active' : ''}`} onClick={() => changeView('osint')}>
            🌍 OSINT Investigations
          </li>
          <li className={`nav-item ${currentView === 'network' ? 'active' : ''}`} onClick={() => changeView('network')}>
            📡 Network Analysis
          </li>
          <li className={`nav-item ${currentView === 'dorks' ? 'active' : ''}`} onClick={() => changeView('dorks')}>
            🛠️ Search & Builders
          </li>
          <li className={`nav-item ${currentView === 'utils' ? 'active' : ''}`} onClick={() => changeView('utils')}>
            ⚙️ Utilities & Cryptography
          </li>
          <li className={`nav-item ${currentView === 'ai' ? 'active' : ''}`} onClick={() => changeView('ai')}>
            🤖 AI Cyber Copilot
          </li>
        </nav>
      </aside>

      {/* Main Content Layout */}
      <main className="main-content">
        {/* Top Search Bar */}
        <div className="global-search">
          <input 
            type="text" 
            placeholder="Search OSINT tools, features, ciphers..." 
            className="input-control"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            style={{ paddingLeft: '16px', borderRadius: '8px' }}
          />
          {showSearchResults && filteredTools.length > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: '50px', 
              left: 0, 
              width: '100%', 
              backgroundColor: 'var(--bg-secondary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              zIndex: 100, 
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {filteredTools.map(t => (
                <div 
                  key={t.id}
                  onClick={() => navigateToTool(t.id, t.category)}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--border-color)', 
                    cursor: 'pointer', 
                    transition: 'background 0.2s'
                  }}
                  className="search-item-hover"
                  onMouseDown={(e) => e.preventDefault()} // Prevents blur before click
                >
                  <div style={{ fontWeight: 'bold', color: 'var(--color-cyan)', fontSize: '13px' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic View Route */}
        {currentView === 'dashboard' && (
          <DashboardView 
            setCurrentView={setCurrentView} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
            recentSearches={recentSearches}
            triggerToast={triggerToast}
            navigateToTool={navigateToTool}
          />
        )}
        {currentView === 'intel' && (
          <ThreatIntelView 
            triggerToast={triggerToast} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
            addRecentSearch={addRecentSearch}
          />
        )}
        {currentView === 'osint' && (
          <OsintView 
            triggerToast={triggerToast} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
            addRecentSearch={addRecentSearch}
          />
        )}
        {currentView === 'network' && (
          <NetworkToolsView 
            triggerToast={triggerToast} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
            addRecentSearch={addRecentSearch}
          />
        )}
        {currentView === 'dorks' && (
          <DorkGenView 
            triggerToast={triggerToast} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
          />
        )}
        {currentView === 'utils' && (
          <CryptoToolsView 
            triggerToast={triggerToast} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
          />
        )}
        {currentView === 'ai' && (
          <AiView 
            triggerToast={triggerToast} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
          />
        )}
      </main>

      {/* React Global Toast Notifications */}
      <div id="toast-container" className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <div className="toast-message">
              <div className="toast-title">{t.title}</div>
              <div className="toast-desc">{t.message}</div>
            </div>
            <div className="toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>×</div>
          </div>
        ))}
      </div>
    </div>
  );
}
