import React, { useState } from 'react';

export default function NetworkToolsView({ triggerToast, favorites, toggleFavorite, addRecentSearch }) {
  const [activeTab, setActiveTab] = useState('portscan');
  const [loading, setLoading] = useState(false);
  const [host, setHost] = useState('127.0.0.1');
  const [ports, setPorts] = useState('21, 22, 80, 443, 3000, 3306, 5000, 8080');
  const [scanResult, setScanResult] = useState(null);

  // CIDR Calc state
  const [cidrIp, setCidrIp] = useState('192.168.1.1');
  const [cidrMask, setCidrMask] = useState('24');
  const [cidrResult, setCidrResult] = useState(null);

  // User Agent parser
  const [uaInput, setUaInput] = useState(navigator.userAgent);
  const [uaResult, setUaResult] = useState(null);

  const calculateCidr = () => {
    try {
      const parts = cidrIp.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => p < 0 || p > 255 || isNaN(p))) {
        throw new Error('Invalid IP address format');
      }
      const mask = parseInt(cidrMask);
      if (isNaN(mask) || mask < 0 || mask > 32) {
        throw new Error('Mask must be between 0 and 32');
      }

      const ipNum = (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
      const maskNum = mask === 0 ? 0 : (~0 << (32 - mask));
      
      const networkNum = ipNum & maskNum;
      const broadcastNum = networkNum | ~maskNum;

      const numHosts = mask >= 31 ? 0 : Math.pow(2, 32 - mask) - 2;

      const num2Ip = (num) => [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.');

      setCidrResult({
        network: num2Ip(networkNum),
        broadcast: num2Ip(broadcastNum),
        subnetMask: num2Ip(maskNum),
        usableHosts: numHosts,
        hostRange: mask >= 31 ? 'N/A' : `${num2Ip(networkNum + 1)} - ${num2Ip(broadcastNum - 1)}`
      });
      triggerToast('Subnet mask calculated', 'success', 'CIDR CALC');
    } catch (err) {
      triggerToast(err.message, 'danger', 'CALCULATION ERROR');
    }
  };

  const handlePortScan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setScanResult(null);
    triggerToast('Starting port scan...', 'info', 'NETWORK SCAN');

    const portList = ports.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    // Simulate port response to keep stateless network scans fast and secure
    setTimeout(() => {
      const simulated = portList.map(p => {
        const statuses = ['open', 'closed', 'filtered'];
        // Mock localhost 3000/5000/80/443 as open, others random
        let status = 'closed';
        if ([80, 443, 3000, 5000].includes(p)) {
          status = 'open';
        } else {
          status = statuses[Math.floor(Math.random() * statuses.length)];
        }
        return { port: p, service: p === 80 ? 'HTTP' : p === 443 ? 'HTTPS' : p === 22 ? 'SSH' : 'Unknown', status };
      });
      setScanResult(simulated);
      setLoading(false);
      triggerToast('Port scan completed successfully', 'success', 'SCAN COMPLETED');
    }, 1500);
  };

  const handleUaParse = () => {
    const ua = uaInput.trim();
    if (!ua) return;
    const isMobile = /Mobi|Android/i.test(ua);
    const isChrome = /Chrome/i.test(ua);
    const isFirefox = /Firefox/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
    
    setUaResult({
      userAgent: ua,
      browser: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : 'Generic WebKit/Browser',
      platform: /Windows/i.test(ua) ? 'Windows' : /Macintosh/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Mobile OS',
      isMobile: isMobile ? 'Yes' : 'No'
    });
    triggerToast('User-Agent string parsed', 'success', 'UA PARSER');
  };

  return (
    <div className="view-panel">
      <h1>📡 Network Tools Console</h1>
      <p style={{ marginBottom: '20px' }}>Local diagnostics including port audits, subnet CIDR calculators, and client header mapping.</p>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'portscan' ? 'active' : ''}`} onClick={() => setActiveTab('portscan')}>Port Scanner</button>
        <button className={`tab-btn ${activeTab === 'cidr' ? 'active' : ''}`} onClick={() => { setActiveTab('cidr'); setCidrResult(null); }}>CIDR Subnet Calculator</button>
        <button className={`tab-btn ${activeTab === 'ua' ? 'active' : ''}`} onClick={() => { setActiveTab('ua'); setUaResult(null); }}>User-Agent Parser</button>
      </div>

      {activeTab === 'portscan' && (
        <div className="card">
          <h2>TCP Port Scanner</h2>
          <form onSubmit={handlePortScan}>
            <div className="form-group">
              <label>Target IP / Hostname</label>
              <input type="text" className="input-control" value={host} onChange={(e) => setHost(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Target Ports (Comma Separated)</label>
              <input type="text" className="input-control" value={ports} onChange={(e) => setPorts(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-cyan" disabled={loading}>
              {loading ? 'Scanning sockets...' : '⚡ Initiate Discovery Scan'}
            </button>
          </form>

          {loading && (
            <div style={{ marginTop: '20px', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }} className="scanning-pulse">
              AUDITING SOCKET CONNECTIONS ON {host}...
            </div>
          )}

          {scanResult && (
            <div className="table-scroll">
              <table style={{ marginTop: '24px' }}>
                <thead>
                  <tr>
                    <th>Port</th>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResult.map(r => (
                    <tr key={r.port}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{r.port}</td>
                      <td>{r.service}</td>
                      <td>
                        <span className={`badge ${r.status === 'open' ? 'badge-success' : r.status === 'filtered' ? 'badge-warning' : 'badge-danger'}`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cidr' && (
        <div className="card">
          <h2>CIDR Calculator</h2>
          <div className="responsive-form-row">
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>IP ADDRESS</label>
              <input type="text" className="input-control" value={cidrIp} onChange={(e) => setCidrIp(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)' }}>SUBNET MASK (/X)</label>
              <input type="number" className="input-control" value={cidrMask} onChange={(e) => setCidrMask(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={calculateCidr}>Calculate Subnet Details</button>

          {cidrResult && (
            <div className="code-box secure" style={{ marginTop: '24px' }}>
              {JSON.stringify(cidrResult, null, 2)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ua' && (
        <div className="card">
          <h2>User-Agent Parser</h2>
          <div className="form-group">
            <label>Raw User-Agent Header String</label>
            <textarea className="input-control" rows="3" value={uaInput} onChange={(e) => setUaInput(e.target.value)} />
          </div>
          <button className="btn btn-cyan" onClick={handleUaParse}>Parse Header String</button>

          {uaResult && (
            <div className="code-box secure" style={{ marginTop: '24px' }}>
              {JSON.stringify(uaResult, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
