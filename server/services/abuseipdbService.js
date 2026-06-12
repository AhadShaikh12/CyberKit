import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ABUSEIPDB_API_KEY;

function isConfigured() {
  return !!API_KEY && API_KEY.trim() !== '';
}

export async function checkIp(ip) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get('https://api.abuseipdb.com/api/v2/check', {
      headers: {
        'Key': API_KEY,
        'Accept': 'application/json'
      },
      params: {
        ipAddress: ip,
        maxAgeInDays: 90,
        verbose: true
      }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.errors?.[0]?.detail || error.message };
  }
}

export async function getReports(ip) {
  if (!isConfigured()) {
    return { success: false, error: 'API key not configured. Please add it to the .env file.' };
  }
  try {
    const response = await axios.get('https://api.abuseipdb.com/api/v2/reports', {
      headers: {
        'Key': API_KEY,
        'Accept': 'application/json'
      },
      params: {
        ipAddress: ip,
        maxAgeInDays: 90
      }
    });
    return { success: true, data: response.data.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.errors?.[0]?.detail || error.message };
  }
}
