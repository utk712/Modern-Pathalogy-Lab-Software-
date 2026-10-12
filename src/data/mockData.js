// =========================================================================
// CLEAN PRODUCTION MASTER DATA (ZERO HARDCODED PATIENTS / CLEAN DB)
// Retains only Machine Drivers and Specimen Modalities
// =========================================================================

export const VIAL_TYPES = {
  EDTA: { id: 'EDTA', name: 'K2/K3 EDTA (Purple Top)', color: 'bg-purple-600', badgeClass: 'tube-edta', label: 'EDTA Whole Blood' },
  SERUM: { id: 'SERUM', name: 'Clot Activator / SST (Gold/Yellow Top)', color: 'bg-amber-500', badgeClass: 'tube-serum', label: 'Serum' },
  FLUORIDE: { id: 'FLUORIDE', name: 'Sodium Fluoride / Oxalate (Grey Top)', color: 'bg-slate-500', badgeClass: 'tube-fluoride', label: 'Fluoride Plasma' },
  CITRATE: { id: 'CITRATE', name: 'Sodium Citrate 3.2% (Blue Top)', color: 'bg-sky-500', badgeClass: 'tube-citrate', label: 'Citrated Plasma' },
  PLAIN: { id: 'PLAIN', name: 'Plain / No Additive (Red Top)', color: 'bg-rose-600', badgeClass: 'tube-plain', label: 'Plain Blood' },
  URINE: { id: 'URINE', name: 'Sterile Urine Container (Yellow Cap)', color: 'bg-yellow-500', badgeClass: 'tube-urine', label: 'Spot Urine' }
};

export const SAMPLE_REJECTION_REASONS = [
  'Grossly Hemolyzed Sample',
  'Clotted / Micro-clots in EDTA Tube',
  'Insufficient Quantity (QNS)',
  'Incorrect Anticoagulant / Container',
  'Severe Lipemic Sample',
  'Unlabeled / Mismatched Barcode',
  'Sample Transit Temperature Breach',
  'Old / Degraded Specimen (>24 hrs)'
];

export const CLINICAL_REMARKS_PRESETS = [
  'Findings correlate clinically with presenting symptoms.',
  'Advise follow-up test after 4 to 6 weeks.',
  'Mild Microcytic Hypochromic Anemia observed. Serum Ferritin & Iron studies recommended.',
  'Serum Lipid levels indicate moderate Atherogenic risk. Dietary counseling advised.',
  'Urine Microscopic examination reveals active urinary tract infection (Bacteriuria). Urine Culture & Sensitivity recommended.',
  'Elevated transaminases (AST/ALT). Viral hepatitis & Ultrasound Abdomen correlation advised.',
  'All evaluated parameters within normal biological reference intervals.'
];

export const DEPARTMENTS = [
  { id: 'all', name: 'All Departments' },
  { id: 'haematology', name: 'Haematology', color: 'text-rose-600 bg-rose-50' },
  { id: 'biochemistry', name: 'Biochemistry', color: 'text-sky-600 bg-sky-50' },
  { id: 'clinical_path', name: 'Clinical Pathology', color: 'text-amber-600 bg-amber-50' },
  { id: 'immuno_assay', name: 'Immuno Assay & Hormones', color: 'text-purple-600 bg-purple-50' },
  { id: 'serology', name: 'Serology & Infectious Diseases', color: 'text-indigo-600 bg-indigo-50' },
  { id: 'microbiology', name: 'Microbiology', color: 'text-emerald-600 bg-emerald-50' },
  { id: 'histopathology', name: 'Histopathology & Cytology', color: 'text-pink-600 bg-pink-50' },
  { id: 'coagulation', name: 'Coagulation Profile', color: 'text-teal-600 bg-teal-50' },
  { id: 'molecular_pcr', name: 'Molecular & RT-PCR', color: 'text-cyan-600 bg-cyan-50' },
  { id: 'radiology_imaging', name: 'Radiology / Imaging', color: 'text-blue-600 bg-blue-50' }
];

// Clean Doctors List (Default Direct Walk-in)
export const MASTER_DOCTORS = [
  { id: 'DOC001', name: 'Direct Walk-in / Self Consultation', specialization: 'Direct Walk-in', commissionPct: 0, phone: '-' }
];

