// =========================================================================
// server/network_config.js - Multi-PC LAN Configuration Manager
// Supports "Server Mode" (Main Reception / Server PC) vs "Client Mode" (Doctor / Lab PCs)
// =========================================================================

const os = require('os');
const fs = require('fs');
const path = require('path');
const { LIMS_DATA_DIR } = require('./sqlite_db.js');

const CONFIG_FILE = path.join(LIMS_DATA_DIR, 'network_config.json');

const DEFAULT_CONFIG = {
  mode: 'server', // 'server' | 'client'
  port: 5000,
  hostIp: '127.0.0.1',
  clientTimeoutMs: 5000
};

/**
 * Returns all active non-internal IPv4 LAN IP addresses of this machine
 */
function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          ip: iface.address,
          netmask: iface.netmask
        });
      }
    }
  }

  // Fallback to loopback if offline / isolated
  if (addresses.length === 0) {
    addresses.push({ interface: 'Loopback', ip: '127.0.0.1', netmask: '255.0.0.0' });
  }

  return addresses;
}

/**
 * Reads network configuration from disk
 */
function getNetworkConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('[Network Config] Could not read network_config.json, returning defaults:', err.message);
  }
  return DEFAULT_CONFIG;
}

/**
 * Saves network configuration to disk
 */
function saveNetworkConfig(newConfig) {
  try {
    const merged = { ...getNetworkConfig(), ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return { success: true, config: merged };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  getNetworkConfig,
  saveNetworkConfig,
  getLocalNetworkAddresses,
  CONFIG_FILE
};
