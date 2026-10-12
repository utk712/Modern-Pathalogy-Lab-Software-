# 📋 Master Software Quality Assurance Test Plan
**Project:** Modern Diagnostic LIMS — v1.0.0 Standalone Enterprise Edition  
**Author:** Senior Software QA Architect & Test Automation Engineer  
**Date:** August 27, 2026  
**Status:** Executed & Validated  

---

## 1. Executive Overview & Scope
This Test Plan outlines the multi-layered verification strategy for the Modern Diagnostic Laboratory Information Management System (LIMS). The testing scope encompasses 40 specific testing domains including:
1. Authentication & Session Management
2. RBAC (Role-Based Access Control) & Authorization
3. Patient Registration & Demographic Management
4. Global Patient & Test Search Engine
5. Diagnostic Test Catalog & Master Configuration
6. Financial Billing, Rate Cards & Discount Management
7. Barcode Sticker Generation (Code128 Format)
8. Phlebotomy Workstation & Tube Selection
9. Sample Accessioning & Specimen Lifecycle
10. Result Entry & Worklist Management
11. Universal Analyzer Integration (ASTM E1381/E1394 & HL7 v2.5)
12. Patient-Result Crossover Isolation (Critical Safety)
13. Clinical Calculations Verification (Globulin, A/G Ratio, VLDL, eGFR CKD-EPI 2021)
14. Quality Control (QC) & Levey-Jennings (L-J) Charts
15. Pathologist Review Queue & Digital Signature Sign-off
16. NABL Report Authorization & PDF Generator
17. Digital Report Dispatch (WhatsApp & Email)
18. Report & Bill-Receipt Designer (eLabAssist Compatible)
19. Reagent & Consumable Inventory Auto-Deduction
20. B2B Franchise / Collection Center Ledger Management
21. Executive Analytics & Dashboard KPI Reporting
22. Database Integrity & Referential Checks
23. Database Backup & Disaster Recovery Cycle
24. HMAC-SHA256 Cryptographic Licensing & Expiry Lockout
25. Security & Input Sanitization
26. Audit Trail & Maintenance Logging
27. Error Recovery & Graceful Degradation
28. Performance Benchmarking & High Load Latency
29. Concurrency & BroadcastChannel Session Protection
30. C# Executable Installer Build & Deployment

---

## 2. Test Environment Architecture
```text
Electron Desktop Container (v43.4.0)
   ├── React 18 UI Frontend (Vite 6 / TailwindCSS)
   ├── LabContext Global State Store
   └── REST Client (HTTP fetch / BroadcastChannel)
            │
            ▼ (Port 5000)
Node.js Express Backend Daemon (server/index.js)
   ├── SQLite / JSON Data Persistence (server/lims_database.json)
   ├── Automated Backup Engine (C:\ModernLIMS_Backups)
   └── Analyzer Interfacing Hub (ASTM E1394 / HL7 v2.5 Drivers)
```

---

## 3. Test Execution Methodology
* **White Box Testing:** Static code analysis, bracket safety, safe property accessors (`.replace()`, `.map()`, `samples || []`), and 0 unhandled button handlers.
* **Unit Testing:** Isolated functional verification of cryptographic key generators (`licenseCrypto.js`), eGFR calculators, and state reducers.
* **Gray Box Testing:** REST endpoint validation (`http://localhost:5000/api/license-info`), database backup/wipe/restore integrity, and ASTM/HL7 frame parsing.
* **Black Box Testing:** Complete end-to-end user workflows (Patient Registration -> Phlebotomy -> Worklist -> Doctor Sign-off -> NABL PDF Dispatch).