// Dynamic Pathologists List (Initialized from Laboratory Setup)
export const PATHOLOGISTS = [];

// Dynamic B2B Centers List (Pre-loaded Master Referral Centers)
export const B2B_CENTERS = [
  {
    id: 'B2B-01',
    code: 'B2B-CIVIL-01',
    name: 'Civil Hospital Collection Center',
    owner: 'Dr. S. K. Sharma',
    phone: '+91 98765 12345',
    address: 'Civil Hospital Road, Main Market, Gondia',
    discountPct: 25,
    creditLimit: 100000,
    ledgerBalance: -12500
  },
  {
    id: 'B2B-02',
    code: 'B2B-CITY-02',
    name: 'City Diagnostics & Healthcare Point',
    owner: 'Dr. Anjali Verma',
    phone: '+91 98230 67890',
    address: 'Station Road, Near Railway Complex, Betul',
    discountPct: 30,
    creditLimit: 75000,
    ledgerBalance: -8200
  },
  {
    id: 'B2B-03',
    code: 'B2B-CARE-03',
    name: 'Care Polyclinic & Collection Hub',
    owner: 'Dr. Rajesh Patel',
    phone: '+91 94251 45678',
    address: 'National Highway Square, Nagpur Road',
    discountPct: 20,
    creditLimit: 50000,
    ledgerBalance: 0
  }
];

// Dynamic Reagents Inventory (Pre-loaded Master Reagents & Consumables)
export const REAGENTS_INVENTORY = [
  {
    id: 'INV-01',
    code: 'REAG-CBC-01',
    name: 'CBC Lyse & Diluent Kit (Mindray/AVECON)',
    department: 'HAEMATOLOGY',
    stockTests: 450,
    minThreshold: 100,
    status: 'IN_STOCK',
    lotNo: 'LOT-2026-CBC89',
    expiryDate: '2027-08-30'
  },
  {
    id: 'INV-02',
    code: 'TUBE-EDTA-100',
    name: 'K2/K3 EDTA Vacuum Blood Tubes (Purple Top)',
    department: 'PHLEBOTOMY',
    stockTests: 1200,
    minThreshold: 200,
    status: 'IN_STOCK',
    lotNo: 'LOT-2026-TUB04',
    expiryDate: '2027-12-31'
  },
  {
    id: 'INV-03',
    code: 'TUBE-SST-100',
    name: 'Clot Activator SST Serum Gel Tubes (Gold Top)',
    department: 'PHLEBOTOMY',
    stockTests: 850,
    minThreshold: 150,
    status: 'IN_STOCK',
    lotNo: 'LOT-2026-SST12',
    expiryDate: '2027-11-30'
  },
  {
    id: 'INV-04',
    code: 'REAG-BIO-02',
    name: 'Erba EM200 Biochemistry Reagent Pack (LFT/KFT/Lipid)',
    department: 'BIOCHEMISTRY',
    stockTests: 320,
    minThreshold: 100,
    status: 'IN_STOCK',
    lotNo: 'LOT-2026-BIO55',
    expiryDate: '2027-06-30'
  },
  {
    id: 'INV-05',
    code: 'STRIP-URINE-10',
    name: 'Urine Routine 10-Parameter Strip Box (100 Strips)',
    department: 'CLINICAL_PATHOLOGY',
    stockTests: 45,
    minThreshold: 50,
    status: 'LOW_STOCK',
    lotNo: 'LOT-2026-UR77',
    expiryDate: '2027-03-31'
  },
  {
    id: 'INV-06',
    code: 'REAG-THY-03',
    name: 'Thyroid T3/T4/TSH Immunoassay Kit (Maglumi 800)',
    department: 'IMMUNO_ASSAY',
    stockTests: 180,
    minThreshold: 50,
    status: 'IN_STOCK',
    lotNo: 'LOT-2026-THY91',
    expiryDate: '2027-09-30'
  }
];

// Dynamic Quality Control Runs (Logged via QC Module)
export const QC_RUNS = [];

// Clean Patients Database (Zero dummy/hardcoded records)
export const INITIAL_PATIENTS = [];
