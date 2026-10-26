import React, { useState } from 'react';
import { useLab } from '../../context/LabContext';
import {
  Cpu,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Search,
  Sliders,
  Database,
  Link2,
  Layers,
  Filter,
  Zap,
  Radio,
  ShieldAlert,
  AlertTriangle,
  ArrowRightLeft,
  Cable,
  Check,
  RefreshCw,
  Send,
  Play
} from 'lucide-react';

// Standard Clinical Analyzer Protocol Formats
const ALL_PROTOCOL_FORMATS = [
  'LimitedString',
  'HL7',
  'ASTM',
  'Cobas_Intigra_400',
  'BioMerieux',
  'ABX',
  'ASTM_V1',
  'Siemens_ASTM',
  'HexString',
  'Maglumi_ASTM',
  'Architect_ASTM',
  'LS_DIALAB',
  'Biolis_ASTM',
  'Siemens_ASTMV1',
  'Filebase_ASTM',
  'BX3010_ASTM',
  'Meril_ASTM',
  'Biolis_ASTM2',
  'EM200_ASTM',
  'Turbo_ASTM',
  'Falcon_ASTM',
  'Medonic_ASTM',
  'Bene_ASTM',
  'Mythic_ASTM',
  'BioMerieux_Vitek',
  'BecManCoulter',
  'Dimension',
  'XNL_ASTM',
  'ESR20HexString',
  'TurboChem_HL7',
  'H550_ASTM',
  'BD_PHOENIX_ASTM',
  'NIHON_ASTM',
  'Architect_ASTMV1',
  'HL71'
];

const INITIAL_MACHINES = [
  { id: 'M1', name: 'BC3600' },
  { id: 'M2', name: 'H560' },
  { id: 'M3', name: 'EM200' },
  { id: 'M4', name: 'MAGLUMI800' },
  { id: 'M5', name: 'TOSOHGX' },
  { id: 'M6', name: 'H33S' },
  { id: 'M7', name: 'A15' },
  { id: 'M8', name: 'Sysmex_XN550' },
  { id: 'M9', name: 'Cobas_c311' },
  { id: 'M10', name: 'AVECON_HMT60P' }
];

const INITIAL_CONFIGS = [
  { id: 'C1', machine: 'BC3600', format: 'HL7', resultMatchField: '2', machineResultParam: 'Entity', machineResultSegment: 'OBR', pFrom: '0', pTo: '0', orderMatchField: '0', machineOrderParam: '', machineOrderSegment: '', queryMode: '', subResultSegment: '' },
  { id: 'C2', machine: 'H560', format: 'HL7', resultMatchField: '2', machineResultParam: 'Entity', machineResultSegment: 'OBR', pFrom: '0', pTo: '0', orderMatchField: '0', machineOrderParam: '', machineOrderSegment: '', queryMode: '', subResultSegment: '' },
  { id: 'C3', machine: 'EM200', format: 'EM200_ASTM', resultMatchField: '2', machineResultParam: 'f_sam...', machineResultSegment: 'O', pFrom: '0', pTo: '0', orderMatchField: '1', machineOrderParam: 'f_sran...', machineOrderSegment: 'Q', queryMode: 'Q', subResultSegment: '' },
  { id: 'C4', machine: 'MAGLUMI800', format: 'Maglumi_ASTM', resultMatchField: '2', machineResultParam: 'f_sam...', machineResultSegment: 'O', pFrom: '0', pTo: '0', orderMatchField: '1', machineOrderParam: 'f_sran...', machineOrderSegment: 'Q', queryMode: 'Q', subResultSegment: '' },
  { id: 'C5', machine: 'TOSOHGX', format: 'ASTM', resultMatchField: '2', machineResultParam: 'f_sam...', machineResultSegment: 'O', pFrom: '0', pTo: '0', orderMatchField: '0', machineOrderParam: '', machineOrderSegment: '', queryMode: '', subResultSegment: '' },
  { id: 'C6', machine: 'A15', format: 'ASTM', resultMatchField: '2', machineResultParam: 'f_sam...', machineResultSegment: 'O', pFrom: '0', pTo: '0', orderMatchField: '0', machineOrderParam: '', machineOrderSegment: '', queryMode: '', subResultSegment: '' },
  { id: 'C7', machine: 'H33S', format: 'HL7', resultMatchField: '2', machineResultParam: 'Entity', machineResultSegment: 'OBR', pFrom: '0', pTo: '0', orderMatchField: '0', machineOrderParam: '', machineOrderSegment: '', queryMode: '', subResultSegment: '' },
  { id: 'C8', machine: 'Sysmex_XN550', format: 'ASTM_V1', resultMatchField: '2', machineResultParam: 'f_sam...', machineResultSegment: 'O', pFrom: '0', pTo: '0', orderMatchField: '1', machineOrderParam: 'f_sran...', machineOrderSegment: 'Q', queryMode: 'Q', subResultSegment: '' },
  { id: 'C9', machine: 'AVECON_HMT60P', format: 'HL7', resultMatchField: '2', machineResultParam: 'Entity', machineResultSegment: 'OBR', pFrom: '0', pTo: '0', orderMatchField: '0', machineOrderParam: '', machineOrderSegment: '', queryMode: '', subResultSegment: '' }
];

const INITIAL_PARAMS = [
  { id: 'P1', machine: 'BC3600', parameter: 'HGB', header: 'R', configId: '1' },
  { id: 'P2', machine: 'BC3600', parameter: 'RBC', header: 'R', configId: '1' },
  { id: 'P3', machine: 'BC3600', parameter: 'WBC', header: 'R', configId: '1' },
  { id: 'P4', machine: 'BC3600', parameter: 'PLT', header: 'R', configId: '1' },
  { id: 'P5', machine: 'BC3600', parameter: 'GR%', header: 'R', configId: '1' },
  { id: 'P6', machine: 'BC3600', parameter: 'LY%', header: 'R', configId: '1' },
  { id: 'P7', machine: 'BC3600', parameter: 'MO%', header: 'R', configId: '1' },
  { id: 'P8', machine: 'BC3600', parameter: 'MCV', header: 'R', configId: '1' },
  { id: 'P9', machine: 'BC3600', parameter: 'MCH', header: 'R', configId: '1' },
  { id: 'P10', machine: 'BC3600', parameter: 'MCHC', header: 'R', configId: '1' }
];

