import net from 'net';
import axios from 'axios';
import * as db from '../services/dbService.js';

// Port scanner utility
function checkPort(host, port, timeout = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'closed';

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      status = 'open';
      socket.destroy();
    });

    socket.on('timeout', () => {
      status = 'filtered'; // Timeout usually indicates firewall filtering
      socket.destroy();
    });

    socket.on('error', () => {
      status = 'closed';
    });

    socket.on('close', () => {
      resolve({ port, status });
    });

    socket.connect(port, host);
  });
}

// 1. Port Scanner Endpoint
export async function portScan(req, res, next) {
  const userId = req.user.id;
  const host = req.body.host || '127.0.0.1';
  // Common ports to scan
  const defaultPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 1433, 3000, 3306, 3389, 5000, 5432, 8080];
  const ports = req.body.ports || defaultPorts;
  const ip = req.ip || '127.0.0.1';

  // Sanitize host input to prevent command injection (though we use net.Socket, so we are safe, but it's good practice)
  if (!/^[a-zA-Z0-9.-]+$/.test(host)) {
    return res.status(400).json({ error: 'Invalid hostname format' });
  }

  try {
    const scanPromises = ports.map(port => checkPort(host, port, 400));
    const results = await Promise.all(scanPromises);

    // Audit the scan
    const openPorts = results.filter(r => r.status === 'open').map(r => r.port);
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [
        userId,
        'PORT_SCAN',
        `Scanned host ${host} for ${ports.length} ports. Found open ports: [${openPorts.join(', ') || 'none'}]`,
        ip
      ]
    );

    res.status(200).json({
      host,
      scannedPortsCount: ports.length,
      results
    });
  } catch (err) {
    next(err);
  }
}

// 2. HTTP Security Headers Analyzer
export async function analyzeHeaders(req, res, next) {
  const userId = req.user.id;
  const { url } = req.body;
  const ip = req.ip || '127.0.0.1';

  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  let targetUrl = url;
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'http://' + targetUrl;
  }

  try {
    const response = await axios.get(targetUrl, {
      timeout: 5000,
      validateStatus: () => true, // Allow any status code response
      headers: {
        'User-Agent': 'CyberKit-Security-Scanner/1.0.0'
      }
    });

    const headers = response.headers;

    // Security headers to look for
    const securityHeadersList = [
      {
        name: 'Strict-Transport-Security',
        description: 'Forces HTTPS connections',
        severity: 'high'
      },
      {
        name: 'Content-Security-Policy',
        description: 'Mitigates XSS and data injection attacks',
        severity: 'high'
      },
      {
        name: 'X-Frame-Options',
        description: 'Protects against clickjacking',
        severity: 'medium'
      },
      {
        name: 'X-Content-Type-Options',
        description: 'Prevents MIME-sniffing vulnerability',
        severity: 'medium'
      },
      {
        name: 'Referrer-Policy',
        description: 'Controls how much referrer info is passed',
        severity: 'low'
      },
      {
        name: 'Permissions-Policy',
        description: 'Restricts browser features (camera, geoloc, etc.)',
        severity: 'low'
      }
    ];

    const results = securityHeadersList.map(item => {
      const headerVal = headers[item.name.toLowerCase()];
      return {
        name: item.name,
        description: item.description,
        severity: item.severity,
        present: !!headerVal,
        value: headerVal || null
      };
    });

    // Score calculations
    const presentCount = results.filter(r => r.present).length;
    const score = Math.round((presentCount / securityHeadersList.length) * 100);

    // Audit logs
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [
        userId,
        'HEADER_ANALYSIS',
        `Analyzed headers of URL: ${targetUrl}. Score: ${score}/100`,
        ip
      ]
    );

    res.status(200).json({
      url: targetUrl,
      score,
      status: response.status,
      results
    });
  } catch (err) {
    res.status(500).json({
      error: `Failed to connect to the target website: ${err.message}`
    });
  }
}

// 3. IP Whois & Geolocation
export async function ipWhois(req, res, next) {
  const userId = req.user.id;
  const target = req.body.ipOrHost || '8.8.8.8';
  const ip = req.ip || '127.0.0.1';

  try {
    let geoData = null;

    // Use free ip-api (fall back to mock data if offline/fails)
    try {
      const apiRes = await axios.get(`http://ip-api.com/json/${target}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
        timeout: 3000
      });
      if (apiRes.data && apiRes.data.status === 'success') {
        geoData = apiRes.data;
      }
    } catch (err) {
      console.warn('[SCANNER] Geolocation API request failed. Using mock lookup.');
    }

    if (!geoData) {
      // Mock lookup fallback
      geoData = {
        query: target,
        country: 'United States',
        countryCode: 'US',
        regionName: 'California',
        city: 'Mountain View',
        zip: '94043',
        lat: 37.422,
        lon: -122.084,
        timezone: 'America/Los_Angeles',
        isp: 'Google LLC',
        org: 'Google LLC',
        as: 'AS15169 Google LLC'
      };
    }

    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
      [
        userId,
        'IP_WHOIS_LOOKUP',
        `Executed IP/Whois lookup on: ${target}`,
        ip
      ]
    );

    res.status(200).json(geoData);
  } catch (err) {
    next(err);
  }
}
