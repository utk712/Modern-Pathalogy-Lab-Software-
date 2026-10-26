// =========================================================================
// server/serial_driver.js - Native Windows RS-232 / COM Port Driver Engine
// =========================================================================

const { exec, spawn } = require('child_process');

let activeSerialProcess = null;
let activePortConfig = {
  port: null,
  baudRate: 9600,
  status: 'DISCONNECTED',
  bytesRead: 0,
  lastDataAt: null
};

/**
 * Scans Windows system for available physical & virtual COM ports.
 */
function scanAvailableCOMPorts() {
  return new Promise((resolve) => {
    // 1. Check via .NET SerialPort assembly
    const psCmd = `[System.IO.Ports.SerialPort]::getportnames()`;
    exec(`powershell -NoProfile -Command "${psCmd}"`, { timeout: 3000 }, (err, stdout) => {
      const ports = [];
      if (!err && stdout) {
        const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        lines.forEach(p => {
          if (/^COM\d+$/i.test(p) && !ports.includes(p.toUpperCase())) {
            ports.push(p.toUpperCase());
          }
        });
      }

      // If no hardware ports connected right now, supply standard common ports for configuration
      const result = ports.length > 0 ? ports : ['COM1', 'COM2', 'COM3'];
      resolve({
        detectedCount: ports.length,
        availablePorts: result,
        hasHardwarePort: ports.length > 0
      });
    });
  });
}

/**
 * Connects to a physical or virtual COM port on Windows and pipes incoming bytes.
 */
function connectSerialPort(portName, baudRate = 9600, onDataCallback) {
  if (activeSerialProcess) {
    disconnectSerialPort();
  }

  const cleanPort = (portName || 'COM1').toUpperCase();
  const cleanBaud = parseInt(baudRate, 10) || 9600;

  activePortConfig = {
    port: cleanPort,
    baudRate: cleanBaud,
    status: 'CONNECTING',
    bytesRead: 0,
    lastDataAt: null
  };

  console.log(`[SERIAL DRIVER] Opening native Windows serial connection to ${cleanPort} at ${cleanBaud} baud...`);

  // Use a dedicated PowerShell child process reading [System.IO.Ports.SerialPort]
  // Works with all FTDI, Prolific, CH340, CP2102, and native motherboard RS-232 COM ports
  const psScript = `
    $port = New-Object System.IO.Ports.SerialPort('${cleanPort}', ${cleanBaud}, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
    $port.ReadTimeout = 5000
    try {
      $port.Open()
      [Console]::WriteLine("OPEN_SUCCESS")
      $buffer = New-Object byte[] 4096
      while ($port.IsOpen) {
        try {
          $count = $port.Read($buffer, 0, $buffer.Length)
          if ($count -gt 0) {
            $text = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $count)
            [Console]::Write($text)
          }
        } catch [TimeoutException] {
          # Keep alive
        }
      }
    } catch {
      [Console]::WriteLine("OPEN_ERROR: " + $_.Exception.Message)
    } finally {
      if ($port.IsOpen) { $port.Close() }
    }
  `;

  try {
    activeSerialProcess = spawn('powershell', ['-NoProfile', '-Command', psScript]);

    activeSerialProcess.stdout.on('data', (data) => {
      const text = data.toString();
      if (text.includes('OPEN_SUCCESS')) {
        activePortConfig.status = 'CONNECTED';
        console.log(`[SERIAL DRIVER] Successfully connected to ${cleanPort}`);
        return;
      }
      if (text.includes('OPEN_ERROR')) {
        activePortConfig.status = 'ERROR';
        console.warn(`[SERIAL DRIVER] Connection notice for ${cleanPort}:`, text.trim());
        return;
      }

      activePortConfig.bytesRead += data.length;
      activePortConfig.lastDataAt = new Date().toISOString();

      if (typeof onDataCallback === 'function') {
        onDataCallback(text, `SERIAL_${cleanPort}`);
      }
    });

    activeSerialProcess.stderr.on('data', (err) => {
      console.warn(`[SERIAL DRIVER ERROR] ${cleanPort}:`, err.toString().trim());
    });

    activeSerialProcess.on('close', () => {
      activePortConfig.status = 'DISCONNECTED';
      activeSerialProcess = null;
      console.log(`[SERIAL DRIVER] Connection closed for ${cleanPort}`);
    });

    // Mark as CONNECTED if no immediate error within 1.5 seconds
    setTimeout(() => {
      if (activePortConfig.status === 'CONNECTING') {
        activePortConfig.status = 'CONNECTED';
      }
    }, 1500);

    return { success: true, port: cleanPort, baudRate: cleanBaud };
  } catch (err) {
    activePortConfig.status = 'FAILED';
    return { success: false, error: err.message };
  }
}

/**
 * Disconnects the active serial port.
 */
function disconnectSerialPort() {
  if (activeSerialProcess) {
    try {
      activeSerialProcess.kill();
    } catch (e) {}
    activeSerialProcess = null;
  }
  activePortConfig.status = 'DISCONNECTED';
  return { success: true, message: 'Serial port disconnected' };
}

function getSerialStatus() {
  return activePortConfig;
}

module.exports = {
  scanAvailableCOMPorts,
  connectSerialPort,
  disconnectSerialPort,
  getSerialStatus
};
