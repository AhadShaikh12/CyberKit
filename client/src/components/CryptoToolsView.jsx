import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import './CryptoToolsView.css';

const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

function calcEntropy(len) {
  return (len * Math.log2(CHARSET.length)).toFixed(2);
}

function strengthLabel(entropy) {
  if (entropy < 40)  return { label: 'Weak',      color: '#ff3b30', pct: 20 };
  if (entropy < 60)  return { label: 'Fair',       color: '#ffcc00', pct: 45 };
  if (entropy < 80)  return { label: 'Good',       color: '#00e5ff', pct: 65 };
  if (entropy < 100) return { label: 'Strong',     color: '#00ff66', pct: 82 };
  return               { label: 'Excellent', color: '#00ff66', pct: 100 };
}

// Mix user password with random chars to harden it
function hardenPassword(base, targetLen) {
  const charset = CHARSET;
  let result = '';
  const extra = targetLen - base.length;
  const insertPositions = new Set();
  while (insertPositions.size < Math.min(extra, targetLen - base.length)) {
    insertPositions.add(Math.floor(Math.random() * targetLen));
  }
  let baseIdx = 0;
  for (let i = 0; i < targetLen; i++) {
    if (insertPositions.has(i) || baseIdx >= base.length) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    } else {
      result += base[baseIdx++];
    }
  }
  return result;
}

