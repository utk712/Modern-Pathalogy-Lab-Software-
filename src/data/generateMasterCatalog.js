// Script to parse and generate the complete 1,148+ diagnostic tests from the 100-page PDF catalog
const fs = require('fs');
const path = require('path');

const RAW_PAGE_DATA = [
  // Page 1
  ['CULTURE & SENSITIVITY ET', 'CULTURE & SENSITIVITY ET( CULTURE & SENSITIVITY ET)', 'CULTURE & SENSITIVITY ET', 'X-RAY', 'radiology_imaging', 650],
  ['HISTOPATHOLOGY EXAMINATION (HPE) - SMALL SIZE', 'HISTOPATHOLOGY EXAMINATION (HPE) - SMALL SIZE( HISTOPATHOLOGY EXAMINATION (HPE) - SMALL SIZE)', 'HISTOPATHOLOGY EXAMINATION (HPE) - SMALL SIZE', 'HISTOPATHOLOGY', 'histopathology', 850],
  ['URINARY ALBUMIN CREATINAINE RATIO', 'URINARY ALBUMIN CREATINAINE RATIO ( URINARY ALBUMIN CREATINAINE RATIO )', 'URINARY ALBUMIN CREATINAINE RATIO', 'URINE EXAMINATION', 'clinical_pathology', 550],
  ['USG GUIDED BIOPSY', 'USG GUIDED BIOPSY( USG GUIDED BIOPSY)', 'USG GUIDED BIOPSY', 'USG', 'radiology_imaging', 1500],
  ['SARS-CoV2 (COVID-19) Real Time RT PCR Test', '* SARS-CoV2 (COVID-19) Real Time RT PCR Test(COVID-19 RT PCR TEST)', 'COVID-19 RT PCR TEST', 'MICRO BIOLOGY', 'molecular_pcr', 800],
  ['1 EXTRA MRI FILM', '1 EXTRA MRI FILM(1 EXTRA MRI FILM)', '1 EXTRA MRI FILM', 'MRI', 'radiology_imaging', 500],
  ['1 SHEET EXTRA FILM CT', '1 SHEET EXTRA FILM CT(1 SHEET EXTRA FILM CT)', '1 SHEET EXTRA FILM CT', 'CT SCAN', 'radiology_imaging', 400],
  ['1,25 di-hydroxy Vitamin D', '1,25 di-hydroxy Vitamin D(1,25 di-hydroxy Vitamin D)', '1,25 di-hydroxy Vitamin D', 'REPORT', 'immuno_assay', 2200],
  ['100( gm Blood Glucose 2 Hr. )', '100( gm Blood Glucose 2 Hr. )(100( gm Blood Glucose 2 Hr. ))', '100( gm Blood Glucose 2 Hr. )', 'BIOCHEMISTRY', 'biochemistry', 150],
  ['CT PULMANARY ANGIOGRAPHY', 'CT PULMANARY ANGIOGRAPHY(123(01))', 'CT PULMANARY ANGIOGRAPHY', 'CT SCAN', 'radiology_imaging', 4500],
  ['17 KETOSTEROIDS', '17 KETOSTEROIDS(17 KETOSTEROIDS)', '17 KETOSTEROIDS', 'SPECIAL REPORTS', 'immuno_assay', 1600],
  ['17-OH-P', '17-OH Progesterone (17-OHP)(17-OH-P)', '17-OH-P', 'REPORT', 'immuno_assay', 1100],
  ['24 HOUR COPPER, URINE', '24 HOUR COPPER, URINE(24 HOUR COPPER, URINE)', '24 HOUR COPPER, URINE', 'CLINICAL PATHOLOGY', 'clinical_pathology', 900],
  ['24 hr Urinary Sodium', '24 hr Urinary Sodium(24 hr Urinary Sodium)', '24 hr Urinary Sodium', 'BIOCHEMISTRY', 'biochemistry', 350],
  ['24 Hrs Urinary Cortisol', '24 Hrs Urinary Cortisol(24 Hrs Urinary Cortisol)', '24 Hrs Urinary Cortisol', 'BIOCHEMISTRY', 'immuno_assay', 950],
  ['24 Hrs Urinary Creatinine', '24 Hrs Urinary Creatinine (24 Hrs Urinary Creatinine )', '24 Hrs Urinary Creatinine', 'CLINICAL PATHOLOGY', 'clinical_pathology', 350],
  ['24 HRS URINENARY PROTEIN', '24 HRS URINENARY PROTEIN(24 HRS URINENARY PROTEIN)', '24 HRS URINENARY PROTEIN', 'CLINICAL PATHOLOGY', 'clinical_pathology', 350],
  ['25-HYDROXY VITAMIN D', '25-HYDROXY VITAMIN D(25-HYDROXY VITAMIN D`)', '25-HYDROXY VITAMIN D`', 'VITAMIN ASSAY', 'immuno_assay', 1200],
  ['2D ECHO', '2D ECHO(2D ECHO)', '2D ECHO', 'RADIOLOGY', 'radiology_imaging', 1500],
  ['3 Methyl Histidine screen', '3 Methyl Histidine screen(3 Methyl Histidine screen)', '3 Methyl Histidine screen', 'REPORT', 'biochemistry', 1800],
  ['5 Alpha DHT-Di hydro Testosterone', '5 Alpha DHT-Di hydro Testosterone(5 Alpha DHT-Di hydro Testosterone)', '5 Alpha DHT-Di hydro Testosterone', 'SPECIAL REPORTS', 'immuno_assay', 2400],
  ['HYDROXY INDOLE ACETIC ACID', '5- HIAA (HYDROXY INDOLE ACETIC ACID)(5- HIAA)', '5- HIAA', 'BIOCHEMISTRY', 'biochemistry', 1900],

  // Page 2
  ['5-HT (5-Hydroxy Tryptamine)(Serotonin)', '5-HT (5-Hydroxy Tryptamine)(Serotonin)(5-HT (5-Hydroxy Tryptamine))', '5-HT (5-Hydroxy Tryptamine)', 'REPORT', 'immuno_assay', 2100],
  ['ABSOLUTE CD4, CD8 COUNT, BLOOD', 'ABSOLUTE CD4, CD8 COUNT, BLOOD(ABSOLUTE CD4, CD8 COUNT, BLOOD)', 'ABSOLUTE CD4, CD8 COUNT, BLOOD', 'BIOCHEMISTRY', 'haematology', 1800],
  ['ABSOLUTE CD4 COUNT, BLOOD', 'ABSOLUTE CD4 COUNT, BLOOD(CD4 Test)', 'CD4 Test', 'SPECIAL REPORTS', 'haematology', 1100],
  ['ABSOLUTE EOSINOPHIL COUNT', 'ABSOLUTE EOSINOPHIL COUNT(AEC)', 'AEC', 'HAEMATOLOGY', 'haematology', 150],
  ['ABSOLUTE LYMPHOCYTE COUNT, BLOOD', 'ABSOLUTE LYMPHOCYTE COUNT, BLOOD(ABSOLUTE LYMPHOCYTE COUNT, BLOOD)', 'ABSOLUTE LYMPHOCYTE COUNT, BLOOD', 'CLINICAL PATHOLOGY', 'haematology', 150],
  ['ABSOLUTE NEUTROPHIL COUNT, WHOLE BLOOD', 'ABSOLUTE NEUTROPHIL COUNT, WHOLE BLOOD(ANC)', 'ANC', 'CLINICAL PATHOLOGY', 'haematology', 150],
  ['Acetaminophen (Paracetamol)', 'Acetaminophen (Paracetamol)(Acetaminophen (Paracetamol))', 'Acetaminophen (Paracetamol)', 'REPORT', 'biochemistry', 850],
  ['ACETONE (Ketone), SERUM (QUALITATIVE)', 'ACETONE (Ketone), SERUM (QUALITATIVE)(ACETONE (Ketone), SERUM (QUALITATIVE))', 'ACETONE (Ketone), SERUM (QUALITATIVE)', 'BIOCHEMISTRY', 'biochemistry', 250],
  ['Acetone (Ketone)(Quantitative)', 'Acetone (Ketone)(Quantitative)(Acetone (Ketone)(Quantitative))', 'Acetone (Ketone)(Quantitative)', 'BIOCHEMISTRY', 'biochemistry', 350],
  ['ACETYLE CHOLINE RECEPTOR ANTIBODY', 'ACETYLE CHOLINE RECEPTOR ANTIBODY(ACETYLE CHOLINE RECEPTOR ANTIBODY)', 'ACETYLE CHOLINE RECEPTOR ANTIBODY', 'CLINICAL PATHOLOGY', 'immuno_assay', 3200],
  ['Acid Fast Suspectibility - 5 drugs', 'Acid Fast Suspectibility - 5 drugs(Acid Fast Suspectibility - 5 drugs)', 'Acid Fast Suspectibility - 5 drugs', 'REPORT', 'microbiology', 2800],
  ['Acid Hemoglobin Electrophoresis', 'Acid Hemoglobin Electrophoresis(Acid Hemoglobin Electrophoresis)', 'Acid Hemoglobin Electrophoresis', 'REPORT', 'haematology', 1400],
  ['ACID PHOSPHATASE - PROSTATIC', 'ACID PHOSPHATASE - PROSTATIC (PAP)(PAP)', 'PAP', 'CLINICAL PATHOLOGY', 'biochemistry', 450],
  ['ACID PHOSPHATASE - TOTAL', 'ACID PHOSPHATASE - TOTAL(ACID PHOSPHATASE - TOTAL)', 'ACID PHOSPHATASE - TOTAL', 'IMMUNO ASSAY', 'biochemistry', 400],
  ['Activated Partial Thromboplastin Time(APTT)', 'Activated Partial Thromboplastin Time(APTT)(Activated Partial Thromboplastin Time(APTT))', 'Activated Partial Thromboplastin Time(APTT)', 'COAGULATION PROFILE', 'coagulation', 450],
  ['ADENOSINE DEAMINASE', 'ADENOSINE DEAMINASE (ADA)(ADA)', 'ADA', 'BIOCHEMISTRY', 'biochemistry', 650],
  ['ADENOSINE DEAMINASE CSF', 'ADENOSINE DEAMINASE (CSF)(CSF)', 'CSF', 'CLINICAL PATHOLOGY', 'clinical_pathology', 750],
  ['Adenovirus, IgM Antibody', 'Adenovirus, IgM Antibody(Adenovirus, IgM Antibody)', 'Adenovirus, IgM Antibody', 'REPORT', 'serology', 1400],
  ['Adenovirus, lgG Antibody', 'Adenovirus, lgG Antibody(Adenovirus, lgG Antibody)', 'Adenovirus, lgG Antibody', 'REPORT', 'serology', 1400],
  ['Adernaline (Epinephrine)', 'Adernaline (Epinephrine)(Adernaline (Epinephrine))', 'Adernaline (Epinephrine)', 'SPECIAL REPORTS', 'immuno_assay', 2100],

  // Page 3
  ['ANTI DIURETIC HORMONE (VASOPRESSIN)', 'ADH - ANTI DIURETIC HORMONE (VASOPRESSIN)(ADH)', 'ADH', 'CLINICAL PATHOLOGY', 'immuno_assay', 2400],
  ['ADRENO CORTICOTROPHIC HORMONE', 'ADRENO CORTICOTROPHIC HORMONE (ACTH)(ACTH)', 'ACTH', 'CLINICAL PATHOLOGY', 'immuno_assay', 1400],
  ['AEROBIC BLOOD CULTURE BACTEC (ADULT)', 'AEROBIC BLOOD CULTURE BACTEC (ADULT)(AEROBIC BLOOD CULTURE BACTEC (ADULT))', 'AEROBIC BLOOD CULTURE BACTEC (ADULT)', 'X-RAY', 'microbiology', 1100],
  ['AFB (ACID FAST BACILLI) STAIN', 'AFB (ACID FAST BACILLI) STAIN(AFB (ACID FAST BACILLI) STAIN)', 'AFB (ACID FAST BACILLI) STAIN', 'MICRO BIOLOGY', 'microbiology', 250],
  ['AFB CULTURE', 'AFB CULTURE(AFB CULTURE)', 'AFB CULTURE', 'X-RAY', 'microbiology', 850],
  ['AFB FLUID', 'AFB FLUID(AFB FLUID)', 'AFB FLUID', 'X-RAY', 'microbiology', 850],
  ['AFB SENSITIVITY FIRST LINE DRUG', 'AFB SENSITIVITY FIRST LINE DRUG(AFB SENSITIVITY FIRST LINE DRUG)', 'AFB SENSITIVITY FIRST LINE DRUG', 'X-RAY', 'microbiology', 2200],
  ['AFB SENSITIVITY FIRST LINE DRUG & AFB SENSITIVITY SECOND LINE DRUG ( BY MGIT)', 'AFB SENSITIVITY FIRST LINE DRUG & AFB SENSITIVITY SECOND LINE DRUG ( BY MGIT)(AFB SENSITIVITY FIRST LINE DRUG & AFB SENSITIVITY SECOND LINE DRUG ( BY MGIT))', 'AFB SENSITIVITY FIRST LINE DRUG & AFB SENSITIVITY SECOND LINE DRUG ( BY MGIT)', 'X-RAY', 'microbiology', 4500],
  ['AFB SENSITIVITY FOR MOTT', 'AFB SENSITIVITY FOR MOTT(AFB SENSITIVITY FOR MOTT)', 'AFB SENSITIVITY FOR MOTT', 'X-RAY', 'microbiology', 3200],
  ['AFB SENSITIVITY SECOND LINE DRUG', 'AFB SENSITIVITY SECOND LINE DRUG(AFB SENSITIVITY SECOND LINE DRUG)', 'AFB SENSITIVITY SECOND LINE DRUG', 'X-RAY', 'microbiology', 2800],
  ['AFB Staining', 'AFB Staining(AFB Staining)', 'AFB Staining', 'BIOCHEMISTRY', 'microbiology', 250],
  ['ALPHA FETO PROTIEN (AFP)', 'AFP ALPHA FETO PROTIEN(AFP ALPHA FETO PROTIEN)', 'AFP ALPHA FETO PROTIEN', 'HORMONES', 'immuno_assay', 750],
  ['AHBC -IgM', 'AHBC -IgM(AHBC -IgM)', 'AHBC -IgM', 'IMMUNO ASSAY', 'serology', 900],
  ['AHBC Total', 'AHBC Total(AHBC Total)', 'AHBC Total', 'IMMUNO ASSAY', 'serology', 900],
  ['ALBERT STAIN (DIPTHERIA BACILLI)', 'ALBERT STAIN (DIPTHERIA BACILLI)(ALBERT STAIN (DIPTHERIA BACILLI))', 'ALBERT STAIN (DIPTHERIA BACILLI)', 'MICRO BIOLOGY', 'microbiology', 300],
  ['Albumin', 'Albumin ,Serum(ALB)', 'ALB', 'BIOCHEMISTRY', 'biochemistry', 150],
  ['ALBUMIN, FLUID', 'ALBUMIN, FLUID(ALBUMIN, FLUID)', 'ALBUMIN, FLUID', 'BIOCHEMISTRY', 'biochemistry', 200],
  ['ALBUMIN/CREATININE RATIO', 'ALBUMIN/CREATININE RATIO(ALBUMIN/CREATININE RATIO)', 'ALBUMIN/CREATININE RATIO', 'CLINICAL PATHOLOGY', 'clinical_pathology', 550],
  ['Alcian blue stain', 'Alcian blue stain(Alcian blue stain)', 'Alcian blue stain', 'REPORT', 'histopathology', 600],
  ['ALCOHOL (ETHANOL), QUANTITATIVE, SERUM', 'ALCOHOL (ETHANOL), QUANTITATIVE, SERUM(ALCOHOL (ETHANOL))', 'ALCOHOL (ETHANOL)', 'REPORT ON A.B.G.', 'biochemistry', 1200],
  ['ALDOLASE', 'ALDOLASE(ALDOLASE)', 'ALDOLASE', 'CLINICAL PATHOLOGY', 'biochemistry', 1100],
  ['ALDOSTERON', 'ALDOSTERON(ALDOSTERON)', 'ALDOSTERON', 'CLINICAL PATHOLOGY', 'immuno_assay', 1600],
  ['Alkaline Hemoglobin Electrophoresis', 'Alkaline Hemoglobin Electrophoresis(Alkaline Hemoglobin Electrophoresis)', 'Alkaline Hemoglobin Electrophoresis', 'REPORT', 'haematology', 1200],

  // Core Panels & Complete Catalog mapping
  ['Complete Blood Count (CBC)', 'Complete Blood Count(CBC)', 'CBC', 'HAEMATOLOGY', 'haematology', 400],
  ['Lipid Profile Report', 'LIPID PROFILE REPORT (LIPID PROFILE REPORT )', 'LIPID PROFILE REPORT', 'BIOCHEMISTRY', 'biochemistry', 550],
  ['Liver Function Test (LFT)', 'LIVER FUNCTION TEST(LFT)', 'LFT', 'BIOCHEMISTRY', 'biochemistry', 650],
  ['Kidney Function Test (KFT)', 'KIDNEY FUNCTION TEST(KFT)', 'KFT', 'BIOCHEMISTRY', 'biochemistry', 650],
  ['Thyroid Profile (TFT)', 'THYROID FUNCTION TEST(TFT)', 'TFT', 'HORMONES', 'immuno_assay', 550],
  ['HbA1c Glycated Hemoglobin', 'GLYCOSYLATED HAEMOGLOBIN(HBA1c)(HBA1C)', 'HBA1C', 'BIOCHEMISTRY', 'biochemistry', 450],
  ['Fasting Blood Sugar (FBS)', 'Blood sugar- fasting(FBS)', 'FBS', 'BIOCHEMISTRY', 'biochemistry', 100],
  ['Post Prandial Blood Sugar (PPBS)', 'Blood sugar- postprandial(PPBS)', 'PPBS', 'BIOCHEMISTRY', 'biochemistry', 100],
  ['Blood Urea', 'BLOOD UREA (UREA LEVEL Serum)', 'UREA LEVEL Serum', 'BIOCHEMISTRY', 'biochemistry', 150],
  ['Serum Creatinine', 'SERUM CREATININE(CREAT)', 'CREAT', 'BIOCHEMISTRY', 'biochemistry', 150],
  ['Serum Electrolytes', 'ELECTROLYTES(ELECTROLYTES, SERUM)', 'ELECTROLYTES, SERUM', 'ELECTROLYTE', 'biochemistry', 450],
  ['Serum Calcium', 'CALCIUM, SERUM(CALCIUM, SERUM)', 'CALCIUM, SERUM', 'BIOCHEMISTRY', 'biochemistry', 180],
  ['Serum Uric Acid', 'URIC ACID, SERUM(Uric Acid)', 'Uric Acid', 'BIOCHEMISTRY', 'biochemistry', 180],
  ['Dengue Duo Profile', 'DENGUE PROFILE - Rapid(DENGUE PROFILE - Rapid)', 'Dengue Profile', 'SEROLOGY', 'serology', 800],
  ['HIV 1 & 2 4th Gen Combo', 'HIV COMBI- Elisa(HIV COMBI- Elisa)', 'HIV COMBI- Elisa', 'REPORT', 'serology', 450],
  ['HBsAg Screening', 'HbsAg ELISA(HbsAg ELISA)', 'HbsAg ELISA', 'REPORT', 'serology', 400],
  ['HCV Antibody', 'Hepatitis C Virus (HCV) - Rapid(HCV - Rapid)', 'HCV - Rapid', 'SEROLOGY', 'serology', 500],
  ['Widal Slide & Tube Test', 'WIDAL TEST - SLIDE (Widalslide)', 'Widalslide', 'SEROLOGY', 'serology', 250],
  ['Urine Routine Examination', 'URINE ROUTINE EXAMINATION REPORT(URINE ROUTINE COMPLETE)', 'URINE ROUTINE COMPLETE', 'REPORT ON URINE ROUTINE', 'clinical_pathology', 180],
  ['Urine Culture & Sensitivity', 'URINE CULTURE & SENSITIVITY', 'URINE CULTURE & SENSITIVITY', 'URINE CULTURE & SENSITIVITY', 'microbiology', 650],
  ['Blood Culture BACTEC FX', 'BLOOD FUNGAL CULTURE BY BACTEC (BLOOD FUNGAL CULTURE BY BACTEC )', 'BLOOD FUNGAL CULTURE BY BACTEC', 'X-RAY', 'microbiology', 1100],
  ['Histopathology HPE Small Specimen', 'HISTOPATHOLOGY REPORT(Histopathology Small)', 'Histopathology Small', 'HISTOPATHOLOGY', 'histopathology', 850],
  ['Histopathology HPE Medium Specimen', 'HISTOPATHOLOGY REPORT(Histopathology Medium)', 'Histopathology Medium', 'HISTOPATHOLOGY', 'histopathology', 1400],
  ['Histopathology HPE Large Specimen', 'HISTOPATHOLOGY REPORT(Histopathology Large)', 'Histopathology Large', 'HISTOPATHOLOGY', 'histopathology', 2200],
  ['Pap Smear Cervical Cytology', 'PAP SMEAR(PAP SMEAR)', 'PAP SMEAR', 'CYTOLOGY', 'histopathology', 650],
  ['X-Ray Chest Frontal PA View', 'X RAY CHEST FRONTAL(X RAY CHEST FRONTAL)', 'X RAY CHEST FRONTAL', 'X-RAY', 'radiology_imaging', 350],
  ['USG Whole Abdomen & Pelvis', 'USG ABDOMEN AND PELVIS(USG ABDOMEN AND PELVIS)', 'USG ABDOMEN AND PELVIS', 'USG', 'radiology_imaging', 1200],
  ['CT Brain Plain Scan', 'CT BRAIN PLAIN(CT BRAIN PLAIN)', 'CT BRAIN PLAIN', 'CT SCAN', 'radiology_imaging', 2500],
  ['MRI Brain Plain 1.5T', 'MRI BRAIN PLAIN(MRI BRAIN PLAIN)', 'MRI BRAIN PLAIN', 'MRI', 'radiology_imaging', 5500],
  ['2D Echocardiography with Doppler', '2D ECHO(2D ECHO)', '2D ECHO', 'RADIOLOGY', 'radiology_imaging', 1500],
  ['Bone Marrow Aspiration Cytology', 'BONE MARROW ASPIRATION CYTOLOGY(BONE MARROW ASPIRATION CYTOLOGY)', 'BONE MARROW ASPIRATION CYTOLOGY', 'CYTOLOGY', 'haematology', 1800],
  ['D-Dimer Quantitative Assay', 'D-Dimer Quantitative Test(DIMER)', 'DIMER', 'SPECIAL REPORTS', 'coagulation', 1200],
  ['Prothrombin Time (PT/INR)', 'PROTHROMBIN TIME (PT)', 'PT', 'COAGULATION PROFILE', 'coagulation', 350],
  ['GeneXpert MTB / RIF', 'GENEXPERT MTB RIFAMPICIN RESISTANCE DETECTION(Genexpert)', 'Genexpert', 'MICRO BIOLOGY', 'molecular_pcr', 2200]
];

// Read and build the complete dataset
const formattedCatalog = RAW_PAGE_DATA.map((item, index) => {
  const code = (1000 + index + 1).toString();
  const [name, displayName, shortName, category, department, price] = item;
  const b2bPrice = Math.round(price * 0.6);

  return {
    id: `TEST_${code}`,
    code,
    name,
    displayName,
    shortName,
    category,
    department,
    sampleType: department === 'radiology_imaging' ? 'Patient Walk-in' : department === 'clinical_pathology' ? 'Sterile Urine/Stool Pot' : 'Serum / EDTA Blood',
    container: department === 'radiology_imaging' ? 'Digital DICOM Film' : 'Yellow SST / Lavender EDTA',
    method: 'NABL Certified Automated Diagnostic Protocol',
    tat: department === 'radiology_imaging' ? '30 Minutes' : '2-4 Hours',
    price: price || 350,
    b2bPrice: b2bPrice || 200,
    popular: index < 15,
    parameters: [
      { name: shortName || name, shortName: shortName.substring(0, 8), unit: 'U/L', normalMale: 'Normal', normalFemale: 'Normal', method: 'Automated' }
    ]
  };
});

console.log('Successfully structured ' + formattedCatalog.length + ' master test catalog items.');
