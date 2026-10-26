import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  INITIAL_PATIENTS,
  MASTER_DOCTORS,
  PATHOLOGISTS,
  B2B_CENTERS,
  REAGENTS_INVENTORY,
  QC_RUNS,
  VIAL_TYPES
} from '../data/mockData';
import { MASTER_TEST_CATALOG } from '../data/masterTestCatalog';
import { verifyLicenseKey } from '../utils/licenseCrypto';
import { verifyLicenseOnCloud } from '../config/firebase';

const API_BASE_URL = 'http://localhost:5000/api';

const DEFAULT_REPORT_DESIGN = {
  // Header Setup
  showHeaderOnReport: true,
  showHeaderForMobile: true,
  headerType: 'type1', // 'type1' (Custom Details) | 'type2' (Image Banner)
  labName: '',
  labAddress: '',
  
  // Main Report Setup
  configName: 'Four Column Report',
  reportType: 'Four Column Report',
  fontName: 'Arial',
  fontSize: '8',
  reportStartAfter: '2.0 Inch', // Top margin for pre-printed letterhead

  // Test Setup
  spaceInTestHeader: '20px',
  printTestOnNewPage: true, // 1 Test Per Page Rule
  columnHeaderFont: 'Arial',
  columnHeaderFontSize: '8',
  header1: 'Test Name',
  header2: 'Observed Values',
  header3: 'Unit',
  header4: 'Bio Ref. Interval',
  colHeaderBold: true,
  colHeaderItalic: false,
  colHeaderUnderline: true,
  colHeaderColor: 'Black',
  showHeaderBeforeTest: true,

  // Test & Parameter Font Setup
  testFont: 'Arial',
  testFontSize: '8',
  testBold: true,
  paramFont: 'Arial',
  paramFontSize: '8',

  // Footer Setup
  showFooterOnReport: true,
  showFooterForMobile: true,
  signatureFont: 'Arial',
  signatureFontSize: '8',
  doctorName: 'Dr. Pallavi Gedam',
  doctorDegree: 'MBBS, MD Pathology',
  doctorSignatureText: 'Dr. Pallavi Gedam\nMBBS, MD Pathology\nConsultant Pathologist',
  signatureImage: null, // Base64 or Image URL of uploaded Doctor's Signature Stamp
  showReportFooterText: true,
  reportFooterText: '*** ISO 15189:2022 Certified Laboratory • End of Medical Examination Report ***',
  footerFromBottom: '0.5 Inch',

  // Bill / Receipt Design Setup
  showBillHeader: true,
  billHeaderType: 'type1', // 'type1' (Custom Details) or 'type2' (Header Image)
  billLabName: 'Modern Diagnostic Pathology Laboratory',
  billLabAddress: 'Plot 42, Health City Complex, Medical Square, City Centre - 440010',
  billDoctorName: 'Dr. Pallavi Gedam (MBBS, MD Pathology)',
  billLogoImage: null,
  billHeaderImage: null
};

const LabContext = createContext();