const INITIAL_MAPPINGS = [
  { id: 'MAP1', machine: 'BC3600', machineParam: 'HGB', testParamName: 'HAEMOGLOBIN', displayName: 'Haemoglobin', shortName: 'HB', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP2', machine: 'BC3600', machineParam: 'RBC', testParamName: 'R.B.C.Count', displayName: 'RBC Count', shortName: 'RBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP3', machine: 'BC3600', machineParam: 'WBC', testParamName: 'W.B.C.Count', displayName: 'Total WBC Count', shortName: 'CBC', decimalPlaces: 2, expression: '*1000', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP4', machine: 'BC3600', machineParam: 'PLT', testParamName: 'PLATELET COUNT', displayName: 'Platelet Count', shortName: 'CBC', decimalPlaces: 2, expression: '*1000', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP5', machine: 'BC3600', machineParam: 'RDW-CV', testParamName: 'RDW (CV)', displayName: 'Complete Blood Count', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP6', machine: 'BC3600', machineParam: 'MCV', testParamName: 'M.C.V.', displayName: 'Mean Corpuscular Volume', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP7', machine: 'BC3600', machineParam: 'MCH', testParamName: 'M.C.H.', displayName: 'M.C.H.', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP8', machine: 'BC3600', machineParam: 'MCHC', testParamName: 'M.C.H.C.', displayName: 'M.C.H.C.', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP9', machine: 'BC3600', machineParam: 'HCT', testParamName: 'P.C.V.', displayName: 'Packed Cell Volume', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP10', machine: 'BC3600', machineParam: 'MPV', testParamName: 'M.P.V*', displayName: 'Mean Platelet Volume', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP11', machine: 'BC3600', machineParam: 'LY%', testParamName: 'Lymphocytes', displayName: 'Lymphocytes', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP12', machine: 'BC3600', machineParam: 'MO%', testParamName: 'Monocytes', displayName: 'Monocytes', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP13', machine: 'A15', machineParam: 'GLUC', testParamName: 'Blood Sugar - Fasting', displayName: 'Blood sugar- FBS', shortName: 'FBS', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP14', machine: 'A15', machineParam: 'GLUC', testParamName: 'Random Blood Sugar', displayName: 'Random Blood', shortName: 'RBS', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP15', machine: 'A15', machineParam: 'GLUC', testParamName: 'Blood Sugar - PP', displayName: 'Blood sugar- PPBS', shortName: 'PPBS', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP16', machine: 'A15', machineParam: 'CHOL', testParamName: 'Total Cholesterol', displayName: 'Cholesterol Total', shortName: 'LIPID', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP17', machine: 'A15', machineParam: 'CHOL', testParamName: 'HDL Cholesterol', displayName: 'HDL Direct', shortName: 'LIPID', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP18', machine: 'A15', machineParam: 'CHOL', testParamName: 'LDL Direct', displayName: 'CHOLESTEROL - LDL', shortName: 'LIPID', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP19', machine: 'A15', machineParam: 'CHOL', testParamName: 'Triglycerides', displayName: 'Triglycerides', shortName: 'LIPID', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP20', machine: 'A15', machineParam: 'ALBU', testParamName: 'ALBUMIN', displayName: 'Albumin ,Serum', shortName: 'ALB', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP21', machine: 'A15', machineParam: 'BICARB', testParamName: 'Bicarbonate', displayName: 'Bicarbonate', shortName: 'Bicarbonate', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP22', machine: 'A15', machineParam: 'LDH', testParamName: 'Lactate Dehydrogenase', displayName: 'LDH (Lactate Fluid)', shortName: 'Fluid LDH', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP23', machine: 'A15', machineParam: 'CPK', testParamName: 'CKMB', displayName: 'Serum CPK MB', shortName: 'CPK MB', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP24', machine: 'A15', machineParam: 'CHOLIN', testParamName: 'Cholinesterase', displayName: 'CHOLINESTERASE', shortName: 'CHOLINESTERASE', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP25', machine: 'EM200', machineParam: 'TBIL-PS', testParamName: 'Bilirubin (Total)', displayName: 'LIVER FUNCTION TEST', shortName: 'LFT', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP26', machine: 'AVECON_HMT60P', machineParam: 'HGB', testParamName: 'HAEMOGLOBIN', displayName: 'Haemoglobin', shortName: 'HB', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP27', machine: 'AVECON_HMT60P', machineParam: 'RBC', testParamName: 'R.B.C.Count', displayName: 'RBC Count', shortName: 'RBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP28', machine: 'AVECON_HMT60P', machineParam: 'WBC', testParamName: 'W.B.C.Count', displayName: 'Total WBC Count', shortName: 'CBC', decimalPlaces: 2, expression: '*1000', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP29', machine: 'AVECON_HMT60P', machineParam: 'PLT', testParamName: 'PLATELET COUNT', displayName: 'Platelet Count', shortName: 'CBC', decimalPlaces: 2, expression: '*1000', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP30', machine: 'AVECON_HMT60P', machineParam: 'MCV', testParamName: 'M.C.V.', displayName: 'Mean Corpuscular Volume', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP31', machine: 'AVECON_HMT60P', machineParam: 'MCH', testParamName: 'M.C.H.', displayName: 'M.C.H.', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP32', machine: 'AVECON_HMT60P', machineParam: 'MCHC', testParamName: 'M.C.H.C.', displayName: 'M.C.H.C.', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 },
  { id: 'MAP33', machine: 'AVECON_HMT60P', machineParam: 'HCT', testParamName: 'P.C.V.', displayName: 'Packed Cell Volume', shortName: 'CBC', decimalPlaces: 2, expression: 'NULL', checkField: '', pFrom: 0, pTo: 0 }
];

export const MachineInterface = () => {
  const { addNotification } = useLab();

  // Accordion Sections (Clinical Interface & Automation Engine Sections)
  const [openSections, setOpenSections] = useState({
    qcGate: true,
    bidirectional: true,
    serial: true,
    machines: false,
    config: false,
    params: false,
    mapping: true
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // State data with LocalStorage & Backend Sync
  const [machines, setMachines] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_analyzer_machines');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MACHINES;
  });

  const [configs, setConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_analyzer_configs');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CONFIGS;
  });

  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_analyzer_params');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PARAMS;
  });

  const [mappings, setMappings] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_analyzer_mappings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MAPPINGS;
  });

  // Fetch live backend machines on mount
  React.useEffect(() => {
    fetch('http://localhost:5000/api/machines')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setMachines(prev => {
            const map = new Map();
            prev.forEach(m => map.set(m.name.toUpperCase(), m));
            data.forEach(m => map.set(m.name.toUpperCase(), m));
            const merged = Array.from(map.values());
            localStorage.setItem('pulselab_analyzer_machines', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Search filter
  const [mappingSearch, setMappingSearch] = useState('');

  // Live Hardware Socket Stream & WebSocket State
  const [hardwareStatus, setHardwareStatus] = useState({ port: 8080, status: 'ONLINE', activeConnections: 0 });
  const [rawStreamQueue, setRawStreamQueue] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [wsStatus, setWsStatus] = useState('CONNECTING'); // 'CONNECTED' | 'FALLBACK_POLLING'

  // QC Staging Gate State
  const [stagedQueue, setStagedQueue] = useState([]);
  const [isCommittingId, setIsCommittingId] = useState(null);

  // Bi-Directional Order Query State
  const [queryBarcode, setQueryBarcode] = useState('SMP-951143-1');
  const [queryLogs, setQueryLogs] = useState([]);
  const [lastQueryResult, setLastQueryResult] = useState(null);
  const [isQuerying, setIsQuerying] = useState(false);

  // RS-232 Physical & Virtual COM Port State
  const [comPorts, setComPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState('COM1');
  const [baudRate, setBaudRate] = useState(9600);
  const [serialStatus, setSerialStatus] = useState({ status: 'DISCONNECTED', bytesRead: 0 });
  const [isSerialLoading, setIsSerialLoading] = useState(false);

  const fetchHardwareInfo = () => {
    fetch('http://localhost:5000/api/hardware/status')
      .then(res => res.json())
      .then(data => setHardwareStatus(data))
      .catch(() => {});
    
    fetch('http://localhost:5000/api/hardware/raw-stream-queue')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRawStreamQueue(data);
      })
      .catch(() => {});
  };

  const fetchStagedQueue = () => {
    fetch('http://localhost:5000/api/hardware/qc-staged')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStagedQueue(data);
      })
      .catch(() => {});
  };

  const fetchComPorts = () => {
    fetch('http://localhost:5000/api/hardware/com-ports')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.availablePorts)) {
          setComPorts(data.availablePorts);
          if (data.availablePorts.length > 0 && !data.availablePorts.includes(selectedPort)) {
            setSelectedPort(data.availablePorts[0]);
          }
        }
      })
      .catch(() => {});
  };

  const fetchSerialStatus = () => {
    fetch('http://localhost:5000/api/hardware/serial-status')
      .then(res => res.json())
      .then(data => {
        if (data && data.status) setSerialStatus(data);
      })
      .catch(() => {});
  };

  const fetchQueryLogs = () => {
    fetch('http://localhost:5000/api/machines/query-logs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setQueryLogs(data);
      })
      .catch(() => {});
  };

  // 1. WebSocket Live Stream Connection with Polling Fallback
  React.useEffect(() => {
    fetchHardwareInfo();
    fetchStagedQueue();
    fetchComPorts();
    fetchSerialStatus();
    fetchQueryLogs();

    let ws = null;
    let isMounted = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname ? `${window.location.hostname}:5000` : 'localhost:5000';
      ws = new WebSocket(`${protocol}//${host}/ws`);

      ws.onopen = () => {
        if (isMounted) setWsStatus('CONNECTED');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'ANALYZER_PACKET_RECEIVED') {
            fetchHardwareInfo();
            fetchStagedQueue();
            addNotification('Real-Time Packet Ingested', `Packet captured from ${payload.data?.rawEntry?.channel || 'Analyzer'}`, 'info');
          } else if (payload.type === 'BIDIRECTIONAL_ORDER_DISPATCHED') {
            fetchQueryLogs();
            addNotification('Bi-Directional Order Dispatched', `Worklist order sent to analyzer for ${payload.data?.barcode}`, 'success');
          } else if (payload.type === 'QC_STAGED_COMMITTED' || payload.type === 'QC_STAGED_REJECTED') {
            fetchStagedQueue();
          }
        } catch (err) {}
      };

      ws.onerror = () => {
        if (isMounted) setWsStatus('FALLBACK_POLLING');
      };

      ws.onclose = () => {
        if (isMounted) setWsStatus('FALLBACK_POLLING');
      };
    } catch (e) {
      setWsStatus('FALLBACK_POLLING');
    }

    // Backup polling interval (runs every 3s as fallback)
    const interval = setInterval(() => {
      fetchHardwareInfo();
      fetchStagedQueue();
      fetchSerialStatus();
    }, 3000);

    return () => {
      isMounted = false;
      if (ws) ws.close();
      clearInterval(interval);
    };
  }, []);

  // QC Staging Gate Actions
  const handleCommitStaged = async (stagedId) => {
    setIsCommittingId(stagedId);
    try {
      const res = await fetch('http://localhost:5000/api/hardware/qc-staged/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagedId, techName: 'Authorized Lab Technologist' })
      });
      const data = await res.json();
      if (res.ok) {
        addNotification('QC Gate Approved', 'Results verified and committed into active patient record!', 'success');
        fetchStagedQueue();
      } else {
        addNotification('QC Gate Error', data.error || 'Could not commit result', 'error');
      }
    } catch (e) {
      addNotification('Commit Error', e.message, 'error');
    } finally {
      setIsCommittingId(null);
    }
  };

  const handleRejectStaged = async (stagedId) => {
    try {
      const res = await fetch('http://localhost:5000/api/hardware/qc-staged/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stagedId, reason: 'Technical review flag: Hemolyzed or unstable specimen' })
      });
      if (res.ok) {
        addNotification('Sample Rejected', 'Staged analyzer result rejected and archived.', 'info');
        fetchStagedQueue();
      }
    } catch (e) {
      addNotification('Reject Error', e.message, 'error');
    }
  };

  // Bi-Directional Query Action
  const handleSendOrderQuery = async () => {
    if (!queryBarcode.trim()) return;
    setIsQuerying(true);
    setLastQueryResult(null);
    try {
      const res = await fetch('http://localhost:5000/api/machines/query-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: queryBarcode.trim() })
      });
      const data = await res.json();
      setLastQueryResult(data);
      if (data.found) {
        addNotification('Bi-Directional Order Found', `Found order for ${data.patient?.name || data.barcode} - Tests: ${data.testCodes}`, 'success');
      } else {
        addNotification('Query Completed', 'No matching order for this barcode. Analyzer will receive termination frame.', 'info');
      }
      fetchQueryLogs();
    } catch (e) {
      addNotification('Query Failed', e.message, 'error');
    } finally {
      setIsQuerying(false);
    }
  };

  // RS-232 COM Port Actions
  const handleConnectSerial = async () => {
    setIsSerialLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/hardware/com-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port: selectedPort, baudRate: Number(baudRate) })
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Serial Port Online', `Listening to ${selectedPort} at ${baudRate} baud`, 'success');
        fetchSerialStatus();
      } else {
        addNotification('Serial Notice', data.error || 'Port notice', 'info');
      }
    } catch (e) {
      addNotification('Serial Connection Error', e.message, 'error');
    } finally {
      setIsSerialLoading(false);
    }
  };

  const handleDisconnectSerial = async () => {
    setIsSerialLoading(true);
    try {
      await fetch('http://localhost:5000/api/hardware/com-disconnect', { method: 'POST' });
      addNotification('Serial Disconnected', 'COM port closed.', 'info');
      fetchSerialStatus();
    } catch (e) {
      addNotification('Disconnect Error', e.message, 'error');
    } finally {
      setIsSerialLoading(false);
    }
  };

  const handleSimulateAvecon = async () => {
    setIsSimulating(true);
    try {
      const aveconHL7 = [
        `MSH|^~\\&|AVECON|HMT60P|||20260928133737||ORU^R01|1|P|2.3.1`,
        `PID|1||||Mr..Utkarsh Rahangda`,
        `OBR|1||SMP-951143-1|CBC|||20260928133737`,
        `OBX|1|NM|WBC||8.3|10^3/uL|4.0-10.0|N|||F`,
        `OBX|2|NM|RBC||5.04|10^6/uL|3.8-5.8|N|||F`,
        `OBX|3|NM|HGB||13.9|g/dL|11.5-17.5|N|||F`,
        `OBX|4|NM|HCT||47.9|%|35.0-50.0|N|||F`,
        `OBX|5|NM|MCV||94.9|fL|80.0-100.0|N|||F`,
        `OBX|6|NM|MCH||27.6|pg|27.0-34.0|N|||F`,
        `OBX|7|NM|MCHC||29.1|g/dL|31.0-37.0|L|||F`,
        `OBX|8|NM|PLT||279|10^3/uL|150-450|N|||F`,
        `OBX|9|NM|Lymph%||41.9|%|20.0-40.0|H|||F`,
        `OBX|10|NM|Mid%||7.7|%|3.0-15.0|N|||F`,
        `OBX|11|NM|Gran%||50.4|%|50.0-70.0|N|||F`
      ].join('\r');

      const res = await fetch('http://localhost:5000/api/machines/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineName: 'AVECON HMT-60P',
          barcode: 'SMP-951143-1'
        })
      });

      if (res.ok) {
        addNotification('Machine Ingestion Success', 'Live AVECON test packet processed into QC Staging Gate!', 'success');
        fetchStagedQueue();
      }
    } catch (e) {
      addNotification('Simulation notice', 'Local simulation signal recorded.', 'info');
    } finally {
      setIsSimulating(false);
    }
  };

  // Form States
  const [machineInput, setMachineInput] = useState('');

  const [configForm, setConfigForm] = useState({
    machine: 'BC3600',
    format: 'ASTM',
    resultMatchField: '2',
    machineResultParam: 'f_sam...',
    machineResultSegment: 'O',
    pFrom: '0',
    pTo: '0',
    orderMatchField: '0',
    machineOrderParam: '',
    machineOrderSegment: '',
    queryMode: '',
    subResultSegment: ''
  });

  const [paramForm, setParamForm] = useState({
    machine: 'BC3600',
    parameter: 'HGB',
    header: 'R',
    configId: '1'
  });

  const [mappingForm, setMappingForm] = useState({
    machine: 'BC3600',
    type: 'Display Name',
    testParam: 'HAEMOGLOBIN',
    parameter: 'HGB',
    decimalPlaces: 2,
    expression: 'NULL',
    checkField: '',
    pFrom: 0,
    pTo: 0
  });

  // Handlers
  const handleAddMachine = (e) => {
    e.preventDefault();
    if (!machineInput.trim()) return;
    const name = machineInput.trim().toUpperCase();
    const item = { id: `M${Date.now()}`, name };
    const updated = [...machines, item];
    setMachines(updated);
    localStorage.setItem('pulselab_analyzer_machines', JSON.stringify(updated));
    setMachineInput('');
    addNotification('Machine Added', `Analyzer "${item.name}" registered in Machine-Master.`, 'success');

    // Auto-select newly added machine in forms
    setConfigForm(prev => ({ ...prev, machine: name }));
    setParamForm(prev => ({ ...prev, machine: name }));
    setMappingForm(prev => ({ ...prev, machine: name }));

    fetch('http://localhost:5000/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    }).catch(() => {});
  };

  const handleDeleteMachine = (id) => {
    const updated = machines.filter(m => m.id !== id);
    setMachines(updated);
    localStorage.setItem('pulselab_analyzer_machines', JSON.stringify(updated));
    fetch(`http://localhost:5000/api/machines/${id}`, { method: 'DELETE' }).catch(() => {});
    addNotification('Machine Removed', 'Analyzer deleted from registry.', 'info');
  };

  const handleAddConfig = (e) => {
    e.preventDefault();
    const item = { id: `C${Date.now()}`, ...configForm };
    const updated = [...configs, item];
    setConfigs(updated);
    localStorage.setItem('pulselab_analyzer_configs', JSON.stringify(updated));
    addNotification('Configuration Saved', `Protocol format "${configForm.format}" configured for ${configForm.machine}.`, 'success');
  };

  const handleDeleteConfig = (id) => {
    const updated = configs.filter(c => c.id !== id);
    setConfigs(updated);
    localStorage.setItem('pulselab_analyzer_configs', JSON.stringify(updated));
  };

  const handleAddParam = (e) => {
    e.preventDefault();
    const item = { id: `P${Date.now()}`, ...paramForm };
    const updated = [...params, item];
    setParams(updated);
    localStorage.setItem('pulselab_analyzer_params', JSON.stringify(updated));
    addNotification('Parameter Added', `Parameter ${paramForm.parameter} added to Machine Parameter - Master.`, 'success');
  };

  const handleDeleteParam = (id) => {
    const updated = params.filter(p => p.id !== id);
    setParams(updated);
    localStorage.setItem('pulselab_analyzer_params', JSON.stringify(updated));
  };

  const handleAddMapping = (e) => {
    e.preventDefault();
    const item = {
      id: `MAP${Date.now()}`,
      machine: mappingForm.machine,
      machineParam: mappingForm.parameter,
      testParamName: mappingForm.testParam,
      displayName: mappingForm.testParam,
      shortName: mappingForm.parameter,
      decimalPlaces: Number(mappingForm.decimalPlaces),
      expression: mappingForm.expression || 'NULL',
      checkField: mappingForm.checkField,
      pFrom: Number(mappingForm.pFrom),
      pTo: Number(mappingForm.pTo)
    };
    const updated = [...mappings, item];
    setMappings(updated);
    localStorage.setItem('pulselab_analyzer_mappings', JSON.stringify(updated));
    addNotification('Mapping Saved', `Mapped ${mappingForm.parameter} to ${mappingForm.testParam} (Expression: ${item.expression}).`, 'success');
  };

  const handleDeleteMapping = (id) => {
    const updated = mappings.filter(m => m.id !== id);
    setMappings(updated);
    localStorage.setItem('pulselab_analyzer_mappings', JSON.stringify(updated));
  };

  const filteredMappings = (mappings || []).filter(m =>
    (m.machine || '').toLowerCase().includes(mappingSearch.toLowerCase()) ||
    (m.machineParam || '').toLowerCase().includes(mappingSearch.toLowerCase()) ||
    (m.testParamName || '').toLowerCase().includes(mappingSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-200">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900">Machine Interface Configuration Master</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                Automated Protocol Engine
              </span>
            </div>
            <p className="text-xs text-slate-500">Universal ASTM, HL7, Cobas, Sysmex, BioMerieux, Maglumi format mapping & parameter multipliers</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {wsStatus === 'CONNECTED' ? (
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-emerald-800">WebSocket Live Sync: ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-amber-800">Live Sync: 3s Polling</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-sky-500"></span>
            <span className="text-slate-700">TCP Port {hardwareStatus.port || 8080}: LISTENING</span>
          </div>

          <button
            type="button"
            onClick={handleSimulateAvecon}
            disabled={isSimulating}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>{isSimulating ? 'Processing...' : '⚡ Test AVECON Result'}</span>
          </button>
        </div>
      </div>

      {/* Live Captured Stream Feed */}
      {rawStreamQueue.length > 0 && (
        <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-extrabold text-white">Live Ingested Analyzer Packets ({rawStreamQueue.length})</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Auto-Ingestion Engine Active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {rawStreamQueue.slice(0, 6).map((item) => (
              <div key={item.streamId} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span className="text-sky-400 font-bold">{item.channel}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-amber-300 font-mono">{item.barcode}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${item.parsingStatus === 'MATCHED_TO_PATIENT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'}`}>
                    {item.parsingStatus === 'MATCHED_TO_PATIENT' ? '✓ Matched to Patient' : 'Captured'}
                  </span>
                </div>
                {item.matchedPatientName && (
                  <p className="text-[11px] text-emerald-400 font-medium">Patient: {item.matchedPatientName}</p>
                )}
                <p className="text-[10px] text-slate-500 font-mono truncate">{item.payloadText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accordion List */}
      <div className="space-y-4">
        
        {/* ================= 0A. QC VALIDATION GATE & STAGING QUEUE ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('qcGate')}
            className="w-full p-4 bg-amber-500/10 hover:bg-amber-500/15 transition-colors flex items-center justify-between font-bold text-xs text-slate-900"
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>QC Validation Gate & Staging Queue ({stagedQueue.filter(s => s.status === 'PENDING_REVIEW').length} Pending Verification)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                Panic Limit & Delta Guard
              </span>
            </div>
            {openSections.qcGate ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.qcGate && (
            <div className="p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p>
                  Incoming analyzer results are held in this clinical staging gate for technical review before permanent entry into patient records.
                  Critical panic limits (e.g. Hb &lt; 7.0, WBC &gt; 30k) and historical delta shifts are automatically flagged.
                </p>
                <button
                  type="button"
                  onClick={fetchStagedQueue}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-xs flex items-center space-x-1 shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {stagedQueue.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold">All analyzer results verified. Staging queue is clear.</p>
                  <p className="text-[11px] text-slate-400">Incoming packets from Port 8080 or COM ports will stage here automatically.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stagedQueue.slice(0, 8).map((item) => (
                    <div
                      key={item.stagedId}
                      className={`p-4 rounded-xl border transition-all text-xs space-y-3 ${
                        item.hasPanic
                          ? 'bg-rose-50/50 border-rose-300'
                          : item.hasAbnormal
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{item.barcode}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-slate-800">{item.patientName || 'Unassigned Sample'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({item.channel})</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'COMMITTED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.status === 'AUTO_ACCEPTED'
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : item.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            }`}
                          >
                            {item.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Delta alert banner */}
                      {item.deltaAlerts && item.deltaAlerts.length > 0 && (
                        <div className="bg-amber-100/70 text-amber-900 border border-amber-300 p-2 rounded-lg text-[11px] flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Delta Check Alert:</strong> Drastic shift detected compared to prior tests (
                            {item.deltaAlerts.map(d => `${d.parameter}: ${d.percentChange}% shift`).join(', ')})
                          </span>
                        </div>
                      )}

                      {/* Parameters Grid */}
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(item.parameters || {}).map(([param, val]) => {
                          const evalInfo = item.evaluatedParams?.[param];
                          const isPanic = evalInfo?.flag?.includes('CRITICAL');
                          const isAbnormal = evalInfo?.flag === 'HIGH' || evalInfo?.flag === 'LOW';

                          return (
                            <div
                              key={param}
                              className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center space-x-1.5 ${
                                isPanic
                                  ? 'bg-rose-600 text-white border-rose-700 font-bold'
                                  : isAbnormal
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                                  : 'bg-slate-100 text-slate-800 border-slate-200'
                              }`}
                            >
                              <span>{param}:</span>
                              <span className="font-bold">{val}</span>
                              {evalInfo?.flag === 'CRITICAL_HIGH' && <span>▲▲</span>}
                              {evalInfo?.flag === 'CRITICAL_LOW' && <span>▼▼</span>}
                              {evalInfo?.flag === 'HIGH' && <span>▲</span>}
                              {evalInfo?.flag === 'LOW' && <span>▼</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      {item.status === 'PENDING_REVIEW' && (
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => handleCommitStaged(item.stagedId)}
                            disabled={isCommittingId === item.stagedId}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{isCommittingId === item.stagedId ? 'Committing...' : '✓ Approve & Commit to Patient'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectStaged(item.stagedId)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-all cursor-pointer flex items-center space-x-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject Artifact</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 0B. BI-DIRECTIONAL ORDER DISPATCHER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('bidirectional')}
            className="w-full p-4 bg-indigo-500/10 hover:bg-indigo-500/15 transition-colors flex items-center justify-between font-bold text-xs text-slate-900"
          >
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
              <span>Bi-Directional Order Dispatcher (ASTM Q / HL7 QRY Hub)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 font-mono">
                Host-Query Active
              </span>
            </div>
            {openSections.bidirectional ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.bidirectional && (
            <div className="p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p>
                  <strong>Bi-directional Host Query Mode:</strong> When an analyzer scans a tube barcode, it queries the LIMS (ASTM <code>Q</code> record or HL7 <code>QRY^Q02</code>).
                  The LIMS instantly responds with the patient&apos;s booked test list (e.g. <code>^^^CBC\^^^LIPID</code>), instructing the machine what tests to perform automatically.
                </p>
              </div>

              {/* Interactive Query Simulator Box */}
              <div className="bg-slate-950 p-4 rounded-xl text-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300">Simulate Analyzer Host Query (Barcode Lookup)</span>
                  <span className="text-[10px] font-mono text-slate-400">ASTM 1394-97 & HL7 v2.5</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={queryBarcode}
                    onChange={(e) => setQueryBarcode(e.target.value)}
                    placeholder="Enter Barcode / Sample ID (e.g. SMP-951143-1)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendOrderQuery}
                    disabled={isQuerying}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isQuerying ? 'Querying...' : 'Dispatch Order to Machine'}</span>
                  </button>
                </div>

                {lastQueryResult && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">
                        Result: {lastQueryResult.found ? (
                          <span className="text-emerald-400">✓ Order Found for {lastQueryResult.patient?.name} ({lastQueryResult.barcode})</span>
                        ) : (
                          <span className="text-amber-400">⚠️ No Order Found ({lastQueryResult.barcode})</span>
                        )}
                      </span>
                      {lastQueryResult.testCodes && (
                        <span className="text-[11px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                          {lastQueryResult.testCodes}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono mb-1">Raw Response Dispatched over Socket:</p>
                      <pre className="bg-slate-950 p-2 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap border border-slate-800">
                        {lastQueryResult.responsePayload}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Query History Log */}
              {queryLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Recent Bi-Directional Query Dispatches</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2">Timestamp</th>
                          <th className="px-3 py-2">Barcode</th>
                          <th className="px-3 py-2">Patient</th>
                          <th className="px-3 py-2">Ordered Battery</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {queryLogs.slice(0, 5).map((log) => (
                          <tr key={log.queryId} className="hover:bg-slate-50/60 font-mono text-[11px]">
                            <td className="px-3 py-1.5 text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="px-3 py-1.5 font-bold text-indigo-700">{log.barcode}</td>
                            <td className="px-3 py-1.5 font-sans font-medium text-slate-800">{log.patientName}</td>
                            <td className="px-3 py-1.5 text-slate-600">{log.tests}</td>
                            <td className="px-3 py-1.5 text-emerald-600 font-bold">✓ DISPATCHED</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= 0C. RS-232 COM PORT MANAGER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('serial')}
            className="w-full p-4 bg-teal-500/10 hover:bg-teal-500/15 transition-colors flex items-center justify-between font-bold text-xs text-slate-900"
          >
            <div className="flex items-center space-x-2">
              <Cable className="h-4 w-4 text-teal-600" />
              <span>RS-232 Serial Port Driver (Physical COM Port Connectors)</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                serialStatus.status === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
                {serialStatus.status}
              </span>
            </div>
            {openSections.serial ? <ChevronDown className="h-4 w-4 text-slate-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.serial && (
            <div className="p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p>
                  Connect directly to analyzers using 9-pin DB9 RS-232 serial cables or USB-to-RS232 adapters (FTDI, Prolific, CH340).
                  Incoming serial frames are automatically parsed and funneled into the LIMS QC Staging Gate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">Available COM Port</label>
                    <button
                      type="button"
                      onClick={fetchComPorts}
                      className="text-[10px] text-teal-600 hover:text-teal-800 font-bold flex items-center space-x-0.5"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Scan</span>
                    </button>
                  </div>
                  <select
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    disabled={serialStatus.status === 'CONNECTED'}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-xs"
                  >
                    {comPorts.length > 0 ? (
                      comPorts.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))
                    ) : (
                      <option value="COM1">COM1 (Standard)</option>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Baud Rate</label>
                  <select
                    value={baudRate}
                    onChange={(e) => setBaudRate(e.target.value)}
                    disabled={serialStatus.status === 'CONNECTED'}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-xs"
                  >
                    {[9600, 19200, 38400, 57600, 115200].map(b => (
                      <option key={b} value={b}>{b} baud</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  {serialStatus.status === 'CONNECTED' ? (
                    <button
                      type="button"
                      onClick={handleDisconnectSerial}
                      disabled={isSerialLoading}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                    >
                      Disconnect {selectedPort}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectSerial}
                      disabled={isSerialLoading}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Cable className="h-3.5 w-3.5" />
                      <span>{isSerialLoading ? 'Connecting...' : `Connect ${selectedPort}`}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Bar */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-700 gap-2">
                <div className="flex items-center space-x-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${serialStatus.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>Port: <strong>{serialStatus.port || selectedPort}</strong> ({serialStatus.baudRate || baudRate} baud)</span>
                </div>
                <div>
                  <span>Total Bytes Ingested: <strong>{serialStatus.bytesRead || 0} bytes</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* ================= 1. MACHINE-MASTER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('machines')}
            className="w-full p-4 bg-slate-100/70 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Layers className="h-4 w-4 text-sky-600" />
              <span>Machine-Master ({machines.length} Diagnostic Analyzers)</span>
            </div>
            {openSections.machines ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.machines && (
            <div className="p-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
              
              {/* Left Table */}
              <div className="lg:col-span-8 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-16">Edit</th>
                      <th className="px-3 py-2 w-16">Delete</th>
                      <th className="px-4 py-2">MachineName</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {machines.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2">
                          <button className="text-sky-600 hover:text-sky-800 font-medium text-[11px]">Edit</button>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => handleDeleteMachine(m.id)} className="text-rose-600 hover:text-rose-800 font-medium text-[11px]">Delete</button>
                        </td>
                        <td className="px-4 py-2 font-mono font-bold text-slate-900">{m.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Form */}
              <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold uppercase text-slate-700">Add New Machine</h4>
                <form onSubmit={handleAddMachine} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Machine Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MINDRAY_BC3600"
                      value={machineInput}
                      onChange={(e) => setMachineInput(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setMachineInput('')}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>

        {/* ================= 2. MACHINE CONFIGURATION - MASTER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('config')}
            className="w-full p-4 bg-slate-100/70 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>Machine Configuration - Master (Protocol Formats & Segment Parameters)</span>
            </div>
            {openSections.config ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.config && (
            <div className="p-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
              
              {/* Left Table */}
              <div className="lg:col-span-8 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[9px] border-b border-slate-200">
                    <tr>
                      <th className="px-2 py-2">Edit</th>
                      <th className="px-2 py-2">Delete</th>
                      <th className="px-3 py-2">MachineName</th>
                      <th className="px-3 py-2">Format Details</th>
                      <th className="px-2 py-2">Resultmatch Field</th>
                      <th className="px-2 py-2">MachineResultParam</th>
                      <th className="px-2 py-2">MachineResultSegment</th>
                      <th className="px-2 py-2">pFrom</th>
                      <th className="px-2 py-2">pTo</th>
                      <th className="px-2 py-2">OrderMatchField</th>
                      <th className="px-2 py-2">Querymode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {configs.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-2 py-2 text-sky-600 font-sans cursor-pointer">Edit</td>
                        <td className="px-2 py-2 text-rose-600 font-sans cursor-pointer" onClick={() => handleDeleteConfig(c.id)}>Delete</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{c.machine}</td>
                        <td className="px-3 py-2 text-indigo-700 font-semibold">{c.format}</td>
                        <td className="px-2 py-2 text-slate-600">{c.resultMatchField}</td>
                        <td className="px-2 py-2 text-slate-600">{c.machineResultParam}</td>
                        <td className="px-2 py-2 text-slate-600 font-bold">{c.machineResultSegment}</td>
                        <td className="px-2 py-2 text-slate-600">{c.pFrom}</td>
                        <td className="px-2 py-2 text-slate-600">{c.pTo}</td>
                        <td className="px-2 py-2 text-slate-600">{c.orderMatchField}</td>
                        <td className="px-2 py-2 text-slate-600">{c.queryMode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Form with Complete Protocol Format Dropdown */}
              <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold uppercase text-slate-700">Add / Edit Configuration</h4>
                
                <form onSubmit={handleAddConfig} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">MachineName</label>
                    <select
                      value={configForm.machine}
                      onChange={(e) => setConfigForm({ ...configForm, machine: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold"
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Protocol Format Details list */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Format Details</label>
                    <select
                      value={configForm.format}
                      onChange={(e) => setConfigForm({ ...configForm, format: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-bold text-indigo-800"
                    >
                      {ALL_PROTOCOL_FORMATS.map(fmt => (
                        <option key={fmt} value={fmt}>{fmt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">Resultmatch Field</label>
                      <input
                        type="text"
                        value={configForm.resultMatchField}
                        onChange={(e) => setConfigForm({ ...configForm, resultMatchField: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">MachineResultParam</label>
                      <input
                        type="text"
                        value={configForm.machineResultParam}
                        onChange={(e) => setConfigForm({ ...configForm, machineResultParam: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">ResultSegment</label>
                      <input
                        type="text"
                        value={configForm.machineResultSegment}
                        onChange={(e) => setConfigForm({ ...configForm, machineResultSegment: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">pFrom</label>
                      <input
                        type="text"
                        value={configForm.pFrom}
                        onChange={(e) => setConfigForm({ ...configForm, pFrom: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">pTo</label>
                      <input
                        type="text"
                        value={configForm.pTo}
                        onChange={(e) => setConfigForm({ ...configForm, pTo: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">OrderMatchField</label>
                      <input
                        type="text"
                        value={configForm.orderMatchField}
                        onChange={(e) => setConfigForm({ ...configForm, orderMatchField: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">Querymode</label>
                      <input
                        type="text"
                        value={configForm.queryMode}
                        onChange={(e) => setConfigForm({ ...configForm, queryMode: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-1 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfigForm({ machine: '', format: 'HL7', matchField: '2', param: 'Entity', segment: 'OBR', pFrom: 0, pTo: 0, orderField: 0, queryMode: '-' })}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>

              </div>

            </div>
          )}
        </div>

        {/* ================= 3. MACHINE PARAMETER - MASTER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('params')}
            className="w-full p-4 bg-slate-100/70 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Machine Parameter - Master (Analyzer Test Codes)</span>
            </div>
            {openSections.params ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.params && (
            <div className="p-5 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
              
              {/* Left Table */}
              <div className="lg:col-span-8 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-16">Edit</th>
                      <th className="px-3 py-2 w-16">Delete</th>
                      <th className="px-4 py-2">Parameter</th>
                      <th className="px-4 py-2">ParameterHeader</th>
                      <th className="px-4 py-2">MachineName</th>
                      <th className="px-4 py-2 text-center">Config ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {params.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3 py-2 text-sky-600 font-sans cursor-pointer">Edit</td>
                        <td className="px-3 py-2 text-rose-600 font-sans cursor-pointer" onClick={() => handleDeleteParam(p.id)}>Delete</td>
                        <td className="px-4 py-2 font-bold text-slate-900">{p.parameter}</td>
                        <td className="px-4 py-2 text-slate-600">{p.header}</td>
                        <td className="px-4 py-2 text-indigo-700 font-bold">{p.machine}</td>
                        <td className="px-4 py-2 text-center text-slate-500">{p.configId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Form */}
              <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <h4 className="font-bold uppercase text-slate-700">Add Machine Parameter</h4>
                <form onSubmit={handleAddParam} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">MachineName</label>
                    <select
                      value={paramForm.machine}
                      onChange={(e) => setParamForm({ ...paramForm, machine: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold"
                    >
                      {machines.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Parameter</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HGB"
                      value={paramForm.parameter}
                      onChange={(e) => setParamForm({ ...paramForm, parameter: e.target.value.toUpperCase() })}
                      className="w-full font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">ParameterHeader</label>
                    <input
                      type="text"
                      value={paramForm.header}
                      onChange={(e) => setParamForm({ ...paramForm, header: e.target.value })}
                      className="w-full font-mono bg-white border border-slate-300 rounded-lg p-1.5"
                    />
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setParamForm({ machine: '', parameter: '', header: 'R', configId: '1' })}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </div>

        {/* ================= 4. MACHINE MAPPING - MASTER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('mapping')}
            className="w-full p-4 bg-slate-100/70 hover:bg-slate-100 transition-colors flex items-center justify-between font-bold text-xs text-slate-800"
          >
            <div className="flex items-center space-x-2">
              <Link2 className="h-4 w-4 text-rose-600" />
              <span>Machine Mapping - Master (Parameter Formulas, Multipliers & Expressions)</span>
            </div>
            {openSections.mapping ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>

          {openSections.mapping && (
            <div className="p-5 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
              
              {/* Search Bar for Mappings */}
              <div className="flex items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Machine, Code or Test Name..."
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono font-medium">
                  {filteredMappings.length} Parameters Mapped
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Parameter Mapping Table */}
                <div className="lg:col-span-8 overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[9px] border-b border-slate-200">
                      <tr>
                        <th className="px-2 py-2">Edit</th>
                        <th className="px-2 py-2">Delete</th>
                        <th className="px-2 py-2">Machinename</th>
                        <th className="px-2 py-2">parameter</th>
                        <th className="px-3 py-2">TestParamName</th>
                        <th className="px-3 py-2">displayname</th>
                        <th className="px-2 py-2">Shortname</th>
                        <th className="px-2 py-2">DecimalPlaces</th>
                        <th className="px-2 py-2">Expression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {filteredMappings.map(map => (
                        <tr key={map.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-2 py-2 text-sky-600 cursor-pointer font-sans">Edit</td>
                          <td className="px-2 py-2 text-rose-600 cursor-pointer font-sans" onClick={() => handleDeleteMapping(map.id)}>Delete</td>
                          <td className="px-2 py-2 font-mono font-bold text-slate-900">{map.machine}</td>
                          <td className="px-2 py-2 font-mono font-bold text-indigo-700">{map.machineParam}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{map.testParamName}</td>
                          <td className="px-3 py-2 text-slate-600">{map.displayName}</td>
                          <td className="px-2 py-2 font-mono text-slate-500">{map.shortName}</td>
                          <td className="px-2 py-2 font-mono text-slate-600">{map.decimalPlaces}</td>
                          <td className="px-2 py-2 font-mono font-bold">
                            {map.expression !== 'NULL' ? (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                {map.expression}
                              </span>
                            ) : (
                              <span className="text-slate-400">NULL</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Right Parameter Mapping Form */}
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold uppercase text-slate-700">Add Machine Mapping</h4>

                  <form onSubmit={handleAddMapping} className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">MachineName</label>
                      <select
                        value={mappingForm.machine}
                        onChange={(e) => setMappingForm({ ...mappingForm, machine: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-bold"
                      >
                        {machines.map(m => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Select Type</label>
                        <select
                          value={mappingForm.type}
                          onChange={(e) => setMappingForm({ ...mappingForm, type: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5"
                        >
                          <option>Display Name</option>
                          <option>Short Name</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Test Parameter</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. HAEMOGLOBIN"
                          value={mappingForm.testParam}
                          onChange={(e) => setMappingForm({ ...mappingForm, testParam: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Parameter</label>
                        <select
                          value={mappingForm.parameter}
                          onChange={(e) => setMappingForm({ ...mappingForm, parameter: e.target.value })}
                          className="w-full font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5 text-indigo-800"
                        >
                          {['HCT', 'HGB', 'LYM#', 'LYM%', 'MCH', 'MCHC', 'MCV', 'MID#', 'MID%', 'MPV', 'GRAN#', 'GRAN%', 'PCT', 'PDW', 'PLT', 'RBC', 'RDW-CV', 'WBC', 'WBC Histogram', 'RBC Histogram', 'PLT Histogram', 'GLUC', 'CHOL', 'HDLC', 'TRIG', 'TBIL', 'CREAT', 'UREA'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">DecimalPlaces</label>
                        <input
                          type="number"
                          min="0"
                          max="4"
                          value={mappingForm.decimalPlaces}
                          onChange={(e) => setMappingForm({ ...mappingForm, decimalPlaces: e.target.value })}
                          className="w-full font-mono bg-white border border-slate-300 rounded-lg p-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Expression (e.g. <span className="font-mono text-amber-700">*1000</span>, <span className="font-mono text-amber-700">/10</span> or <span className="font-mono text-slate-400">NULL</span>)
                      </label>
                      <input
                        type="text"
                        placeholder="NULL or *1000"
                        value={mappingForm.expression}
                        onChange={(e) => setMappingForm({ ...mappingForm, expression: e.target.value })}
                        className="w-full font-mono font-bold bg-white border border-slate-300 rounded-lg p-1.5 text-amber-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600">pFrom</label>
                        <input
                          type="number"
                          value={mappingForm.pFrom}
                          onChange={(e) => setMappingForm({ ...mappingForm, pFrom: e.target.value })}
                          className="w-full font-mono bg-white border border-slate-300 rounded p-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600">pTo</label>
                        <input
                          type="number"
                          value={mappingForm.pTo}
                          onChange={(e) => setMappingForm({ ...mappingForm, pTo: e.target.value })}
                          className="w-full font-mono bg-white border border-slate-300 rounded p-1"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setMappingForm({ machine: '', selectType: 'Display Name', testParam: '', parameter: '', decimalPlaces: 2, expression: 'NULL', pFrom: 0, pTo: 0 })}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