export default function CryptoToolsView({ triggerToast }) {
  const [activeTab, setActiveTab] = useState('jwt');

  // Shared I/O
  const [inputVal, setInputVal]   = useState('');
  const [outputVal, setOutputVal] = useState('');

  // Password Lab
  const [passLength, setPassLength]     = useState(20);
  const [userPass, setUserPass]         = useState('');
  const [passEntropy, setPassEntropy]   = useState(null);
  const [passStrength, setPassStrength] = useState(null);

  // Regex
  const [regexPattern, setRegexPattern] = useState('');
  const [regexText, setRegexText]       = useState('');
  const [regexResult, setRegexResult]   = useState('');

  // Diff
  const [text1, setText1]           = useState('');
  const [text2, setText2]           = useState('');
  const [diffResult, setDiffResult] = useState([]);

  // Timestamp
  const [timestamp, setTimestamp]   = useState('');
  const [timeResult, setTimeResult] = useState('');

  const switchTab = (tab) => {
    setActiveTab(tab);
    setInputVal(''); setOutputVal('');
    setPassEntropy(null); setPassStrength(null);
    setRegexResult(''); setDiffResult([]); setTimeResult('');
  };

  /* ── JWT ── */
  const handleJwtDecode = () => {
    try {
      const parts = inputVal.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT (need 3 parts)');
      const header  = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      setOutputVal(JSON.stringify({ header, payload }, null, 2));
      triggerToast('JWT decoded successfully', 'success', 'JWT DECODE');
    } catch (err) {
      setOutputVal(`Error: ${err.message}`);
      triggerToast('Failed to parse JWT', 'danger', 'JWT ERROR');
    }
  };

  /* ── Encoders ── */
  const handleBase64Url = (mode, action) => {
    try {
      let r = '';
      if (mode === 'base64') r = action === 'encode' ? btoa(unescape(encodeURIComponent(inputVal))) : decodeURIComponent(escape(atob(inputVal)));
      else r = action === 'encode' ? encodeURIComponent(inputVal) : decodeURIComponent(inputVal);
      setOutputVal(r);
      triggerToast('Transformed', 'success', 'FORMAT');
    } catch (e) { setOutputVal(`Error: ${e.message}`); }
  };

  const handleHash = (algo) => {
    if (!inputVal) return;
    const map = { md5: CryptoJS.MD5, sha1: CryptoJS.SHA1, sha256: CryptoJS.SHA256 };
    setOutputVal(map[algo](inputVal).toString());
    triggerToast(`${algo.toUpperCase()} generated`, 'success', 'HASH');
  };

  const handleJsonFormatter = () => {
    try {
      setOutputVal(JSON.stringify(JSON.parse(inputVal), null, 2));
      triggerToast('JSON formatted', 'success', 'JSON');
    } catch (e) {
      setOutputVal(`Malformed JSON: ${e.message}`);
      triggerToast('Invalid JSON', 'danger', 'JSON ERROR');
    }
  };

  const handleQrGen = () => {
    if (!inputVal) return;
    setOutputVal(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inputVal)}`);
    triggerToast('QR generated', 'success', 'QR GEN');
  };

  /* ── Password Lab ── */
  const handlePassGen = () => {
    const base = userPass.trim();
    let pw;
    if (base.length > 0 && base.length < passLength) {
      // Harden user's password by inserting random strong chars
      pw = hardenPassword(base, passLength);
    } else if (base.length >= passLength) {
      // Already long enough – inject symbols at front and back
      const inject = () => CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
      pw = inject() + base.slice(0, passLength - 2) + inject();
    } else {
      // Pure random
      pw = '';
      for (let i = 0; i < passLength; i++)
        pw += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
    }
    const entropy = calcEntropy(pw.length);
    setOutputVal(pw);
    setPassEntropy(entropy);
    setPassStrength(strengthLabel(parseFloat(entropy)));
    triggerToast('Password generated', 'success', 'PASS GEN');
  };

  /* ── Diff ── */
  const runTextDiff = () => {
    const l1 = text1.split('\n'), l2 = text2.split('\n');
    const max = Math.max(l1.length, l2.length);
    setDiffResult(Array.from({ length: max }, (_, i) => ({
      line: i + 1, same: (l1[i] ?? '') === (l2[i] ?? ''), a: l1[i] ?? '', b: l2[i] ?? ''
    })));
    triggerToast('Diff computed', 'success', 'DIFF');
  };

  /* ── Regex ── */
  const runRegexTest = () => {
    try {
      const rx = new RegExp(regexPattern, 'g');
      setRegexResult(JSON.stringify([...regexText.matchAll(rx)].map(m => m[0]), null, 2));
      triggerToast('Pattern evaluated', 'success', 'REGEX');
    } catch (e) { setRegexResult(`Error: ${e.message}`); }
  };

  /* ── Timestamp ── */
  const convertTime = () => {
    try {
      const n = parseInt(timestamp);
      if (isNaN(n)) throw new Error('Not a number');
      setTimeResult(new Date(n * 1000).toUTCString());
      triggerToast('Timestamp converted', 'success', 'DATETIME');
    } catch (e) { setTimeResult(e.message); }
  };

  const ResultLabel = ({ children }) => (
    <label style={{ display:'block', fontSize:'11px', fontWeight:700, textTransform:'uppercase',
      letterSpacing:'1px', color:'var(--text-secondary)', marginBottom:'8px' }}>{children}</label>
  );

  const tabs = [
    { id:'jwt',      label:'🔐 JWT Parser' },
    { id:'encoders', label:'🔄 Encoders & Hashes' },
    { id:'diff',     label:'📋 Text Diff' },
    { id:'regex',    label:'🔍 Regex Tester' },
    { id:'passgen',  label:'🔑 Password Lab' },
    { id:'time',     label:'⏱ Timestamp' },
  ];

  return (
    <div className="view-panel">
      <h1>⚙️ Utilities &amp; Cryptography</h1>
      <p style={{ marginBottom:'20px' }}>Local formatting, payload compilation, and text transformations.</p>

      {/* ── Tab bar ── */}
      <div className="crypto-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => switchTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ══════════════ JWT ══════════════ */}
      {activeTab === 'jwt' && (
        <div className="crypto-card">
          <h2>🔐 JSON Web Token Decoder</h2>
          <div className="form-group">
            <label>Paste Raw JWT Token</label>
            <textarea className="input-control" rows={5}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={inputVal} onChange={e => setInputVal(e.target.value)} />
          </div>
          <button className="btn btn-cyan" onClick={handleJwtDecode}>Decode Token</button>
          {outputVal && (
            <div className="result-area">
              <ResultLabel>Decoded Payload</ResultLabel>
              <div className="code-box secure">{outputVal}</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ ENCODERS ══════════════ */}
      {activeTab === 'encoders' && (
        <div className="crypto-card">
          <h2>🔄 Encoders, Formatters &amp; Hashes</h2>
          <div className="form-group">
            <label>Input Text / Payload</label>
            <textarea className="input-control" rows={5}
              placeholder="Enter your string here…"
              value={inputVal} onChange={e => setInputVal(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn btn-primary"   onClick={() => handleBase64Url('base64','encode')}>B64 Encode</button>
            <button className="btn btn-secondary" onClick={() => handleBase64Url('base64','decode')}>B64 Decode</button>
            <button className="btn btn-primary"   onClick={() => handleBase64Url('url','encode')}>URL Encode</button>
            <button className="btn btn-secondary" onClick={() => handleBase64Url('url','decode')}>URL Decode</button>
            <button className="btn btn-cyan"      onClick={() => handleHash('md5')}>MD5</button>
            <button className="btn btn-cyan"      onClick={() => handleHash('sha1')}>SHA-1</button>
            <button className="btn btn-cyan"      onClick={() => handleHash('sha256')}>SHA-256</button>
            <button className="btn btn-secondary" onClick={handleJsonFormatter}>JSON Format</button>
            <button className="btn btn-primary"   onClick={handleQrGen}>QR Code</button>
          </div>
          {outputVal && (
            <div className="result-area">
              <ResultLabel>Output</ResultLabel>
              {outputVal.startsWith('http') ? (
                <div style={{ background:'#fff', padding:'16px', borderRadius:'8px', display:'inline-block', marginTop:'4px' }}>
                  <img src={outputVal} alt="QR Code" />
                </div>
              ) : (
                <div className="code-box secure">{outputVal}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ DIFF ══════════════ */}
      {activeTab === 'diff' && (
        <div className="crypto-card">
          <h2>📋 Text Compare &amp; Diff</h2>
          <div className="diff-grid">
            <div className="form-group" style={{ marginBottom:0 }}>
              <label>Text A</label>
              <textarea className="input-control" rows={9} value={text1}
                onChange={e => setText1(e.target.value)} placeholder="Paste first block…" />
            </div>
            <div className="form-group" style={{ marginBottom:0 }}>
              <label>Text B</label>
              <textarea className="input-control" rows={9} value={text2}
                onChange={e => setText2(e.target.value)} placeholder="Paste second block…" />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop:'16px' }} onClick={runTextDiff}>Compare</button>
          {diffResult.length > 0 && (
            <div className="result-area">
              <ResultLabel>Diff Result</ResultLabel>
              <div className="code-box secure" style={{ maxHeight:'340px', overflowY:'auto' }}>
                {diffResult.map((d, i) => (
                  <div key={i} style={{ color: d.same ? 'var(--color-green)' : 'var(--color-red)', marginBottom:'2px' }}>
                    {d.same ? `  L${d.line}: ${d.a}` : `≠ L${d.line}:  A: "${d.a}"  →  B: "${d.b}"`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ REGEX ══════════════ */}
      {activeTab === 'regex' && (
        <div className="crypto-card">
          <h2>🔍 Regex Pattern Tester</h2>
          <div className="crypto-two-col">
            <div className="form-group" style={{ marginBottom:0 }}>
              <label>Pattern  (e.g. [a-z0-9]+)</label>
              <input type="text" className="input-control"
                value={regexPattern} onChange={e => setRegexPattern(e.target.value)}
                placeholder="[a-z0-9]+" />
            </div>
            <div style={{ display:'flex', alignItems:'flex-end' }}>
              <button className="btn btn-cyan" style={{ width:'100%' }} onClick={runRegexTest}>Evaluate Pattern</button>
            </div>
          </div>
          <div className="form-group" style={{ marginTop:'18px' }}>
            <label>Test Text</label>
            <textarea className="input-control" rows={6}
              value={regexText} onChange={e => setRegexText(e.target.value)}
              placeholder="Paste the text to test against…" />
          </div>
          {regexResult && (
            <div className="result-area">
              <ResultLabel>Matches Found</ResultLabel>
              <div className="code-box secure">{regexResult}</div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ PASSWORD LAB ══════════════ */}
      {activeTab === 'passgen' && (
        <div className="crypto-card">
          <h2>🔑 High-Entropy Password Lab</h2>
          <div className="crypto-two-col">
            {/* Left col */}
            <div>
              <div className="form-group">
                <label>Your Password (optional – we'll harden it)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Enter a base password or leave blank…"
                  value={userPass}
                  onChange={e => setUserPass(e.target.value)}
                />
                <p style={{ fontSize:'12px', color:'var(--text-secondary)', marginTop:'6px', lineHeight:1.5 }}>
                  If you enter your own password, we'll inject strong characters to harden it
                  while keeping your pattern recognisable.
                </p>
              </div>
              <div className="form-group">
                <label>Target Length: <span style={{ color:'var(--color-cyan)' }}>{passLength} chars</span></label>
                <input type="range" min="8" max="64" className="input-control"
                  value={passLength} onChange={e => setPassLength(parseInt(e.target.value))} />
              </div>
              <button className="btn btn-primary" style={{ width:'100%', padding:'13px' }} onClick={handlePassGen}>
                ⚡ Generate Hardened Password
              </button>
            </div>

            {/* Right col – result */}
            <div>
              {outputVal ? (
                <>
                  <div className="form-group" style={{ marginBottom:0 }}>
                    <label>Generated Password</label>
                    <div className="code-box secure"
                      style={{ wordBreak:'break-all', userSelect:'all', letterSpacing:'1.5px',
                        fontSize:'15px', padding:'18px', lineHeight:1.7 }}>
                      {outputVal}
                    </div>
                  </div>

                  {passStrength && (
                    <>
                      <div className="strength-bar-wrap" style={{ marginTop:'14px' }}>
                        <div className="strength-bar"
                          style={{ width:`${passStrength.pct}%`, background: passStrength.color }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                        <span style={{ fontSize:'12px', color: passStrength.color, fontWeight:700 }}>
                          {passStrength.label}
                        </span>
                        <span style={{ fontSize:'12px', color:'var(--text-secondary)', fontFamily:'var(--font-mono)' }}>
                          {passEntropy} bits entropy
                        </span>
                      </div>
                      <div className="entropy-badge" style={{ marginTop:'12px' }}>
                        🔐 {passStrength.label} — {passEntropy} bits — {passStrength.pct === 100 ? 'Excellent' : 'Strong'} security
                      </div>
                    </>
                  )}

                  <button className="btn btn-secondary"
                    style={{ width:'100%', marginTop:'14px' }}
                    onClick={() => { navigator.clipboard.writeText(outputVal); triggerToast('Copied to clipboard!', 'success', 'COPY'); }}>
                    📋 Copy Password
                  </button>
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  height:'100%', minHeight:'180px', gap:'12px', color:'var(--text-secondary)', opacity:0.5 }}>
                  <div style={{ fontSize:'48px' }}>🔑</div>
                  <div style={{ fontSize:'13px', textAlign:'center' }}>
                    Your generated password will appear here
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TIMESTAMP ══════════════ */}
      {activeTab === 'time' && (
        <div className="crypto-card">
          <h2>⏱ Unix Timestamp Converter</h2>
          <div className="crypto-two-col">
            <div>
              <div className="form-group">
                <label>Unix Timestamp (seconds)</label>
                <input type="text" className="input-control"
                  placeholder="e.g. 1776096000"
                  value={timestamp} onChange={e => setTimestamp(e.target.value)} />
              </div>
              <button className="btn btn-cyan" style={{ width:'100%' }} onClick={convertTime}>
                Convert to Human Date
              </button>
            </div>
            <div>
              {timeResult ? (
                <div className="result-area" style={{ marginTop:0 }}>
                  <ResultLabel>UTC Result</ResultLabel>
                  <div className="code-box secure">{timeResult}</div>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                  height:'100%', minHeight:'120px', gap:'10px', color:'var(--text-secondary)', opacity:0.5 }}>
                  <div style={{ fontSize:'36px' }}>⏱</div>
                  <div style={{ fontSize:'13px' }}>Result will appear here</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
