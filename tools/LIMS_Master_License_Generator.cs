using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Windows.Forms;

// =========================================================================
// Official Assembly Metadata (Prevents Antivirus & SmartScreen False Positives)
// =========================================================================
[assembly: AssemblyTitle("PulseLab Diagnostic LIMS - Administration & Client Portal")]
[assembly: AssemblyDescription("Enterprise Clinical Laboratory Client & Maintenance Manager")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("PulseLab Medical Diagnostic Systems")]
[assembly: AssemblyProduct("Modern Diagnostic LIMS")]
[assembly: AssemblyCopyright("Copyright © 2026 PulseLab Medical Diagnostic Systems")]
[assembly: AssemblyTrademark("")]
[assembly: AssemblyCulture("")]
[assembly: ComVisible(false)]
[assembly: AssemblyVersion("2.4.0.0")]
[assembly: AssemblyFileVersion("2.4.0.0")]

namespace PulseLabLicenseManager
{
    public class LabAccount
    {
        public string Id;
        public string Name;
        public string DoctorName;
        public string Phone;
        public string City;
        public string CurrentKey;
        public int ValidityDays;
        public long ExpiryTimestamp;
        public string FormattedExpiry;
    }

    public class GeneratedKeyResult
    {
        public string Key;
        public long ExpiryTimestamp;
        public string FormattedExpiry;
    }

    public class MainForm : Form
    {
        private const string MASTER_SALT = "PULSE_LIMS_MASTER_VENDOR_SECRET_KEY_2026_SECURE_AUTH";
        private string dbFile = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "client_licenses_db.json");
        private List<LabAccount> labsList = new List<LabAccount>();

        private TextBox txtLabName;
        private TextBox txtDoctor;
        private TextBox txtPhone;
        private TextBox txtCity;
        private ComboBox cmbDuration;
        private DataGridView gridLabs;
        private TextBox txtSearch;
        private Label lblKpiTotal;
        private Label lblKpiActive;
        private Label lblKpiExpiring;
        private Label lblKpiExpired;

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        public MainForm()
        {
            InitializeComponent();
            LoadData();
            RefreshGrid();
        }

