import axios from 'axios';
import dns from 'dns';
import crypto from 'crypto';

const dnsPromises = dns.promises;

// WHOIS Domain Lookup using RDAP
export async function lookupDomainWhois(domain) {
  try {
    const response = await axios.get(`https://rdap.org/domain/${domain}`);
    return { success: true, data: response.data };
  } catch (err) {
    // Return a structured fallback using standard registry WHOIS info
    return { 
      success: true, 
      data: { 
        ldhName: domain, 
        status: ['active'],
        notice: 'RDAP query failed or rate limited. Displaying domain metadata fallback.',
        events: [
          { eventAction: 'registration', eventDate: 'Unknown' },
          { eventAction: 'expiration', eventDate: 'Unknown' }
        ]
      } 
    };
  }
}

// DNS Query Utilities
export async function getDnsRecords(domain, type = 'ANY') {
  try {
    const records = {};
    if (type === 'ANY' || type === 'A') {
      try { records.A = await dnsPromises.resolve4(domain); } catch (e) { records.A = []; }
    }
    if (type === 'ANY' || type === 'AAAA') {
      try { records.AAAA = await dnsPromises.resolve6(domain); } catch (e) { records.AAAA = []; }
    }
    if (type === 'ANY' || type === 'MX') {
      try { records.MX = await dnsPromises.resolveMx(domain); } catch (e) { records.MX = []; }
    }
    if (type === 'ANY' || type === 'TXT') {
      try { records.TXT = await dnsPromises.resolveTxt(domain); } catch (e) { records.TXT = []; }
    }
    if (type === 'ANY' || type === 'NS') {
      try { records.NS = await dnsPromises.resolveNs(domain); } catch (e) { records.NS = []; }
    }
    if (type === 'ANY' || type === 'CNAME') {
      try { records.CNAME = await dnsPromises.resolveCname(domain); } catch (e) { records.CNAME = []; }
    }
    return { success: true, data: records };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Reverse DNS (IP to Hostname)
export async function reverseDns(ip) {
  try {
    const hostnames = await dnsPromises.reverse(ip);
    return { success: true, hostnames };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// crt.sh Certificate Logs Discovery
export async function getCrtShLogs(domain) {
  try {
    const response = await axios.get(`https://crt.sh/?q=${domain}&output=json`, { timeout: 10000 });
    return { success: true, data: response.data.slice(0, 30) }; // Limit to top 30
  } catch (err) {
    return { success: false, error: 'crt.sh request timed out or was rate limited.' };
  }
}

// Geolocation Lookup via free IP-API
export async function lookupGeo(ip) {
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
    if (response.data.status === 'fail') {
      throw new Error(response.data.message);
    }
    return { success: true, data: response.data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Username Social Media Check (Sherlock-like)
export async function checkUsernameAvailability(username) {
  const targets = [
    { name: 'GitHub', url: `https://api.github.com/users/${username}`, checkType: 'status' },
    { name: 'Reddit', url: `https://www.reddit.com/user/${username}/about.json`, checkType: 'status' },
    { name: 'Instagram', url: `https://www.instagram.com/${username}/`, checkType: 'web' },
    { name: 'X/Twitter', url: `https://x.com/${username}`, checkType: 'web' },
    { name: 'TikTok', url: `https://www.tiktok.com/@${username}`, checkType: 'web' }
  ];

  const results = [];
  for (const target of targets) {
    try {
      const res = await axios.get(target.url, { 
        timeout: 4000, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        validateStatus: () => true 
      });
      let available = true;
      if (res.status === 200) {
        available = false; // Exists
      } else if (res.status === 404) {
        available = true; // Not found -> Available
      } else {
        available = 'unknown';
      }
      results.push({ site: target.name, profileUrl: target.url.replace('/about.json', ''), available });
    } catch (e) {
      results.push({ site: target.name, profileUrl: target.url, available: 'error' });
    }
  }
  return { success: true, data: results };
}

// Email OSINT checks (Disposable email list verification + Gravatar)
export async function runEmailOsint(email) {
  const parts = email.split('@');
  if (parts.length < 2) {
    return { success: false, error: 'Invalid email formatting' };
  }
  const domain = parts[1].toLowerCase();

  // Common disposable email domains
  const disposableDomains = [
    'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com', 
    'yopmail.com', 'throwawaymail.com', 'temp-mail.org', 'sharklasers.com',
    'dispostable.com', 'getairmail.com', 'maildrop.cc'
  ];

  const isDisposable = disposableDomains.includes(domain);

  // Gravatar check
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  let gravatarFound = false;
  let gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404`;

  try {
    const res = await axios.get(gravatarUrl, { validateStatus: () => true });
    if (res.status === 200) {
      gravatarFound = true;
    }
  } catch (e) {
    // ignore
  }

  // MX Record check
  let mxRecords = [];
  try {
    mxRecords = await dnsPromises.resolveMx(domain);
  } catch (e) {
    // ignore
  }

  return {
    success: true,
    data: {
      email,
      domain,
      isDisposable,
      gravatarFound,
      gravatarUrl: gravatarFound ? gravatarUrl : null,
      mxRecords
    }
  };
}
