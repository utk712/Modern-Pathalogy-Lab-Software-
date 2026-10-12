# 🕸️ Requirements Traceability Matrix (RTM)

| Requirement ID | Requirement Description | Test Case ID | Test Category | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Dynamic 2FA Vendor Gate Authentication | AUTH-001, AUTH-002, AUTH-003 | Authentication | Automated Unit Test | **PASSED** |
| **REQ-CLIN-01** | Liver Function Parameter Formulas (Globulin, A/G Ratio) | CALC-001, CALC-002 | Clinical Calculations | Mathematical Verification | **PASSED** |
| **REQ-CLIN-02** | Lipid Profile Parameter Formulas (VLDL) | CALC-003 | Clinical Calculations | Mathematical Verification | **PASSED** |
| **REQ-CLIN-03** | CBC Red Cell Indices (MCV, MCH, MCHC) | CALC-004 | Clinical Calculations | Mathematical Verification | **PASSED** |
| **REQ-CLIN-04** | Kidney Function eGFR (CKD-EPI 2021 & MDRD Equations) | CALC-005, CALC-006, CALC-007 | Clinical Calculations | Mathematical Verification | **PASSED** |
| **REQ-INT-01** | ASTM E1381/E1394 Analyzer Frame Parsing | ASTM-001 | Interoperability | Automated Integration Test | **PASSED** |
| **REQ-INT-02** | HL7 v2.5 ORU^R01 Analyzer Message Parsing | HL7-001 | Interoperability | Automated Integration Test | **PASSED** |
| **REQ-SAFE-01** | Zero Patient-Result Crossover Isolation Guard | CROSS-001 | Patient Safety | Safety Isolation Test | **PASSED** |
| **REQ-DATA-01** | Database Integrity & JSON Schema Verification | DB-001 | Database Integrity | System Integration Test | **PASSED** |
| **REQ-DATA-02** | Full Database Backup, Destroy & Restore Cycle | BACKUP-001 | Backup & Restore | Full Cycle Disaster Recovery | **PASSED** |
| **REQ-SEC-01** | HMAC-SHA256 Cryptographic Offline Licensing Engine | SEC-001, SEC-002 | Security & Licensing | Cryptographic Verification | **PASSED** |
| **REQ-SEC-02** | Live Countdown Expiry & Session Lockout Enforcement | SEC-003 | Security & Licensing | Real-time Lockout Test | **PASSED** |
| **REQ-SEC-03** | Cryptographic Signature Tamper Rejection Safety | SEC-004 | Security & Licensing | Security Tamper Test | **PASSED** |
| **REQ-PERF-01** | High-Load Patient Data Serialization Performance | PERF-001 | Performance Benchmarking | High Volume Latency Test | **PASSED** |