        private void InitializeComponent()
        {
            this.Text = "PulseLab LIMS — Vendor Master Client & License Manager";
            this.Size = new Size(1050, 720);
            this.MinimumSize = new Size(950, 650);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42); // slate-900
            this.ForeColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.5F);

            // ================= TOP HEADER =================
            Panel headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 85;
            headerPanel.BackColor = Color.FromArgb(2, 6, 23); // slate-950
            headerPanel.Padding = new Padding(20, 15, 20, 15);

            Label lblTitle = new Label();
            lblTitle.Text = "🔑 Master Client & Security License Manager";
            lblTitle.Font = new Font("Segoe UI", 14F, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.AutoSize = true;
            lblTitle.Location = new Point(20, 15);

            Label lblSub = new Label();
            lblSub.Text = "Private Vendor Admin Tool • Generate 6-Month Security Keys & Manage Client Laboratories";
            lblSub.Font = new Font("Segoe UI", 9F);
            lblSub.ForeColor = Color.FromArgb(56, 189, 248); // sky-400
            lblSub.AutoSize = true;
            lblSub.Location = new Point(22, 45);

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSub);

            // ================= KPI CARDS BAR =================
            Panel kpiPanel = new Panel();
            kpiPanel.Dock = DockStyle.Top;
            kpiPanel.Height = 65;
            kpiPanel.BackColor = Color.FromArgb(15, 23, 42);
            kpiPanel.Padding = new Padding(20, 10, 20, 10);

            lblKpiTotal = CreateKpiLabel("Total Labs: 0", Color.White, 20, kpiPanel);
            lblKpiActive = CreateKpiLabel("Active 6M: 0", Color.FromArgb(52, 211, 153), 200, kpiPanel);
            lblKpiExpiring = CreateKpiLabel("Expiring (<15d): 0", Color.FromArgb(251, 191, 36), 380, kpiPanel);
            lblKpiExpired = CreateKpiLabel("Expired/Due: 0", Color.FromArgb(248, 113, 113), 580, kpiPanel);

            // ================= LEFT: REGISTRATION & GENERATOR PANEL =================
            GroupBox grpAdd = new GroupBox();
            grpAdd.Text = " Register Client Lab & Generate Key ";
            grpAdd.ForeColor = Color.FromArgb(148, 163, 184);
            grpAdd.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            grpAdd.Size = new Size(340, 500);
            grpAdd.Location = new Point(20, 160);
            grpAdd.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Bottom;

            int y = 30;

            Label lblName = new Label();
            lblName.Text = "Laboratory Name *";
            lblName.ForeColor = Color.White;
            lblName.Location = new Point(15, y);
            lblName.AutoSize = true;
            txtLabName = new TextBox();
            txtLabName.Location = new Point(15, y + 22);
            txtLabName.Size = new Size(310, 26);
            txtLabName.BackColor = Color.FromArgb(2, 6, 23);
            txtLabName.ForeColor = Color.White;
            txtLabName.Font = new Font("Segoe UI", 9.5F);
            grpAdd.Controls.Add(lblName);
            grpAdd.Controls.Add(txtLabName);
            y += 60;

            Label lblDoc = new Label();
            lblDoc.Text = "Doctor / Owner Name";
            lblDoc.ForeColor = Color.White;
            lblDoc.Location = new Point(15, y);
            lblDoc.AutoSize = true;
            txtDoctor = new TextBox();
            txtDoctor.Location = new Point(15, y + 22);
            txtDoctor.Size = new Size(310, 26);
            txtDoctor.BackColor = Color.FromArgb(2, 6, 23);
            txtDoctor.ForeColor = Color.White;
            grpAdd.Controls.Add(lblDoc);
            grpAdd.Controls.Add(txtDoctor);
            y += 60;

            Label lblPh = new Label();
            lblPh.Text = "WhatsApp / Mobile No.";
            lblPh.ForeColor = Color.White;
            lblPh.Location = new Point(15, y);
            lblPh.AutoSize = true;
            txtPhone = new TextBox();
            txtPhone.Location = new Point(15, y + 22);
            txtPhone.Size = new Size(310, 26);
            txtPhone.BackColor = Color.FromArgb(2, 6, 23);
            txtPhone.ForeColor = Color.White;
            grpAdd.Controls.Add(lblPh);
            grpAdd.Controls.Add(txtPhone);
            y += 60;

            Label lblCt = new Label();
            lblCt.Text = "City / Branch Location";
            lblCt.ForeColor = Color.White;
            lblCt.Location = new Point(15, y);
            lblCt.AutoSize = true;
            txtCity = new TextBox();
            txtCity.Location = new Point(15, y + 22);
            txtCity.Size = new Size(310, 26);
            txtCity.BackColor = Color.FromArgb(2, 6, 23);
            txtCity.ForeColor = Color.White;
            grpAdd.Controls.Add(lblCt);
            grpAdd.Controls.Add(txtCity);
            y += 60;

            Label lblDur = new Label();
            lblDur.Text = "Validity Period";
            lblDur.ForeColor = Color.White;
            lblDur.Location = new Point(15, y);
            lblDur.AutoSize = true;
            cmbDuration = new ComboBox();
            cmbDuration.Location = new Point(15, y + 22);
            cmbDuration.Size = new Size(310, 26);
            cmbDuration.DropDownStyle = ComboBoxStyle.DropDownList;
            cmbDuration.BackColor = Color.FromArgb(2, 6, 23);
            cmbDuration.ForeColor = Color.White;
            cmbDuration.Items.Add("⭐ 6 Months (180 Days)");
            cmbDuration.Items.Add("📅 1 Year (365 Days)");
            cmbDuration.Items.Add("⏱️ 1 Month Trial (30 Days)");
            cmbDuration.SelectedIndex = 0;
            grpAdd.Controls.Add(lblDur);
            grpAdd.Controls.Add(cmbDuration);
            y += 70;

            Button btnGenerate = new Button();
            btnGenerate.Text = "⚡ Generate Key & Save Lab";
            btnGenerate.Location = new Point(15, y);
            btnGenerate.Size = new Size(310, 42);
            btnGenerate.BackColor = Color.FromArgb(14, 165, 233); // sky-500
            btnGenerate.ForeColor = Color.White;
            btnGenerate.FlatStyle = FlatStyle.Flat;
            btnGenerate.FlatAppearance.BorderSize = 0;
            btnGenerate.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            btnGenerate.Cursor = Cursors.Hand;
            btnGenerate.Click += BtnGenerate_Click;
            grpAdd.Controls.Add(btnGenerate);

            // ================= RIGHT: DIRECTORY TABLE & SEARCH =================
            Panel rightPanel = new Panel();
            rightPanel.Location = new Point(375, 160);
            rightPanel.Size = new Size(645, 500);
            rightPanel.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;

            Label lblSearch = new Label();
            lblSearch.Text = "Search Labs:";
            lblSearch.ForeColor = Color.FromArgb(148, 163, 184);
            lblSearch.Location = new Point(0, 5);
            lblSearch.AutoSize = true;

            txtSearch = new TextBox();
            txtSearch.Location = new Point(85, 2);
            txtSearch.Size = new Size(200, 25);
            txtSearch.BackColor = Color.FromArgb(2, 6, 23);
            txtSearch.ForeColor = Color.White;
            txtSearch.TextChanged += (s, e) => RefreshGrid();

            Button btnRenew = new Button();
            btnRenew.Text = "⚡ Renew 6M";
            btnRenew.Location = new Point(295, 0);
            btnRenew.Size = new Size(110, 28);
            btnRenew.BackColor = Color.FromArgb(16, 185, 129);
            btnRenew.ForeColor = Color.White;
            btnRenew.FlatStyle = FlatStyle.Flat;
            btnRenew.Cursor = Cursors.Hand;
            btnRenew.FlatAppearance.BorderSize = 0;
            btnRenew.Click += BtnRenew_Click;

            Button btnCopyWA = new Button();
            btnCopyWA.Text = "💬 WhatsApp";
            btnCopyWA.Location = new Point(415, 0);
            btnCopyWA.Size = new Size(115, 28);
            btnCopyWA.BackColor = Color.FromArgb(79, 70, 229);
            btnCopyWA.ForeColor = Color.White;
            btnCopyWA.FlatStyle = FlatStyle.Flat;
            btnCopyWA.Cursor = Cursors.Hand;
            btnCopyWA.FlatAppearance.BorderSize = 0;
            btnCopyWA.Click += BtnCopyWA_Click;

            Button btnDelete = new Button();
            btnDelete.Text = "🗑️ Delete";
            btnDelete.Location = new Point(540, 0);
            btnDelete.Size = new Size(100, 28);
            btnDelete.BackColor = Color.FromArgb(225, 29, 72); // rose-600
            btnDelete.ForeColor = Color.White;
            btnDelete.FlatStyle = FlatStyle.Flat;
            btnDelete.Cursor = Cursors.Hand;
            btnDelete.FlatAppearance.BorderSize = 0;
            btnDelete.Click += BtnDelete_Click;

            gridLabs = new DataGridView();
            gridLabs.Location = new Point(0, 38);
            gridLabs.Size = new Size(645, 460);
            gridLabs.Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Bottom;
            gridLabs.BackgroundColor = Color.FromArgb(2, 6, 23);
            gridLabs.ForeColor = Color.White;
            gridLabs.DefaultCellStyle.BackColor = Color.FromArgb(15, 23, 42);
            gridLabs.DefaultCellStyle.ForeColor = Color.White;
            gridLabs.DefaultCellStyle.SelectionBackColor = Color.FromArgb(14, 165, 233);
            gridLabs.DefaultCellStyle.SelectionForeColor = Color.White;
            gridLabs.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(30, 41, 59);
            gridLabs.ColumnHeadersDefaultCellStyle.ForeColor = Color.FromArgb(203, 213, 225);
            gridLabs.ColumnHeadersDefaultCellStyle.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            gridLabs.EnableHeadersVisualStyles = false;
            gridLabs.ReadOnly = true;
            gridLabs.AllowUserToAddRows = false;
            gridLabs.SelectionMode = DataGridViewSelectionMode.FullRowSelect;
            gridLabs.RowHeadersVisible = false;
            gridLabs.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;

            gridLabs.Columns.Add("Id", "Lab ID");
            gridLabs.Columns.Add("Name", "Laboratory Name");
            gridLabs.Columns.Add("Doctor", "Doctor / Contact");
            gridLabs.Columns.Add("Key", "Active Security Key");
            gridLabs.Columns.Add("Status", "Days Left");
            gridLabs.Columns.Add("Expiry", "Valid Until");

            gridLabs.Columns["Id"].Width = 70;
            gridLabs.Columns["Name"].Width = 150;
            gridLabs.Columns["Key"].Width = 180;
            gridLabs.Columns["Status"].Width = 90;

            rightPanel.Controls.Add(lblSearch);
            rightPanel.Controls.Add(txtSearch);
            rightPanel.Controls.Add(btnRenew);
            rightPanel.Controls.Add(btnCopyWA);
            rightPanel.Controls.Add(btnDelete);
            rightPanel.Controls.Add(gridLabs);

            // Add all main panels
            this.Controls.Add(rightPanel);
            this.Controls.Add(grpAdd);
            this.Controls.Add(kpiPanel);
            this.Controls.Add(headerPanel);
        }

        private Label CreateKpiLabel(string text, Color color, int x, Panel parent)
        {
            Label lbl = new Label();
            lbl.Text = text;
            lbl.ForeColor = color;
            lbl.Font = new Font("Segoe UI", 10F, FontStyle.Bold);
            lbl.AutoSize = true;
            lbl.Location = new Point(x, 15);
            parent.Controls.Add(lbl);
            return lbl;
        }

        private void BtnGenerate_Click(object sender, EventArgs e)
        {
            string name = txtLabName.Text.Trim();
            if (string.IsNullOrEmpty(name))
            {
                MessageBox.Show("Please enter the Laboratory Name.", "Input Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtLabName.Focus();
                return;
            }

            int days = 180;
            if (cmbDuration.SelectedIndex == 1) days = 365;
            if (cmbDuration.SelectedIndex == 2) days = 30;

            GeneratedKeyResult keyData = GenerateKeyString(name, days);

            LabAccount account = new LabAccount();
            account.Id = "LAB-" + (labsList.Count + 1).ToString("D3");
            account.Name = name;
            account.DoctorName = txtDoctor.Text.Trim();
            account.Phone = txtPhone.Text.Trim();
            account.City = txtCity.Text.Trim();
            account.CurrentKey = keyData.Key;
            account.ValidityDays = days;
            account.ExpiryTimestamp = keyData.ExpiryTimestamp;
            account.FormattedExpiry = keyData.FormattedExpiry;

            labsList.Insert(0, account);
            SaveData();
            RefreshGrid();

            Clipboard.SetText(keyData.Key);
            MessageBox.Show("✅ Laboratory registered successfully!\n\nSecurity Key (Copied to Clipboard):\n" + keyData.Key + "\n\nValid Until: " + keyData.FormattedExpiry, "License Key Generated", MessageBoxButtons.OK, MessageBoxIcon.Information);

            txtLabName.Clear();
            txtDoctor.Clear();
            txtPhone.Clear();
            txtCity.Clear();
        }

        private void BtnRenew_Click(object sender, EventArgs e)
        {
            if (gridLabs.SelectedRows.Count == 0)
            {
                MessageBox.Show("Please select a laboratory row to renew.", "Select Lab", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            string labId = gridLabs.SelectedRows[0].Cells["Id"].Value.ToString();
            LabAccount lab = labsList.Find(l => l.Id == labId);
            if (lab != null)
            {
                if (MessageBox.Show("Renew 6-Month Security License for \"" + lab.Name + "\"?", "Confirm 6M Renewal", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes)
                {
                    GeneratedKeyResult keyData = GenerateKeyString(lab.Name, 180);
                    lab.CurrentKey = keyData.Key;
                    lab.ExpiryTimestamp = keyData.ExpiryTimestamp;
                    lab.FormattedExpiry = keyData.FormattedExpiry;
                    lab.ValidityDays = 180;

                    SaveData();
                    RefreshGrid();

                    Clipboard.SetText(keyData.Key);
                    MessageBox.Show("✅ 6-Month Renewal Key Generated and Copied to Clipboard!\n\nNew Key:\n" + keyData.Key + "\nValid Until: " + keyData.FormattedExpiry, "Renewal Complete", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private void BtnCopyWA_Click(object sender, EventArgs e)
        {
            if (gridLabs.SelectedRows.Count == 0)
            {
                MessageBox.Show("Please select a laboratory row first.", "Select Lab", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            string labId = gridLabs.SelectedRows[0].Cells["Id"].Value.ToString();
            LabAccount lab = labsList.Find(l => l.Id == labId);
            if (lab != null)
            {
                string doctor = string.IsNullOrEmpty(lab.DoctorName) ? "Doctor" : lab.DoctorName;
                string msg = "*Modern Diagnostic LIMS - Security License Key*\n\n" +
                             "🏥 *Laboratory:* " + lab.Name + "\n" +
                             "👨‍⚕️ *Contact:* " + doctor + "\n" +
                             "🔑 *Security Key:* `" + lab.CurrentKey + "`\n" +
                             "⏱️ *Valid Until:* " + lab.FormattedExpiry + "\n\n" +
                             "*Instructions:*\n" +
                             "1. Open Modern Diagnostic LIMS on your PC.\n" +
                             "2. Enter your Lab Name and paste the Security Key above.\n" +
                             "3. Click 'Activate Software'.";

                Clipboard.SetText(msg);
                MessageBox.Show("💬 WhatsApp Message Copied for " + lab.Name + "!\nYou can paste it directly in WhatsApp chat with the client.", "Copied", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        private void BtnDelete_Click(object sender, EventArgs e)
        {
            if (gridLabs.SelectedRows.Count == 0)
            {
                MessageBox.Show("Please select a laboratory row from the list to delete.", "Select Lab", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            string labId = gridLabs.SelectedRows[0].Cells["Id"].Value.ToString();
            LabAccount lab = labsList.Find(l => l.Id == labId);
            if (lab != null)
            {
                if (MessageBox.Show("Are you sure you want to permanently delete \"" + lab.Name + "\" from your directory?", "Confirm Delete Lab Account", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) == DialogResult.Yes)
                {
                    labsList.Remove(lab);
                    SaveData();
                    RefreshGrid();
                    MessageBox.Show("✅ Laboratory account \"" + lab.Name + "\" has been deleted.", "Account Deleted", MessageBoxButtons.OK, MessageBoxIcon.Information);
                }
            }
        }

        private GeneratedKeyResult GenerateKeyString(string labName, int days)
        {
            string normLab = System.Text.RegularExpressions.Regex.Replace(labName.ToUpper(), "[^A-Z0-9]", "").Trim();
            string labCode = normLab.Length >= 6 ? normLab.Substring(0, 6) : normLab.PadRight(6, 'X');

            DateTime now = DateTime.UtcNow;
            DateTime expiry = now.AddDays(days);
            long epochSeconds = (long)(expiry - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds;
            string expiryHex = epochSeconds.ToString("X").PadLeft(8, '0');
            string daysCode = (days >= 999) ? "LFT" : days.ToString() + "D".PadLeft(4, '0');

            string payload = labCode + ":" + expiryHex + ":" + daysCode + ":" + MASTER_SALT;
            string signature = ComputeSha256(payload).ToUpper();

            string sig1 = signature.Substring(0, 4);
            string sig2 = signature.Substring(4, 4);
            string sig3 = signature.Substring(8, 4);

            string licenseKey = "LIMS-" + daysCode + "-" + labCode + "-" + expiryHex + "-" + sig1 + "-" + sig2 + "-" + sig3;
            string formattedExpiry = expiry.ToString("dd MMM yyyy");

            GeneratedKeyResult res = new GeneratedKeyResult();
            res.Key = licenseKey;
            res.ExpiryTimestamp = epochSeconds * 1000;
            res.FormattedExpiry = formattedExpiry;
            return res;
        }

        private string ComputeSha256(string rawData)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }

        private void RefreshGrid()
        {
            gridLabs.Rows.Clear();
            string search = txtSearch.Text.Trim().ToLower();
            long now = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;

            int activeCount = 0;
            int expiringSoon = 0;
            int expiredCount = 0;

            foreach (var lab in labsList)
            {
                long msRemaining = lab.ExpiryTimestamp - now;
                int days = (int)Math.Ceiling((double)msRemaining / (1000.0 * 60 * 60 * 24));

                if (days <= 0) expiredCount++;
                else if (days <= 15) { expiringSoon++; activeCount++; }
                else activeCount++;

                if (!string.IsNullOrEmpty(search))
                {
                    string doc = lab.DoctorName ?? "";
                    string city = lab.City ?? "";
                    string ph = lab.Phone ?? "";

                    if (!lab.Name.ToLower().Contains(search) &&
                        !doc.ToLower().Contains(search) &&
                        !city.ToLower().Contains(search) &&
                        !ph.Contains(search))
                    {
                        continue;
                    }
                }

                string status = days <= 0 ? "Expired" : days.ToString() + " Days Left";
                gridLabs.Rows.Add(lab.Id, lab.Name, lab.DoctorName, lab.CurrentKey, status, lab.FormattedExpiry);
            }

            lblKpiTotal.Text = "Total Labs: " + labsList.Count;
            lblKpiActive.Text = "Active 6M: " + activeCount;
            lblKpiExpiring.Text = "Expiring (<15d): " + expiringSoon;
            lblKpiExpired.Text = "Expired/Due: " + expiredCount;
        }

        private void LoadData()
        {
            try
            {
                if (File.Exists(dbFile))
                {
                    string json = File.ReadAllText(dbFile);
                    var parsed = ParseSimpleJson(json);
                    if (parsed != null && parsed.Count > 0)
                    {
                        labsList = parsed;
                        return;
                    }
                }
            }
            catch { }

            // Default initial lab
            GeneratedKeyResult defaultKey = GenerateKeyString("Modern Diagnostic Pathology Lab", 180);
            LabAccount acc = new LabAccount();
            acc.Id = "LAB-001";
            acc.Name = "Modern Diagnostic Pathology Lab";
            acc.DoctorName = "Dr. Rajesh Sharma";
            acc.Phone = "9876543210";
            acc.City = "Mumbai Central";
            acc.CurrentKey = defaultKey.Key;
            acc.ValidityDays = 180;
            acc.ExpiryTimestamp = defaultKey.ExpiryTimestamp;
            acc.FormattedExpiry = defaultKey.FormattedExpiry;
            labsList.Add(acc);

            SaveData();
        }

        private void SaveData()
        {
            try
            {
                StringBuilder sb = new StringBuilder();
                sb.AppendLine("[");
                for (int i = 0; i < labsList.Count; i++)
                {
                    var l = labsList[i];
                    sb.AppendLine("  {");
                    sb.AppendLine("    \"Id\": \"" + EscapeJson(l.Id) + "\",");
                    sb.AppendLine("    \"Name\": \"" + EscapeJson(l.Name) + "\",");
                    sb.AppendLine("    \"DoctorName\": \"" + EscapeJson(l.DoctorName) + "\",");
                    sb.AppendLine("    \"Phone\": \"" + EscapeJson(l.Phone) + "\",");
                    sb.AppendLine("    \"City\": \"" + EscapeJson(l.City) + "\",");
                    sb.AppendLine("    \"CurrentKey\": \"" + EscapeJson(l.CurrentKey) + "\",");
                    sb.AppendLine("    \"ValidityDays\": " + l.ValidityDays + ",");
                    sb.AppendLine("    \"ExpiryTimestamp\": " + l.ExpiryTimestamp + ",");
                    sb.AppendLine("    \"FormattedExpiry\": \"" + EscapeJson(l.FormattedExpiry) + "\"");
                    sb.Append("  }" + (i < labsList.Count - 1 ? "," : "") + "\n");
                }
                sb.AppendLine("]");
                File.WriteAllText(dbFile, sb.ToString());
            }
            catch { }
        }

        private string EscapeJson(string s)
        {
            if (s == null) return "";
            return s.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }

        private List<LabAccount> ParseSimpleJson(string json)
        {
            var list = new List<LabAccount>();
            var chunks = json.Split(new string[] { "}," }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var chunk in chunks)
            {
                string id = ExtractJsonVal(chunk, "Id");
                string name = ExtractJsonVal(chunk, "Name");
                if (!string.IsNullOrEmpty(name))
                {
                    long ts;
                    if (!long.TryParse(ExtractJsonVal(chunk, "ExpiryTimestamp"), out ts))
                    {
                        ts = (long)(DateTime.UtcNow.AddDays(180) - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalMilliseconds;
                    }

                    LabAccount a = new LabAccount();
                    a.Id = id;
                    a.Name = name;
                    a.DoctorName = ExtractJsonVal(chunk, "DoctorName");
                    a.Phone = ExtractJsonVal(chunk, "Phone");
                    a.City = ExtractJsonVal(chunk, "City");
                    a.CurrentKey = ExtractJsonVal(chunk, "CurrentKey");
                    a.ValidityDays = 180;
                    a.ExpiryTimestamp = ts;
                    a.FormattedExpiry = ExtractJsonVal(chunk, "FormattedExpiry");
                    list.Add(a);
                }
            }
            return list;
        }

        private string ExtractJsonVal(string block, string key)
        {
            string search = "\"" + key + "\":";
            int idx = block.IndexOf(search);
            if (idx == -1) return "";
            int start = idx + search.Length;
            string rest = block.Substring(start).Trim();
            if (rest.StartsWith("\""))
            {
                rest = rest.Substring(1);
                int end = rest.IndexOf("\"");
                return end != -1 ? rest.Substring(0, end) : "";
            }
            else
            {
                int end = rest.IndexOfAny(new char[] { ',', '\n', '\r', '}' });
                return end != -1 ? rest.Substring(0, end).Trim() : rest.Trim();
            }
        }
    }
}
