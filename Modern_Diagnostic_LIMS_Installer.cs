using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace ModernDiagnosticLIMSInstaller
{
    public class InstallerForm : Form
    {
        private ProgressBar progressBar;
        private Label lblStatus;
        private Label lblTitle;
        private Label lblSubTitle;
        private Button btnAction;
        private CheckBox chkLaunch;
        private Panel headerPanel;
        private System.Windows.Forms.Timer timer;
        private string installDir;
        private bool isInstalled = false;

        public InstallerForm()
        {
            InitializeComponents();
        }

        private void InitializeComponents()
        {
            this.Text = "Modern Diagnostic LIMS - Setup Wizard";
            this.Size = new Size(580, 420);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);

            installDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Modern-Diagnostic-LIMS");

            // Header Banner
            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 100;
            headerPanel.BackColor = Color.FromArgb(15, 23, 42); // slate-900

            lblTitle = new Label();
            lblTitle.Text = "Modern Diagnostic LIMS";
            lblTitle.Font = new Font("Segoe UI", 16F, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(24, 20);
            lblTitle.AutoSize = true;

            lblSubTitle = new Label();
            lblSubTitle.Text = "Universal Standalone Laboratory Information Management System";
            lblSubTitle.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            lblSubTitle.ForeColor = Color.FromArgb(148, 163, 184); // slate-400
            lblSubTitle.Location = new Point(26, 56);
            lblSubTitle.AutoSize = true;

            headerPanel.Controls.Add(lblTitle);
            headerPanel.Controls.Add(lblSubTitle);

            // Body Area
            Label lblIntro = new Label();
            lblIntro.Text = "This setup will install Modern Diagnostic LIMS on your computer.\r\nTarget Folder: " + installDir;
            lblIntro.Location = new Point(28, 120);
            lblIntro.Size = new Size(510, 45);
            lblIntro.ForeColor = Color.FromArgb(51, 65, 85);

            lblStatus = new Label();
            lblStatus.Text = "Ready to install. Click \"Install Now\" to continue.";
            lblStatus.Location = new Point(28, 185);
            lblStatus.Size = new Size(510, 22);
            lblStatus.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblStatus.ForeColor = Color.FromArgb(30, 41, 59);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(28, 215);
            progressBar.Size = new Size(510, 24);
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.Value = 0;

            chkLaunch = new CheckBox();
            chkLaunch.Text = "Launch Modern Diagnostic LIMS after setup completes";
            chkLaunch.Location = new Point(28, 255);
            chkLaunch.Size = new Size(450, 24);
            chkLaunch.Checked = true;
            chkLaunch.ForeColor = Color.FromArgb(15, 23, 42);

            // Bottom Buttons
            btnAction = new Button();
            btnAction.Text = "Install Now";
            btnAction.Size = new Size(130, 38);
            btnAction.Location = new Point(408, 320);
            btnAction.BackColor = Color.FromArgb(2, 132, 199); // sky-600
            btnAction.ForeColor = Color.White;
            btnAction.FlatStyle = FlatStyle.Flat;
            btnAction.FlatAppearance.BorderSize = 0;
            btnAction.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            btnAction.Cursor = Cursors.Hand;
            btnAction.Click += BtnAction_Click;

            Button btnCancel = new Button();
            btnCancel.Text = "Cancel";
            btnCancel.Size = new Size(90, 38);
            btnCancel.Location = new Point(306, 320);
            btnCancel.BackColor = Color.FromArgb(226, 232, 240);
            btnCancel.ForeColor = Color.FromArgb(71, 85, 105);
            btnCancel.FlatStyle = FlatStyle.Flat;
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Cursor = Cursors.Hand;
            btnCancel.Click += (s, e) => { this.Close(); };

            this.Controls.Add(headerPanel);
            this.Controls.Add(lblIntro);
            this.Controls.Add(lblStatus);
            this.Controls.Add(progressBar);
            this.Controls.Add(chkLaunch);
            this.Controls.Add(btnAction);
            this.Controls.Add(btnCancel);
        }

        private void BtnAction_Click(object sender, EventArgs e)
        {
            if (isInstalled)
            {
                if (chkLaunch.Checked)
                {
                    string exePath = Path.Combine(installDir, "Modern Diagnostic LIMS.exe");
                    if (File.Exists(exePath))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = exePath,
                            WorkingDirectory = installDir
                        });
                    }
                }
                this.Close();
                return;
            }

            btnAction.Enabled = false;
            lblStatus.Text = "Extracting runtime engine and clinical databases...";
            progressBar.Value = 20;

            Thread worker = new Thread(PerformInstallation);
            worker.IsBackground = true;
            worker.Start();
        }

        private void PerformInstallation()
        {
            try
            {
                // Terminate any previous background instance to prevent single-instance lock failure
                try
                {
                    foreach (var proc in Process.GetProcessesByName("Modern Diagnostic LIMS"))
                    {
                        proc.Kill();
                    }
                    Thread.Sleep(500);
                }
                catch { }

                // WIPE OLD INSTALLATION FILES SO NO OUTDATED 8/22 FILES REMAIN
                try
                {
                    if (Directory.Exists(installDir))
                    {
                        Directory.Delete(installDir, true);
                    }
                }
                catch { }

                Directory.CreateDirectory(installDir);

                // Clean any previous session/localStorage cache in AppData
                try
                {
                    string roamingData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "modern-diagnostic-lims");
                    if (Directory.Exists(roamingData)) Directory.Delete(roamingData, true);

                    string roamingData2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Modern Diagnostic LIMS");
                    if (Directory.Exists(roamingData2)) Directory.Delete(roamingData2, true);
                }
                catch { }

                // 1. Extract embedded payload zip resource
                Assembly assembly = Assembly.GetExecutingAssembly();
                using (Stream stream = assembly.GetManifestResourceStream("Payload.zip"))
                {
                    if (stream == null)
                    {
                        throw new Exception("Embedded installation payload not found in setup package.");
                    }

                    string tempZip = Path.Combine(Path.GetTempPath(), "lims_payload_" + Guid.NewGuid().ToString("N") + ".zip");
                    using (FileStream fs = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                    {
                        stream.CopyTo(fs);
                    }

                    this.Invoke((MethodInvoker)delegate
                    {
                        progressBar.Value = 60;
                        lblStatus.Text = "Configuring laboratory databases and clinical drivers...";
                    });

                    // Extract zip to installDir
                    using (ZipArchive archive = ZipFile.OpenRead(tempZip))
                    {
                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            string destPath = Path.Combine(installDir, entry.FullName);
                            if (string.IsNullOrEmpty(entry.Name))
                            {
                                Directory.CreateDirectory(destPath);
                            }
                            else
                            {
                                string parentDir = Path.GetDirectoryName(destPath);
                                if (!Directory.Exists(parentDir))
                                {
                                    Directory.CreateDirectory(parentDir);
                                }
                                entry.ExtractToFile(destPath, true);
                            }
                        }
                    }

                    try { File.Delete(tempZip); } catch { }
                }

                this.Invoke((MethodInvoker)delegate
                {
                    progressBar.Value = 85;
                    lblStatus.Text = "Creating Windows Desktop and Start Menu shortcuts...";
                });

                // 2. Create Desktop Shortcut
                string exeTarget = Path.Combine(installDir, "Modern Diagnostic LIMS.exe");
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktopPath, "Modern Diagnostic LIMS.lnk");
                CreateShortcut(shortcutPath, exeTarget, installDir, "Modern Diagnostic LIMS - Laboratory Information System");

                // 3. Create Start Menu Shortcut
                string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");
                string startMenuShortcut = Path.Combine(startMenuPath, "Modern Diagnostic LIMS.lnk");
                CreateShortcut(startMenuShortcut, exeTarget, installDir, "Modern Diagnostic LIMS");

                this.Invoke((MethodInvoker)delegate
                {
                    progressBar.Value = 100;
                    lblStatus.Text = "Installation Complete! Modern Diagnostic LIMS is ready.";
                    lblStatus.ForeColor = Color.FromArgb(16, 185, 129); // emerald-600
                    btnAction.Text = "Finish";
                    btnAction.BackColor = Color.FromArgb(16, 185, 129);
                    btnAction.Enabled = true;
                    isInstalled = true;
                });
            }
            catch (Exception ex)
            {
                this.Invoke((MethodInvoker)delegate
                {
                    lblStatus.Text = "Installation error: " + ex.Message;
                    lblStatus.ForeColor = Color.Red;
                    btnAction.Enabled = true;
                    btnAction.Text = "Retry";
                });
            }
        }

        private void CreateShortcut(string shortcutPath, string targetPath, string workingDir, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetPath;
                    shortcut.WorkingDirectory = workingDir;
                    shortcut.Description = description;
                    shortcut.Save();
                }
            }
            catch { }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }
}
