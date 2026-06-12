import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VIRUSTOTAL_API_KEY;

function isConfigured() {
  return !!API_KEY && API_KEY.trim() !== '';
}

export async function checkHash(hash) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: { 'x-apikey': API_KEY }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

export async function checkUrl(url) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    // Generate URL safe base64 without padding
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const response = await axios.get(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': API_KEY }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

export async function checkDomain(domain) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get(`https://www.virustotal.com/api/v3/domains/${domain}`, {
      headers: { 'x-apikey': API_KEY }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}

export async function checkIp(ip) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
      headers: { 'x-apikey': API_KEY }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
}
