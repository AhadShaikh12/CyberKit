import express from 'express';
import * as controller from '../controllers/intelController.js';

const router = express.Router();

// VirusTotal
router.post('/vt/hash', controller.vtHash);
router.post('/vt/url', controller.vtUrl);
router.post('/vt/domain', controller.vtDomain);
router.post('/vt/ip', controller.vtIp);

// AbuseIPDB
router.post('/abuse/check', controller.abuseCheck);
router.post('/abuse/reports', controller.abuseReports);

// Censys
router.post('/censys/host', controller.censysHost);
router.post('/censys/certs', controller.censysCerts);

// Shodan
router.post('/shodan/host', controller.shodanHost);
router.get('/shodan/ports', controller.shodanPorts);
router.post('/shodan/banners', controller.shodanBanners);

// Free OSINT & Intel
router.post('/free/whois', controller.freeWhois);
router.post('/free/dns', controller.freeDns);
router.post('/free/reversedns', controller.freeReverseDns);
router.post('/free/crtsh', controller.freeCrtsh);
router.post('/free/geo', controller.freeGeo);
router.post('/free/username', controller.freeUsername);
router.post('/free/email', controller.freeEmail);

// AI
router.post('/ai/gemini', controller.aiGemini);
router.post('/ai/openai', controller.aiOpenai);

export default router;
