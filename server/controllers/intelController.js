import * as vt from '../services/virustotalService.js';
import * as abuse from '../services/abuseipdbService.js';
import * as censys from '../services/censysService.js';
import * as shodan from '../services/shodanService.js';
import * as free from '../services/freeIntelService.js';
import * as ai from '../services/aiService.js';

// VirusTotal
export async function vtHash(req, res) {
  const result = await vt.checkHash(req.body.hash);
  res.json(result);
}

export async function vtUrl(req, res) {
  const result = await vt.checkUrl(req.body.url);
  res.json(result);
}

export async function vtDomain(req, res) {
  const result = await vt.checkDomain(req.body.domain);
  res.json(result);
}

export async function vtIp(req, res) {
  const result = await vt.checkIp(req.body.ip);
  res.json(result);
}

// AbuseIPDB
export async function abuseCheck(req, res) {
  const result = await abuse.checkIp(req.body.ip);
  res.json(result);
}

export async function abuseReports(req, res) {
  const result = await abuse.getReports(req.body.ip);
  res.json(result);
}

// Censys
export async function censysHost(req, res) {
  const result = await censys.searchHost(req.body.ip);
  res.json(result);
}

export async function censysCerts(req, res) {
  const result = await censys.searchCertificates(req.body.query);
  res.json(result);
}

// Shodan
export async function shodanHost(req, res) {
  const result = await shodan.searchDevice(req.body.ip);
  res.json(result);
}

export async function shodanPorts(req, res) {
  const result = await shodan.getPortsInfo();
  res.json(result);
}

export async function shodanBanners(req, res) {
  const result = await shodan.getBanners(req.body.query);
  res.json(result);
}

// Free OSINT
export async function freeWhois(req, res) {
  const result = await free.lookupDomainWhois(req.body.domain);
  res.json(result);
}

export async function freeDns(req, res) {
  const result = await free.getDnsRecords(req.body.domain, req.body.type);
  res.json(result);
}

export async function freeReverseDns(req, res) {
  const result = await free.reverseDns(req.body.ip);
  res.json(result);
}

export async function freeCrtsh(req, res) {
  const result = await free.getCrtShLogs(req.body.domain);
  res.json(result);
}

export async function freeGeo(req, res) {
  const result = await free.lookupGeo(req.body.ip);
  res.json(result);
}

export async function freeUsername(req, res) {
  const result = await free.checkUsernameAvailability(req.body.username);
  res.json(result);
}

export async function freeEmail(req, res) {
  const result = await free.runEmailOsint(req.body.email);
  res.json(result);
}

// AI Copilot
export async function aiGemini(req, res) {
  const result = await ai.askGemini(req.body.prompt);
  res.json(result);
}

export async function aiOpenai(req, res) {
  const result = await ai.askOpenAI(req.body.prompt);
  res.json(result);
}
