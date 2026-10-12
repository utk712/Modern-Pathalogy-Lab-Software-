# Modern Diagnostic LIMS (PulseLab Enterprise)

> **Version:** 2.4.0 (Build 2026.08)  
> **Compliance:** ISO 15189:2022 & NABL Medical Laboratory Diagnostic Standards  
> **Architecture:** Standalone Native Windows Desktop Application (.EXE) with Embedded Node Engine

---

## 📁 Clean Modular Architecture

```text
elabassist-modern-lims/
├── 🌐 src/                        # FRONTEND UI APPLICATION LAYER
│   ├── components/                # React UI modules (Navbar, Reception, Phlebotomy, Reports)
│   ├── context/                   # Global state (LabContext, Session & Single Active Device Lock)
│   ├── utils/                     # Cryptographic license verification (HMAC-SHA256), barcode logic
│   ├── App.jsx                    # Root security gating & module router
│   └── main.jsx                   # React entry point
│
├── ⚙️ server/                     # BACKEND & DIAGNOSTIC ENGINE LAYER
│   ├── index.js                   # Central REST API server & static asset handler
│   ├── db.js                      # Central SQLite/JSON database abstraction layer
│   └── lims_database.json         # Local laboratory database (Patients, Tests, Devices, Profile)
│
├── 🔑 tools/                      # VENDOR MASTER TOOLS & KEY GENERATOR
│   ├── LIMS_Master_License_Generator.exe   # Standalone Vendor Desktop Keygen & Client Directory App
│   ├── LIMS_Master_License_Generator.cs    # Source code for standalone vendor keygen tool
│   ├── Vendor_License_Generator.html       # Standalone portable HTML license portal
│   └── client_licenses_db.json             # Permanent client accounts directory
│
├── 📦 release/                    # DESKTOP BINARY DISTRIBUTIONS
│   └── win-unpacked/              # Unpacked standalone native Windows executable
│       └── Modern Diagnostic LIMS.exe
│
├── 🚀 Modern_Diagnostic_LIMS_Setup.exe   # Standalone 1-File Setup Installer for Windows
├── 📄 USER_GUIDE.md               # User & Operator Manual
├── main.js                        # Native Electron desktop lifecycle & background backend runner
├── vite.config.js                 # Vite frontend build configuration
├── tailwind.config.js             # Modern 2026 Enterprise design system tokens
└── package.json                   # Project dependencies & build scripts
```

---

## 🚀 Running & Building

### 1. Run Development Server
```bash
npm run dev        # Starts Vite frontend on http://localhost:5173
npm run server     # Starts backend REST API on http://localhost:5000
```

### 2. Build Production Package
```bash
npm run build      # Compiles React frontend into dist/
```

### 3. Launch Standalone Native App
Double-click `Modern_Diagnostic_LIMS_Setup.exe` to install, or run `release/win-unpacked/Modern Diagnostic LIMS.exe`.
