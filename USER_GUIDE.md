# eLabAssist Modern LIMS — Complete User Manual & Operation Guide

**Version:** 2.4 Enterprise Edition  
**Target Platform:** Windows 10 / 11 (Standalone Desktop & Central Network Server)  
**Database Engine:** Central Real-Time REST Database  
**Catalog Size:** 1,148 Diagnostic Tests • Full 34-Parameter Hematology & Clinical Panels  

---

## Table of Contents
1. [Introduction & System Architecture](#1-introduction--system-architecture)
2. [Launching the Software (`eLabAssist-LIMS.exe`)](#2-launching-the-software-elabassist-limsexe)
3. [First-Time Laboratory Onboarding Wizard](#3-first-time-laboratory-onboarding-wizard)
4. [Authentication & Single-Device Security Guard](#4-authentication--single-device-security-guard)
5. [Patient Registration & Billing Management](#5-patient-registration--billing-management)
6. [Phlebotomy & Sample Collection Station](#6-phlebotomy--sample-collection-station)
7. [Laboratory Worklist & Diagnostic Result Entry](#7-laboratory-worklist--diagnostic-result-entry)
8. [Doctor Review & Digital Signature Queue](#8-doctor-review--digital-signature-queue)
9. [Diagnostic Report Engine & Report Designer](#9-diagnostic-report-engine--report-designer)
10. [Test Parameter Master (1,148+ Tests)](#10-test-parameter-master-1148-tests)
11. [Bi-Directional Machine Interfacing (ASTM / HL7)](#11-bi-directional-machine-interfacing-astm--hl7)
12. [B2B Franchisee Center & Financial Ledgers](#12-b2b-franchisee-center--financial-ledgers)
13. [Quality Control (QC) & Levey-Jennings Plots](#13-quality-control-qc--levey-jennings-plots)
14. [Reagent & Calibrators Inventory Manager](#14-reagent--calibrators-inventory-manager)
15. [Central Database Backup & Troubleshooting](#15-central-database-backup--troubleshooting)

---

## 1. Introduction & System Architecture
eLabAssist Modern LIMS is a clinic-grade, NABL (ISO 15189:2022) compliant Laboratory Information Management System built for standalone pathology labs, hospital diagnostic departments, imaging centers, and molecular reference laboratories.

### Key Architectural Highlights:
* **Clean Production Database:** Starts with zero hardcoded/dummy patient records. Retains complete master test management (1,148 tests) and analyzer interface drivers.
* **Single Active Session Guard:** Prevents unauthorized concurrent logins on multiple workstations.
* **Bi-Directional Machine Sync:** Real-time interfacing with Sysmex, Mindray, Roche Cobas, Bio-Rad, Horiba, and Stago analyzers.
* **Zero-Configuration Desktop Executable:** Double-click `eLabAssist-LIMS.exe` to run.

---

## 2. Launching the Software (`eLabAssist-LIMS.exe`)
You can launch the software in two ways:

### Method A: Standalone Native Executable (Recommended)
1. Navigate to the software folder: `C:\Users\DELL\.gemini\antigravity\scratch\elabassist-modern-lims\`.
2. Double-click **`eLabAssist-LIMS.exe`**.
3. The executable will silently launch the background server and open the LIMS window in maximized application mode.
4. A shield icon will appear in the Windows System Tray. To close the software, right-click the tray icon and select **Exit & Stop Software**.

### Method B: Standalone Batch Launcher
* Double-click **`Start-eLabAssist-LIMS.bat`**.

### Network / Multi-Workstation Access:
To access the software from other client computers on your local area network (LAN):
* Open any browser on client computers and go to: `http://<SERVER-IP-ADDRESS>:5000` (e.g. `http://192.168.1.15:5000`).

---

## 3. First-Time Laboratory Onboarding Wizard
When launching for the first time on a new system, the software prompts you to configure your laboratory details via a 4-step wizard:

### Step 1: Laboratory General Information
* **Laboratory Name:** Enter your official clinical center name (*e.g., PulseLab Diagnostics & Research Center*).
* **Tagline / Subtitle:** (*e.g., Advanced Pathology, Molecular Diagnostics & Imaging*).
* **Facility Type:** Select from *Standalone Pathology Lab, Diagnostic & Imaging Center, Hospital Laboratory (IPD/OPD), Reference Center*.
* **Clinical License / Reg No:** (*e.g., LAB-MH-2025/9981*).
* **Accreditation:** (*e.g., NABL Accredited & ISO 15189:2022 Certified*).
* **Address, City, State, Pincode:** Used automatically on patient bill invoices and report letterheads.
* **Contact Phone & Official Email:** Displayed on patient reports and barcode slips.

### Step 2: Pathologist & Director Credentials
* **Chief Pathologist Name:** (*e.g., Dr. Pallavi Gedam*).
* **Degrees & Qualifications:** (*e.g., MBBS, MD Pathology*).
* **Medical Council Registration No:** (*e.g., MCI-2012-08492-MH*).
* **Doctor Signature Block Text:** Configures the exact text printed under the signature area on final reports.

### Step 3: Master Admin Credentials & PIN
* **Admin Username:** Official email or login handle (*e.g., admin@pulselab.com*).
* **Master Password:** Secure account password.
* **4-Digit Recovery PIN:** Emergency PIN used for password resets and system recovery.

### Step 4: Summary & Instant Activation
* Review all information and click **"Activate & Launch Laboratory"**. The system instantly updates report letterhead designs, barcodes, and navigation headers.

---

## 4. Authentication & Single-Device Security Guard

### Clinical Role Selection:
Users can log in under 5 distinct clinical permission levels:
1. **Super Admin:** Full laboratory administration, tariff pricing, and user management.
2. **Chief Pathologist:** Authorized to clinically review, add remarks, and digitally sign reports.
3. **Senior Biochemist / Technician:** Access to worklists, analyzer sync, and manual result entry.
4. **Phlebotomist:** Dedicated patient registration, sample check-in, and barcode printing.
5. **B2B Franchisee Center:** Access to outsourced sample bookings and commercial balance ledgers.

### Single-Device Kick-Out Policy:
To ensure patient data privacy and prevent credential sharing:
* If User A is logged in on **Workstation 1**, and someone logs in with User A's credentials on **Workstation 2**, **Workstation 1 is immediately logged out**.
* Workstation 1 displays an instant security notification:
  > *"⚠️ Session Terminated: Your account was logged in from another device/system (Chrome on Workstation 2 at 05:20 PM). Previous session closed."*

---

## 5. Patient Registration & Billing Management

1. Go to **`Test Registration`** from the top navigation bar.
2. Enter patient demographic information:
   * **Title & Full Name:** (*Mr., Mrs., Master, Dr., Baby*)
   * **Age & Age Type:** (*Years, Months, Days*)
   * **Gender:** (*Male, Female, Other*) — Automatically adjusts biological reference ranges!
   * **Patient Type:** (*O.P.D., I.P.D., Emergency, Home Collection, Health Camp, Corporate*)
   * **Referring Doctor:** Select consulting physician or choose *Direct Walk-in / Self*.
   * **B2B Franchisee Center:** (Optional) If the sample originates from an outsourced collection center.
3. **Test Selection Transfer Box:**
   * Filter through 1,148+ available tests by Department or search keywords.
   * Click test item or press **`>`** to move it to the Selected Tests panel.
4. **Billing & Receipts:**
   * Enter discount % or concessions.
   * Select Payment Mode (*Cash, UPI / QR, Debit/Credit Card, B2B Ledger*).
5. Click **"Save & Print Barcode Vials"** $\to$ Generates UHID, Lab Code, Sample IDs, and opens the Barcode Thermal Label modal.

---

## 6. Phlebotomy & Sample Collection Station

1. Go to **`Phlebotomy`** station.
2. Scan the vial barcode or select the patient from the collection queue.
3. The system automatically categorizes tubes by specimen type:
   * **Purple Cap (EDTA Whole Blood):** CBC, HbA1c, ESR, Blood Grouping.
   * **Yellow/Gold Cap (Serum Clot Activator / SST):** LFT, KFT, Lipid Profile, Thyroid, Hormones.
   * **Grey Cap (Sodium Fluoride):** Blood Glucose (FBS/PPBS).
   * **Blue Cap (Sodium Citrate 3.2%):** PT/INR, APTT, D-Dimer.
   * **Yellow Container (Spot Urine):** Urine Routine & Microscopy.
4. Click **"Mark as Collected"** or **"Reject Sample"** (with clinical reasons like *Hemolyzed, Clotted, QNS*).

---

## 7. Laboratory Worklist & Diagnostic Result Entry

1. Go to **`Test Result`** from the top bar.
2. Select the patient from the live worklist.
3. Enter observed values for each parameter:
   * **Automated Panic Flags:** High values trigger an orange badge; Critical panic values trigger a flashing red badge.
   * **Calculated Parameters:** Automatic calculation for *eGFR (CKD-EPI), Indirect Bilirubin, Mentzer Index, A/G Ratio, AIP, Non-HDL Cholesterol*.
   * **Machine Fetch:** Click **"Fetch from Analyzer"** to pull results directly from interfaced Sysmex / Mindray / Cobas machines.
4. Click **"Save Results"** $\to$ Transitions sample to *Pending Doctor Approval*.

---

## 8. Doctor Review & Digital Signature Queue

1. Switch to **`Doctor Review`** module.
2. The Pathologist reviews abnormal flags, critical values, and delta differences.
3. **One-Click Clinical Remarks:** Select preset interpretations (*e.g. "Mild Microcytic Hypochromic Anemia observed. Iron studies recommended."*).
4. Click **"Approve & Sign Report"** $\to$ Confetti animation confirms authorization and embeds the Pathologist's digital signature and timestamp.

---

## 9. Diagnostic Report Engine & Report Designer

1. Go to **`Reports`** $\to$ **`Diagnostic Reports Engine`**.
2. **Features:**
   * **NABL 4-Column Layout:** Test Name, Observed Value, Unit, Biological Reference Interval.
   * **"1 Test Per Page" Rule:** Each major diagnostic panel (e.g. CBC, Lipid Profile) prints on its own clean A4 page.
   * **Unreported Parameter Suppression:** Only tests/parameters with actual results are printed.
   * **Letterhead Modes:** Toggle between Pre-Printed Stationery (top 2.0-inch margin) or Full In-App Digital Header Banner.
3. Click **"Download PDF"** for crystal-clear vector PDF export or **"Print Report"** for direct thermal/laser printing.

---

## 10. Test Parameter Master (1,148+ Tests)

1. Go to **`Administration` $\to$ `Test Parameter Master`**.
2. Select any test from the 11 clinical modalities:
   * **Complete Blood Count (CBC):** 34 clinical parameters (RBC indices, 5-part differential, absolute counts, platelet indices, smear examination).
   * **Urine Routine:** 23 clinical parameters (physical, chemical, and microscopic examination).
   * **LFT (13), KFT (12), Lipid Profile (10), Thyroid Profile (6), Coagulation (6).**
3. **Actions:**
   * Edit Biological Reference Intervals (Male, Female, Pediatric).
   * Modify Panic High / Panic Low values.
   * Reorder parameters using **Up / Down** arrows.
   * Add custom formulas and methodologies.

---

## 11. Bi-Directional Machine Interfacing (ASTM / HL7)

1. Go to **`Administration` $\to$ `Machine Interface`**.
2. Supported Analyzers:
   * **Sysmex XN-550 / XN-1000** (ASTM 1394-97 / HL7)
   * **Mindray BC-5000 / BC-6800 Plus** (HL7 v2.3.1 / RS232)
   * **Roche Cobas c311 / c501 Chemistry** (ASTM Serial & TCP/IP)
   * **Bio-Rad D-10 HPLC** (HbA1c ASTM E1394)
   * **Roche Cobas e411 CLIA** (Immunology ASTM/HL7)
   * **Stago Compact Max** (Coagulation ASTM 1394)
3. Test communication, send sample worklist queries, and verify live incoming data packets.

---

## 12. B2B Franchisee Center & Financial Ledgers

1. Go to **`B2B Management`**.
2. Register partner collection centers, diagnostic clinics, and hospital referral labs.
3. Set custom B2B discount rates (e.g., 30% - 40% tariff discounts).
4. Track real-time debtor ledgers, credit limits, and settled receipts.

---

## 13. Quality Control (QC) & Levey-Jennings Plots

1. Go to **`Quality Control (QC)`**.
2. Track daily control runs across 3 levels: Level 1 (Low), Level 2 (Normal), Level 3 (High).
3. Automated **Westgard Multi-Rule Evaluation**:
   * `1:2s` (Warning)
   * `1:3s` (Rejection / Out of Control)
   * `2:2s`, `R:4s`, `4:1s`, `10:x` (Systematic Error Detection)
4. Interactive Levey-Jennings Gaussian curve visualizations.

---

## 14. Reagent & Calibrators Inventory Manager

1. Go to **`Inventory`**.
2. Track consumable reagent packs, diluents, lysing reagents, and quality calibrators.
3. Set minimum buffer thresholds and receive automated alerts when stock dips below critical levels.
4. Monitor Lot numbers and expiry dates to prevent running tests with expired reagents.

---

## 15. Central Database Backup & Troubleshooting

### Database Location:
All laboratory registrations, user profiles, machine settings, and patient records are saved in:
`server/lims_database.json`

### Creating a Manual Backup:
* Simply copy the `server/lims_database.json` file to a secure USB drive or cloud backup folder.

### Common Solutions:
* **Port Conflict:** If port 5000 is occupied, set `PORT=5001` in your environment or launch via `eLabAssist-LIMS.exe`.
* **Single Device Session Notice:** If you see the kick-out notice, ensure you are only logged into the software on one computer at a time.

---

*© 2026 eLabAssist Modern LIMS. All rights reserved.*
