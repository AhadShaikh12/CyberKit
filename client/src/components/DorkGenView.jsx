import React, { useState } from 'react';

export default function DorkGenView({ triggerToast, favorites, toggleFavorite }) {
  const [activeTab, setActiveTab] = useState('dorks');
  
  // Dork states
  const [dorkCategory, setDorkCategory] = useState('github');
  const [dorkDomain, setDorkDomain] = useState('example.com');
  const [dorkResult, setDorkResult] = useState('');

  // Command Builder states
  const [toolName, setToolName] = useState('nmap');
  const [targetHost, setTargetHost] = useState('192.168.1.1');
  const [scanType, setScanType] = useState('syn'); // for nmap
  const [sqlOptions, setSqlOptions] = useState('dbs'); // for sqlmap
  const [shodanFilter, setShodanFilter] = useState('port'); // for shodan
  const [shodanValue, setShodanValue] = useState('80');
  const [commandResult, setCommandResult] = useState('');

  const generateDork = () => {
    let queries = [];
    const domain = dorkDomain.trim() || 'example.com';
    
    if (dorkCategory === 'github') {
      queries = [
        `site:github.com "${domain}" API_KEY`,
        `site:github.com "${domain}" password`,
        `site:github.com "${domain}" secret`,
        `site:github.com "${domain}" config`
      ];
    } else if (dorkCategory === 'sqli') {
      queries = [
        `site:${domain} inurl:id=`,
        `site:${domain} inurl:index.php?id=`,
        `site:${domain} inurl:product.php?id=`,
        `site:${domain} inurl:news.php?id=`
      ];
    } else if (dorkCategory === 'filetype') {
      queries = [
        `site:${domain} filetype:sql`,
        `site:${domain} filetype:env`,
        `site:${domain} filetype:log`,
        `site:${domain} filetype:conf`
      ];
    } else {
      queries = [
        `"${domain}" email`,
        `site:linkedin.com/in/ "${domain}"`,
        `site:pastebin.com "${domain}"`,
        `site:trello.com "${domain}"`
      ];
    }
    setDorkResult(queries.join('\n'));
    triggerToast('Google dork queries built', 'success', 'DORK GEN');
  };

  const generateCommand = () => {
    const host = targetHost.trim() || '192.168.1.1';
    let command = '';

    if (toolName === 'nmap') {
      if (scanType === 'syn') {
        command = `nmap -sS -Pn -T4 -v ${host}`;
      } else if (scanType === 'service') {
        command = `nmap -sC -sV -p- -T4 ${host}`;
      } else {
        command = `nmap -O --osscan-guess ${host}`;
      }
    } else if (toolName === 'sqlmap') {
      if (sqlOptions === 'dbs') {
        command = `sqlmap -u "http://${host}/index.php?id=1" --dbs --batch`;
      } else if (sqlOptions === 'dump') {
        command = `sqlmap -u "http://${host}/index.php?id=1" -D target_db -T users --dump --batch`;
      } else {
        command = `sqlmap -u "http://${host}/index.php?id=1" --crawl=3 --level=3 --risk=2`;
      }
    } else {
      // Shodan
      if (shodanFilter === 'port') {
        command = `port:${shodanValue} country:"US"`;
      } else if (shodanFilter === 'product') {
        command = `product:"${shodanValue}"`;
      } else {
        command = `os:"${shodanValue}"`;
      }
    }
    setCommandResult(command);
    triggerToast('Tool query command constructed', 'success', 'BUILDER');
  };

  return (
    <div className="view-panel">
      <h1>🛠️ Search Builders & Command Generators</h1>
      <p style={{ marginBottom: '20px' }}>Synthesize Google Dorks, Nmap configurations, and vulnerability scanning commands.</p>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'dorks' ? 'active' : ''}`} onClick={() => setActiveTab('dorks')}>Google Dork Generator</button>
        <button className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`} onClick={() => setActiveTab('commands')}>Command Builders</button>
      </div>

      {activeTab === 'dorks' && (
        <div className="card">
          <h2>Google Dork Query Builder</h2>
          <div className="form-group">
            <label>Target Domain / Entity</label>
            <input type="text" className="input-control" value={dorkDomain} onChange={(e) => setDorkDomain(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Dork Category</label>
            <select className="input-control" value={dorkCategory} onChange={(e) => setDorkCategory(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <option value="github">GitHub Dorks (API Leakage)</option>
              <option value="sqli">SQL Injection Entrypoints</option>
              <option value="filetype">Sensitive Filetype Search</option>
              <option value="osint">Generic Entity OSINT</option>
            </select>
          </div>
          <button className="btn btn-cyan" onClick={generateDork}>Synthesize Dork Queries</button>

          {dorkResult && (
            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Google Dork URLs (Paste into Google Search)</label>
              <div className="code-box secure">{dorkResult}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'commands' && (
        <div className="card">
          <h2>Security Tool Command Builder</h2>
          <div className="form-group">
            <label>Target Security Tool</label>
            <select className="input-control" value={toolName} onChange={(e) => setToolName(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <option value="nmap">Nmap Port Scanner</option>
              <option value="sqlmap">SQLMap Database Auditor</option>
              <option value="shodan">Shodan Search Syntax</option>
            </select>
          </div>

          <div className="form-group">
            <label>{toolName === 'shodan' ? 'Search Target' : 'Target Host / URL'}</label>
            <input type="text" className="input-control" value={targetHost} onChange={(e) => setTargetHost(e.target.value)} />
          </div>

          {toolName === 'nmap' && (
            <div className="form-group">
              <label>Scan Strategy</label>
              <select className="input-control" value={scanType} onChange={(e) => setScanType(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <option value="syn">TCP SYN Stealth Scan (-sS)</option>
                <option value="service">Service & Script Audit (-sC -sV)</option>
                <option value="os">OS Fingerprinting (-O)</option>
              </select>
            </div>
          )}

          {toolName === 'sqlmap' && (
            <div className="form-group">
              <label>Exploitation Parameter</label>
              <select className="input-control" value={sqlOptions} onChange={(e) => setSqlOptions(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <option value="dbs">Enumerate Databases (--dbs)</option>
                <option value="dump">Dump Table Content (--dump)</option>
                <option value="crawl">Web Crawler Audit (--crawl)</option>
              </select>
            </div>
          )}

          {toolName === 'shodan' && (
            <div className="responsive-form-row" style={{ marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label>Filter Type</label>
                <select className="input-control" value={shodanFilter} onChange={(e) => setShodanFilter(e.target.value)} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <option value="port">Port</option>
                  <option value="product">Product / Service</option>
                  <option value="os">Operating System</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label>Value</label>
                <input type="text" className="input-control" value={shodanValue} onChange={(e) => setShodanValue(e.target.value)} />
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={generateCommand}>Construct Query Command</button>

          {commandResult && (
            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Command Line Command</label>
              <div className="code-box secure">{commandResult}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