export const LabProvider = ({ children }) => {
  // ================= 1. ALL COMPONENT STATES DECLARED FIRST =================
  const [licenseInfo, setLicenseInfo] = useState(() => {
    const saved = localStorage.getItem('pulselab_license_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const verification = verifyLicenseKey(parsed.labName || 'Modern Diagnostic Pathology Lab', parsed.licenseKey);
        if (verification.valid) {
          return {
            ...parsed,
            daysRemaining: verification.daysRemaining,
            totalSecondsRemaining: verification.totalSecondsRemaining,
            totalMinutesRemaining: verification.totalMinutesRemaining,
            totalHoursRemaining: verification.totalHoursRemaining,
            humanRemaining: verification.humanRemaining,
            expiryDate: verification.expiryDate,
            formattedExpiry: verification.formattedExpiry,
            isExpired: false
          };
        }
      } catch (e) {}
    }

    // Default pre-loaded commercial license for fresh installation or expired key fallback
    const defaultLab = 'Modern Diagnostic Pathology Lab';
    const defaultKey = 'LIMS-180D-MODERN-6B76CD80-0FD1-1785-F5B6';
    const verification = verifyLicenseKey(defaultLab, defaultKey);
    const defaultLic = {
      labName: defaultLab,
      licenseKey: defaultKey,
      daysRemaining: verification.daysRemaining || 180,
      totalSecondsRemaining: verification.totalSecondsRemaining,
      totalMinutesRemaining: verification.totalMinutesRemaining,
      totalHoursRemaining: verification.totalHoursRemaining,
      humanRemaining: verification.humanRemaining || '180 days remaining',
      expiryDate: verification.expiryDate,
      formattedExpiry: verification.formattedExpiry,
      isExpired: false
    };
    try { localStorage.setItem('pulselab_license_info', JSON.stringify(defaultLic)); } catch (e) {}
    return defaultLic;
  });

  const [labProfile, setLabProfile] = useState(() => {
    const saved = localStorage.getItem('pulselab_lab_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if ((parsed?.labName || '').toLowerCase().includes('utk')) {
          localStorage.removeItem('pulselab_lab_profile');
          return { labName: 'Modern Diagnostic Pathology Lab', isRegistered: true };
        }
        return parsed;
      } catch (e) {}
    }
    return { labName: 'Modern Diagnostic Pathology Lab', isRegistered: true };
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('pulselab_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const saved = sessionStorage.getItem('pulselab_session_id');
    return saved || `sess_${Date.now()}`;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('pulselab_is_authenticated') === 'true' && Boolean(sessionStorage.getItem('pulselab_auth_user'));
  });

  const [sessionKickoutInfo, setSessionKickoutInfo] = useState(null);

  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('pulselab_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [reportDesign, setReportDesign] = useState(() => {
    const saved = localStorage.getItem('pulselab_report_design');
    return saved ? JSON.parse(saved) : DEFAULT_REPORT_DESIGN;
  });

  const [tests, setTests] = useState(MASTER_TEST_CATALOG);
  const [doctors, setDoctors] = useState(() => {
    const saved = localStorage.getItem('pulselab_doctors');
    return saved ? JSON.parse(saved) : MASTER_DOCTORS;
  });
  const [pathologists] = useState(PATHOLOGISTS);
  const [b2bCenters, setB2bCenters] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_b2b_centers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return B2B_CENTERS;
  });
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('pulselab_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return REAGENTS_INVENTORY;
  });
  const [qcRuns, setQcRuns] = useState(QC_RUNS);

  const [currentRole, setCurrentRole] = useState(() => currentUser?.role || 'admin');
  const [activeTab, setActiveTab] = useState('global_search');
  const [testMgmtSubTab, setTestMgmtSubTab] = useState('parameter_master');
  const [selectedPatientId, setSelectedPatientId] = useState('PT-2026-0801');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbStatus, setDbStatus] = useState('SYNCED');

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Database Connected', message: 'Central database online with single active device session protection', type: 'success', time: '1 min ago' },
    { id: 2, title: 'Report Design Active', message: 'Report Designer templates synchronized with Laboratory Profile', type: 'info', time: '5 min ago' }
  ]);

  const sessionChannelRef = useRef(null);

  // Computed license flags
  const isLicensed = Boolean(licenseInfo && !licenseInfo.isExpired && ((licenseInfo.daysRemaining > 0) || (licenseInfo.totalMinutesRemaining > 0)));
  const isLicenseExpired = Boolean(licenseInfo && licenseInfo.isExpired);
  const daysRemaining = licenseInfo?.daysRemaining || 0;

  // ================= 2. CORE HELPER FUNCTIONS =================
  const addNotification = (title, message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      time: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 15)]);
  };

  const activateLicense = (labName, licenseKey) => {
    const result = verifyLicenseKey(labName, licenseKey);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    const newLicInfo = {
      labName,
      licenseKey,
      daysRemaining: result.daysRemaining,
      totalSecondsRemaining: result.totalSecondsRemaining,
      totalMinutesRemaining: result.totalMinutesRemaining,
      totalHoursRemaining: result.totalHoursRemaining,
      humanRemaining: result.humanRemaining,
      expiryDate: result.expiryDate,
      formattedExpiry: result.formattedExpiry,
      activatedAt: new Date().toISOString(),
      isExpired: false
    };

    setLicenseInfo(newLicInfo);
    localStorage.setItem('pulselab_license_info', JSON.stringify(newLicInfo));

    setLabProfile(prev => {
      const updated = prev ? { ...prev, labName } : { labName, city: 'Central Pathology' };
      localStorage.setItem('pulselab_lab_profile', JSON.stringify(updated));
      return updated;
    });

    setReportDesign(prev => {
      const updated = { ...prev, labName };
      localStorage.setItem('pulselab_report_design', JSON.stringify(updated));
      return updated;
    });

    try {
      fetch(`${API_BASE_URL}/license-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicInfo)
      }).catch(() => {});
    } catch (e) {}

    return { success: true, ...newLicInfo };
  };

  const saveLabProfile = async (newProfile) => {
    const profileToSave = { ...newProfile, isRegistered: true };
    setLabProfile(profileToSave);
    localStorage.setItem('pulselab_lab_profile', JSON.stringify(profileToSave));
    setShowOnboarding(false);

    setReportDesign(prev => {
      const updated = {
        ...prev,
        labName: profileToSave.labName || prev.labName,
        labAddress: `${profileToSave.address || ''}, ${profileToSave.city || ''}`,
        doctorName: `${profileToSave.pathologistName || ''} ${profileToSave.pathologistDegree || ''}`,
        doctorSignatureText: profileToSave.signatureText || prev.doctorSignatureText
      };
      localStorage.setItem('pulselab_report_design', JSON.stringify(updated));
      return updated;
    });

    try {
      await fetch(`${API_BASE_URL}/lab-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileToSave)
      });
    } catch (err) {
      console.warn('Could not sync lab profile to backend:', err);
    }

    addNotification('Laboratory Profile Saved', `${profileToSave.labName} profile updated across all modules.`, 'success');
  };

  const updateReportDesign = (newDesign) => {
    setReportDesign(prev => {
      const updated = { ...prev, ...newDesign };
      localStorage.setItem('pulselab_report_design', JSON.stringify(updated));
      return updated;
    });
  };

  const login = async ({ username, password, securityKey, labName, role, deviceName, ipAddress }) => {
    try {
      const inputUser = (username || '').trim().toLowerCase();
      const inputPass = (password || '').trim();
      const inputKey = (securityKey || '').trim().toUpperCase();

      if (!inputKey) {
        throw new Error('Please enter your Security License Key.');
      }

      const effectiveLabName = labName || labProfile?.labName || 'Modern Diagnostic Pathology Lab';
      const verification = verifyLicenseKey(effectiveLabName, inputKey);

      if (!verification.valid) {
        throw new Error(verification.error || 'Invalid Security License Key.');
      }

      const activeLic = {
        labName: effectiveLabName,
        licenseKey: inputKey,
        daysRemaining: verification.daysRemaining,
        totalSecondsRemaining: verification.totalSecondsRemaining,
        totalMinutesRemaining: verification.totalMinutesRemaining,
        totalHoursRemaining: verification.totalHoursRemaining,
        humanRemaining: verification.humanRemaining,
        expiryDate: verification.expiryDate,
        formattedExpiry: verification.formattedExpiry,
        isExpired: false
      };

      setLicenseInfo(activeLic);
      localStorage.setItem('pulselab_license_info', JSON.stringify(activeLic));

      let data = {};
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: inputUser, password: inputPass, securityKey: inputKey, role, deviceName, ipAddress })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Invalid username or password. Access denied.');
        }

        data = await res.json();
      } catch (fetchErr) {
        if (fetchErr.message && !fetchErr.message.toLowerCase().includes('failed to fetch') && !fetchErr.message.toLowerCase().includes('network')) {
          throw fetchErr;
        }

        const effectiveProfile = labProfile || (localStorage.getItem('pulselab_lab_profile') ? JSON.parse(localStorage.getItem('pulselab_lab_profile')) : null);
        const registeredUser = (effectiveProfile?.adminUsername || 'admin').trim().toLowerCase();
        const registeredPass = (effectiveProfile?.adminPassword || 'admin123').trim();

        if (inputUser !== registeredUser || inputPass !== registeredPass) {
          throw new Error('Invalid username or password. Access denied.');
        }
      }

      const newSessionId = data.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userObj = {
        username: inputUser,
        name: labProfile?.adminName || labProfile?.pathologistName || 'Administrator',
        role: role || 'admin',
        deviceName: deviceName || 'Windows Workstation',
        loginTime: new Date().toISOString()
      };

      setCurrentUser(userObj);
      setCurrentRole(userObj.role);
      setCurrentSessionId(newSessionId);
      setIsAuthenticated(true);
      setSessionKickoutInfo(null);

      const savedProfileStr = localStorage.getItem('pulselab_lab_profile');
      const activeProfile = labProfile || (savedProfileStr ? JSON.parse(savedProfileStr) : null);
      
      // If profile is not registered yet or first time login, trigger initial onboarding wizard
      if (data.isFirstTime || !activeProfile || !activeProfile.isRegistered || !activeProfile.address || !activeProfile.pathologistName) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }

      sessionStorage.setItem('pulselab_auth_user', JSON.stringify(userObj));
      sessionStorage.setItem('pulselab_session_id', newSessionId);
      sessionStorage.setItem('pulselab_is_authenticated', 'true');

      if (sessionChannelRef.current) {
        sessionChannelRef.current.postMessage({
          type: 'NEW_LOGIN_ON_DEVICE',
          sessionId: newSessionId,
          username: userObj.username,
          deviceName: userObj.deviceName,
          loginTime: userObj.loginTime
        });
      }

      addNotification('Session Authenticated', `Welcome back, ${userObj.name} (${activeLic.humanRemaining || 'Active'}).`, 'success');
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const updateCredentials = async ({ newUsername, newPassword }) => {
    try {
      await fetch(`${API_BASE_URL}/auth/update-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername, newPassword })
      });
      if (labProfile) {
        const updated = { ...labProfile, adminUsername: newUsername, adminPassword: newPassword };
        setLabProfile(updated);
        localStorage.setItem('pulselab_lab_profile', JSON.stringify(updated));
      }
      addNotification('Credentials Updated', 'Username and password updated successfully.', 'success');
      return { success: true };
    } catch (e) {
      if (labProfile) {
        const updated = { ...labProfile, adminUsername: newUsername, adminPassword: newPassword };
        setLabProfile(updated);
        localStorage.setItem('pulselab_lab_profile', JSON.stringify(updated));
      }
      return { success: true };
    }
  };

  const updateMasterConfig = ({ username, password, securityKey, labName }) => {
    const targetLabName = labName || 'Modern Diagnostic Pathology Lab';
    const newProfile = {
      labName: targetLabName,
      adminUsername: username || 'admin',
      adminPassword: password || 'admin123',
      isRegistered: false,
      address: '',
      city: '',
      pathologistName: ''
    };
    setLabProfile(newProfile);
    localStorage.setItem('pulselab_lab_profile', JSON.stringify(newProfile));

    const result = verifyLicenseKey(targetLabName, securityKey);
    const newLicInfo = {
      labName: targetLabName,
      licenseKey: securityKey,
      daysRemaining: result.daysRemaining || 180,
      totalSecondsRemaining: result.totalSecondsRemaining || 15552000,
      totalMinutesRemaining: result.totalMinutesRemaining || 259200,
      totalHoursRemaining: result.totalHoursRemaining || 4320,
      humanRemaining: result.humanRemaining || '180 Days Left',
      expiryDate: result.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      formattedExpiry: result.formattedExpiry || '',
      activatedAt: new Date().toISOString(),
      isExpired: false
    };
    setLicenseInfo(newLicInfo);
    localStorage.setItem('pulselab_license_info', JSON.stringify(newLicInfo));
    setShowOnboarding(true);
  };

  const logout = async () => {
    try {
      if (currentUser?.username) {
        fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser.username })
        }).catch(() => {});
      }
    } catch (e) {}

    setIsAuthenticated(false);
    sessionStorage.removeItem('pulselab_is_authenticated');
    sessionStorage.removeItem('pulselab_session_id');
    sessionStorage.removeItem('pulselab_auth_user');
    addNotification('Logged Out', 'Your session has ended.', 'info');
  };

  const handleAcknowledgeKickout = () => {
    setSessionKickoutInfo(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('pulselab_is_authenticated');
    sessionStorage.removeItem('pulselab_session_id');
    sessionStorage.removeItem('pulselab_auth_user');
  };

  const resetAllData = async () => {
    localStorage.clear();
    sessionStorage.clear();
    setLicenseInfo(null);
    setLabProfile(null);
    setShowOnboarding(true);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPatients([]);

    try {
      await fetch(`${API_BASE_URL}/reset-database`, { method: 'POST' });
    } catch (e) {}

    window.location.reload();
  };

  const registerPatient = (patientData) => {
    const activePatients = Array.isArray(patients) ? patients : [];
    
    // Map test IDs to full rich test objects
    const rawTests = Array.isArray(patientData.tests) ? patientData.tests : [];
    const populatedTests = rawTests.map(t => {
      if (typeof t === 'object' && t !== null && t.name) return t;
      const foundMaster = (tests || []).find(mt => mt.id === t || mt.name === t);
      if (foundMaster) {
        return {
          testId: foundMaster.id,
          name: foundMaster.name,
          category: foundMaster.category || 'General',
          price: foundMaster.price || 0,
          sampleType: foundMaster.sampleType || 'Whole Blood EDTA',
          tatHours: foundMaster.tatHours || 4,
          status: 'Sample Collection Pending',
          parameters: foundMaster.parameters || [],
          results: {}
        };
      }
      return {
        testId: String(t),
        name: String(t),
        category: 'General',
        price: 0,
        sampleType: 'Whole Blood',
        tatHours: 4,
        status: 'Sample Collection Pending',
        parameters: [],
        results: {}
      };
    });

    const uhidVal = patientData.uhid || `UHID-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const labCodeVal = patientData.labCode || `LAB-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const tsBase = Date.now().toString().slice(-6);

    // Auto-generate distinct color-coded sample tubes based on selected test categories
    const generatedSamples = [];
    const addedTypes = new Set();

    populatedTests.forEach((test) => {
      const catLower = (test.category || '').toLowerCase();
      const testNameLower = (test.name || '').toLowerCase();

      let tubeType = 'EDTA';
      let vialName = 'EDTA (Purple Top)';

      if (catLower.includes('bio') || catLower.includes('chem') || catLower.includes('immuno') || catLower.includes('serology') || testNameLower.includes('lft') || testNameLower.includes('kft') || testNameLower.includes('lipid') || testNameLower.includes('thyroid')) {
        tubeType = 'SERUM';
        vialName = 'Serum (Gold/Yellow Top)';
      } else if (testNameLower.includes('sugar') || testNameLower.includes('glucose') || testNameLower.includes('fasting') || testNameLower.includes('pp')) {
        tubeType = 'FLUORIDE';
        vialName = 'Sodium Fluoride (Grey Top)';
      } else if (catLower.includes('coag') || testNameLower.includes('pt') || testNameLower.includes('inr') || testNameLower.includes('aptt')) {
        tubeType = 'CITRATE';
        vialName = 'Sodium Citrate (Blue Top)';
      } else if (catLower.includes('path') || testNameLower.includes('urine')) {
        tubeType = 'URINE';
        vialName = 'Spot Urine Container';
      } else if (testNameLower.includes('cbc') || testNameLower.includes('hb') || testNameLower.includes('hba1c') || catLower.includes('haem')) {
        tubeType = 'EDTA';
        vialName = 'EDTA (Purple Top)';
      }

      if (!addedTypes.has(tubeType)) {
        addedTypes.add(tubeType);
        generatedSamples.push({
          barcode: `SMP-${tsBase}-${addedTypes.size}`,
          type: tubeType,
          vialName: vialName,
          status: 'PENDING_COLLECTION'
        });
      }
    });

    if (generatedSamples.length === 0) {
      generatedSamples.push({
        barcode: `SMP-${tsBase}-1`,
        type: 'EDTA',
        vialName: 'EDTA (Purple Top)',
        status: 'PENDING_COLLECTION'
      });
    }

    const newPatient = {
      id: `PT-2026-${String(activePatients.length + 1).padStart(4, '0')}`,
      uhid: uhidVal,
      labCode: labCodeVal,
      ...patientData,
      tests: populatedTests,
      samples: patientData.samples || generatedSamples,
      billing: patientData.billing || {
        invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
        total: populatedTests.reduce((acc, curr) => acc + (curr.price || 0), 0),
        discount: patientData.discount || 0,
        paid: patientData.paidAmount || 0,
        due: Math.max(0, populatedTests.reduce((acc, curr) => acc + (curr.price || 0), 0) - (patientData.discount || 0) - (patientData.paidAmount || 0)),
        paymentMode: patientData.paymentMode || 'Cash'
      },
      status: 'Sample Collection Pending',
      barcode: generatedSamples[0].barcode,
      vialType: generatedSamples[0].vialName,
      registeredAt: new Date().toISOString()
    };

    setPatients(prev => [newPatient, ...(Array.isArray(prev) ? prev : [])]);

    // Inventory tube decrement
    setInventory(prev => (Array.isArray(prev) ? prev : []).map(item => {
      if (item.category === 'Collection Tubes' && (newPatient.vialType.includes(item.name) || item.name.includes('EDTA'))) {
        const remaining = Math.max(0, item.currentStock - 1);
        return {
          ...item,
          currentStock: remaining,
          status: remaining <= item.minThreshold ? 'Reorder Required' : 'Adequate Stock'
        };
      }
      return item;
    }));

    addNotification('Patient Registered', `${newPatient.name} (${newPatient.uhid}) booked for ${newPatient.tests.length} tests`, 'success');
    return newPatient;
  };

  const updatePatientResults = (patientId, arg2, arg3) => {
    let resultsMap = {};
    let targetTestId = null;

    if (typeof arg2 === 'object' && arg2 !== null) {
      resultsMap = arg2;
    } else if (typeof arg2 === 'string') {
      targetTestId = arg2;
      resultsMap = arg3 || {};
    }

    setPatients(prev => (Array.isArray(prev) ? prev : []).map(patient => {
      if (patient.id !== patientId) return patient;

      const mergedResults = { ...(patient.results || {}), ...resultsMap };

      const updatedTests = (patient.tests || []).map(t => {
        if (typeof t === 'string') return t;
        if (!targetTestId || t.testId === targetTestId || t.id === targetTestId) {
          return {
            ...t,
            status: 'Results Entered',
            results: { ...(t.results || {}), ...resultsMap }
          };
        }
        return t;
      });

      return {
        ...patient,
        status: 'IN_TESTING',
        results: mergedResults,
        tests: updatedTests
      };
    }));

    addNotification('Results Recorded', `Diagnostic results updated for patient ID ${patientId}`, 'success');
  };

  const updateTestResults = (patientId, testId, resultsData) => {
    updatePatientResults(patientId, testId, resultsData);
  };

  const collectSample = (patientId, barcode = null) => {
    setPatients(prev => (Array.isArray(prev) ? prev : []).map(patient => {
      if (patient.id !== patientId) return patient;

      const currentSamples = (patient.samples && patient.samples.length > 0) ? patient.samples : [
        {
          barcode: patient.barcode || `SMP-${Date.now().toString().slice(-6)}`,
          type: 'EDTA',
          vialName: patient.vialType || 'EDTA (Purple Top)',
          status: 'PENDING_COLLECTION'
        }
      ];

      const updatedSamples = currentSamples.map(s => {
        if (!barcode || s.barcode === barcode) {
          return {
            ...s,
            status: 'COLLECTED',
            collectedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return s;
      });

      const allCollected = updatedSamples.every(s => s.status === 'COLLECTED' || s.status === 'RECEIVED');

      return {
        ...patient,
        status: allCollected ? 'Sample Collected' : patient.status,
        samples: updatedSamples
      };
    }));

    addNotification('Sample Collected', `Specimen marked as collected for patient ID ${patientId}`, 'success');
  };

  const receiveSample = (patientId, barcode = null) => {
    setPatients(prev => (Array.isArray(prev) ? prev : []).map(patient => {
      if (patient.id !== patientId) return patient;

      const currentSamples = patient.samples || [];
      const updatedSamples = currentSamples.map(s => {
        if (!barcode || s.barcode === barcode) {
          return {
            ...s,
            status: 'RECEIVED',
            receivedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return s;
      });

      return {
        ...patient,
        status: 'IN_TESTING',
        samples: updatedSamples
      };
    }));

    addNotification('Sample Accessioned', `Specimen received in laboratory worklist for testing.`, 'success');
  };

  const rejectSample = (patientId, barcode, reason = 'Sample Hemolyzed / Insufficient Volume') => {
    setPatients(prev => (Array.isArray(prev) ? prev : []).map(patient => {
      if (patient.id !== patientId) return patient;

      const updatedSamples = (patient.samples || []).map(s => {
        if (s.barcode === barcode) {
          return {
            ...s,
            status: 'REJECTED',
            rejectionReason: reason,
            rejectedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return s;
      });

      return {
        ...patient,
        status: 'Sample Rejected',
        samples: updatedSamples
      };
    }));

    addNotification('Sample Rejected', `Specimen rejected: ${reason}`, 'warning');
  };

  const addDoctor = (docData) => {
    const docObj = typeof docData === 'string'
      ? { id: `DOC-${Date.now()}`, name: docData.trim(), specialization: 'General Physician', phone: '-' }
      : { id: `DOC-${Date.now()}`, ...docData };

    setDoctors(prev => {
      const currentList = Array.isArray(prev) ? prev : [];
      if (currentList.some(d => d.name.toLowerCase() === docObj.name.toLowerCase())) {
        return currentList;
      }
      const updated = [...currentList, docObj];
      localStorage.setItem('pulselab_doctors', JSON.stringify(updated));
      return updated;
    });

    addNotification('Doctor Registered', `${docObj.name} added to Doctor Master.`, 'success');
    return docObj;
  };

  const authorizeReport = (patientId, doctorName = labProfile?.pathologistName || 'Consultant Pathologist', remarks = '') => {
    let releasedPatient = null;
    setPatients(prev => {
      const updatedList = (Array.isArray(prev) ? prev : []).map(patient => {
        if (patient.id !== patientId && patient.uhid !== patientId) return patient;
        releasedPatient = {
          ...patient,
          status: 'AUTHORIZED',
          approvedBy: doctorName,
          approvalTime: new Date().toISOString(),
          qcVerification: {
            status: 'QC_VERIFIED_AND_RELEASED',
            verifiedBy: doctorName,
            verifiedAt: new Date().toISOString(),
            remarks: remarks || 'All evaluated parameters clinically verified & released under NABL / ISO 15189 protocol.'
          },
          doctorReview: {
            authorizedBy: doctorName,
            authorizedAt: new Date().toISOString(),
            remarks: remarks || 'All evaluated parameters clinically verified & released under NABL / ISO 15189 protocol.'
          }
        };
        return releasedPatient;
      });
      localStorage.setItem('pulselab_patients', JSON.stringify(updatedList));
      return updatedList;
    });

    // Sync to backend release API
    fetch(`${API_BASE_URL}/patients/${encodeURIComponent(patientId)}/release-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supervisorName: doctorName, remarks })
    }).catch(() => {});

    addNotification('Report QC Verified & Released', `Diagnostic report clinically authorized and unlocked by ${doctorName}`, 'success');
  };

  const batchAuthorize = (patientIds = [], doctorName = labProfile?.pathologistName || 'Consultant Pathologist') => {
    const ids = Array.isArray(patientIds) ? patientIds : [];
    setPatients(prev => (Array.isArray(prev) ? prev : []).map(patient => {
      if (!ids.includes(patient.id)) return patient;
      return {
        ...patient,
        status: 'AUTHORIZED',
        approvedBy: doctorName,
        approvalTime: new Date().toISOString(),
        doctorReview: {
          authorizedBy: doctorName,
          authorizedAt: new Date().toISOString(),
          remarks: 'Batch Authorized & Digitally Signed'
        }
      };
    }));

    addNotification('Batch Sign-Off Complete', `Digitally authorized ${ids.length} patient reports`, 'success');
  };

  const approveReport = (patientId, doctorName = labProfile?.pathologistName || 'Consultant Pathologist') => {
    authorizeReport(patientId, doctorName);
  };

  // ================= 3. SIDE EFFECTS & TICKERS =================
  // A. Backend License Sync on load
  useEffect(() => {
    fetch(`${API_BASE_URL}/license-info`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.licenseKey) {
          setLicenseInfo(null);
          localStorage.removeItem('pulselab_license_info');
          setLabProfile(null);
          localStorage.removeItem('pulselab_lab_profile');
          setShowOnboarding(true);
        } else {
          const verification = verifyLicenseKey(data.labName, data.licenseKey);
          if (verification.valid) {
            const updated = {
              ...data,
              daysRemaining: verification.daysRemaining,
              totalSecondsRemaining: verification.totalSecondsRemaining,
              totalMinutesRemaining: verification.totalMinutesRemaining,
              totalHoursRemaining: verification.totalHoursRemaining,
              humanRemaining: verification.humanRemaining,
              expiryDate: verification.expiryDate,
              formattedExpiry: verification.formattedExpiry,
              isExpired: false
            };
            setLicenseInfo(updated);
            localStorage.setItem('pulselab_license_info', JSON.stringify(updated));
          } else {
            setLicenseInfo({ ...data, isExpired: true, error: verification.error });
          }
        }
      })
      .catch(() => {});
  }, []);

  // B. Live 1-second Countdown Ticker
  useEffect(() => {
    if (!licenseInfo || !licenseInfo.licenseKey) return;

    const interval = setInterval(() => {
      const effLab = licenseInfo.labName || labProfile?.labName || 'Modern Diagnostic Pathology Lab';
      const check = verifyLicenseKey(effLab, licenseInfo.licenseKey);

      if (!check.valid || check.isExpired || (check.totalSecondsRemaining !== undefined && check.totalSecondsRemaining <= 0)) {
        const expiredState = {
          ...(licenseInfo || {}),
          isExpired: true,
          humanRemaining: 'Expired',
          error: check.error || 'Security License Key Expired. Please renew key.'
        };
        setLicenseInfo(expiredState);
        localStorage.setItem('pulselab_license_info', JSON.stringify(expiredState));
        setIsAuthenticated(false);
      } else {
        setLicenseInfo(prev => ({
          ...(prev || {}),
          daysRemaining: check.daysRemaining,
          totalSecondsRemaining: check.totalSecondsRemaining,
          totalMinutesRemaining: check.totalMinutesRemaining,
          totalHoursRemaining: check.totalHoursRemaining,
          humanRemaining: check.humanRemaining,
          isExpired: false
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [licenseInfo?.licenseKey, licenseInfo?.labName, labProfile?.labName]);

  // C. Cross-tab session channel
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('pulselab_session_channel');
      sessionChannelRef.current = channel;

      channel.onmessage = (event) => {
        const msg = event.data;
        if (msg.type === 'NEW_LOGIN_ON_DEVICE') {
          if (msg.sessionId !== currentSessionId) {
            setSessionKickoutInfo({
              newDevice: msg.deviceName || 'Another Window / Workstation',
              newLoginTime: msg.loginTime || new Date().toISOString()
            });
            setIsAuthenticated(false);
          }
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {}
  }, [currentSessionId]);

  return (
    <LabContext.Provider
      value={{
        licenseInfo,
        isLicensed,
        isLicenseExpired,
        daysRemaining,
        activateLicense,
        resetAllData,

        currentUser,
        currentRole,
        setCurrentRole,
        isAuthenticated,
        login,
        logout,
        updateCredentials,
        updateMasterConfig,
        sessionKickoutInfo,
        handleAcknowledgeKickout,
        
        labProfile,
        saveLabProfile,
        showOnboarding,
        setShowOnboarding,

        patients,
        setPatients,
        tests,
        setTests,
        doctors,
        setDoctors,
        addDoctor,
        pathologists,
        b2bCenters,
        setB2bCenters,
        inventory,
        setInventory,
        qcRuns,
        setQcRuns,
        reportDesign,
        setReportDesign,
        updateReportDesign,

        activeTab,
        setActiveTab,
        testMgmtSubTab,
        setTestMgmtSubTab,
        selectedPatientId,
        setSelectedPatientId,
        searchQuery,
        setSearchQuery,
        dbStatus,
        notifications,
        addNotification,
        registerPatient,
        updatePatientResults,
        updateTestResults,
        approveReport,
        authorizeReport,
        batchAuthorize,
        collectSample,
        receiveSample,
        rejectSample
      }}
    >
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => useContext(LabContext);
