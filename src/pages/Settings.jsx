import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Moon, Sun, Upload, Save, ShieldCheck, Building2, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { createEmptyData } from "../data/seedData";
import { moduleOrder } from "../data/modules";
import { useStore } from "../context/StoreContext";
import { downloadManagementWorkbook } from "../utils/exportWorkbook";

export default function Settings() {
  const { data, updateCompany, updatePreferences, cleanAll, replaceAll } = useStore();
  const [company, setCompany] = useState(data.company);
  const [profile, setProfile] = useState(data.preferences.profileName);
  const importRef = useRef(null);
  const saveCompany = (event) => { event.preventDefault(); updateCompany(company); updatePreferences({ profileName: profile }); toast.success("Settings saved successfully."); };
  const exportWorkbook = async (openSheets = false) => {
    const sheetsTab = openSheets ? window.open("https://sheets.google.com/create", "_blank", "noopener,noreferrer") : null;
    try {
      await downloadManagementWorkbook(data);
      toast.success(openSheets
        ? "Workbook downloaded. In Google Sheets, choose File → Import → Upload to import all organized tabs."
        : "Organized Excel workbook downloaded successfully.");
    } catch (error) {
      sheetsTab?.close();
      console.error("Could not export the company workbook.", error);
      toast.error("Unable to export the workbook. Please try again.");
    }
  };
  const exportData = () => {
    const file = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(file); const link = document.createElement("a"); link.href = href; link.download = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(href);
    toast.success("Your data backup has been downloaded.");
  };
  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || typeof imported !== "object" || moduleOrder.some((collection) => !Array.isArray(imported[collection]))) throw new Error("This file is not a valid Orbit data backup. Exported backups include all company modules.");
      const emptyData = createEmptyData();
      replaceAll(imported); setCompany({ ...emptyData.company, ...imported.company }); setProfile(imported.preferences?.profileName || "Administrator");
      toast.success("Backup imported successfully.");
    } catch (error) { toast.error(error.message || "Unable to import this backup."); }
    event.target.value = "";
  };
  const cleanAllData = () => {
    if (!window.confirm("Permanently clean all saved company, employee, attendance, salary, payment, and settings data from this browser? The app will reopen with empty records. This cannot be undone. Export a backup first if you may need this data.")) return;
    try {
      cleanAll();
      setCompany({ name: "", logo: "", email: "", phone: "", address: "" });
      setProfile("Administrator");
      toast.success("All saved data has been cleaned. You can now enter fresh company data.");
    } catch (error) {
      console.error("Could not clean saved company data.", error);
      toast.error("Unable to clean saved data. Please try again.");
    }
  };
  const changePassword = () => {
    const nextPassword = window.prompt("Demo-only password change. Enter a new password (minimum 6 characters):");
    if (nextPassword === null) return;
    if (nextPassword.trim().length < 6) { toast.error("Password must contain at least 6 characters."); return; }
    toast.success("Demo password updated for this session.");
  };
  return <div className="page-wrap">
    <div className="page-heading"><div><p className="eyebrow">PERSONALIZE YOUR WORKSPACE</p><h1>Settings</h1><p className="page-subtitle">Manage company details, preferences, and your data.</p></div></div>
    <div className="settings-layout">
      <form className="panel settings-card" onSubmit={saveCompany}><div className="settings-section-head"><span className="settings-icon"><Building2 size={18} /></span><div><h2>Company profile</h2><p>These details appear across your workspace.</p></div></div>
        <div className="form-grid settings-form-grid">
          {[["name", "Company name"], ["logo", "Company logo URL"], ["email", "Company email"], ["phone", "Contact number"], ["address", "Company address"]].map(([key, label]) => <label key={key} className={`form-field ${key === "address" ? "field-wide" : ""}`}><span>{label}</span>{key === "address" ? <textarea className="form-input" rows={3} value={company[key] || ""} onChange={(event) => setCompany({ ...company, [key]: event.target.value })} /> : <input className="form-input" type={key === "email" ? "email" : key === "logo" ? "url" : "text"} value={company[key] || ""} onChange={(event) => setCompany({ ...company, [key]: event.target.value })} />}</label>)}
          <label className="form-field"><span>Currency</span><select className="form-input" value="INR ₹" disabled><option>INR ₹</option></select></label>
          <label className="form-field"><span>Administrator name</span><input className="form-input" value={profile} onChange={(event) => setProfile(event.target.value)} required /></label>
        </div><div className="settings-card-footer"><span>Changes are stored securely in this browser.</span><button className="btn btn-primary" type="submit"><Save size={16} /> Save changes</button></div>
      </form>
      <div className="panel settings-card"><div className="settings-section-head"><span className="settings-icon settings-icon-violet"><Sun size={18} /></span><div><h2>Application preferences</h2><p>Set up Orbit to work the way you do.</p></div></div>
        <div className="preference-row"><div><b>Appearance</b><small>Choose a comfortable theme for your workspace.</small></div><div className="theme-switch"><button className={data.preferences.theme === "light" ? "selected" : ""} onClick={() => updatePreferences({ theme: "light" })}><Sun size={15} /> Light</button><button className={data.preferences.theme === "dark" ? "selected" : ""} onClick={() => updatePreferences({ theme: "dark" })}><Moon size={15} /> Dark</button></div></div>
        <div className="preference-row"><div><b>Notifications</b><small>Show helpful reminders and company alerts.</small></div><button className={`toggle ${data.preferences.notifications !== false ? "toggle-on" : ""}`} aria-label="Toggle notifications" onClick={() => updatePreferences({ notifications: data.preferences.notifications === false })}><i /></button></div>
        <div className="preference-row"><div><b>Change password</b><small>Demo only · no authentication service is connected.</small></div><button className="btn btn-secondary btn-small" onClick={changePassword}><ShieldCheck size={15} /> Change</button></div>
      </div>
      <div className="panel settings-card"><div className="settings-section-head"><span className="settings-icon settings-icon-green"><Download size={18} /></span><div><h2>Data backup & portability</h2><p>Export organized company data for Excel or import the same workbook into Google Sheets.</p></div></div>
        <div className="backup-actions">
          <button className="backup-action" onClick={() => exportWorkbook()}><span className="backup-action-icon"><FileSpreadsheet size={18} /></span><span><b>Export Excel workbook</b><small>Separate tabs, filters, attendance, and monthly salary summaries.</small></span><Download size={16} /></button>
          <button className="backup-action" onClick={() => exportWorkbook(true)}><span className="backup-action-icon"><ExternalLink size={18} /></span><span><b>Google Sheets import</b><small>Download the workbook and open Sheets to import all tabs.</small></span><ExternalLink size={16} /></button>
          <button className="backup-action" onClick={exportData}><span className="backup-action-icon"><Download size={18} /></span><span><b>Export JSON backup</b><small>Download a full backup to restore in this app.</small></span><Download size={16} /></button>
          <button className="backup-action" onClick={() => importRef.current?.click()}><span className="backup-action-icon"><Upload size={18} /></span><span><b>Import JSON backup</b><small>Restore a previously exported Orbit backup.</small></span><Upload size={16} /></button>
          <input ref={importRef} className="hidden-input" type="file" accept=".json,application/json" onChange={importData} />
        </div>
      </div>
      <div className="panel settings-card danger-card"><div className="settings-section-head"><span className="settings-icon settings-icon-red"><Trash2 size={18} /></span><div><h2>Clean application data</h2><p>Permanently remove all saved records and leave the workspace empty.</p></div></div><div className="data-clean-actions"><button className="btn btn-danger btn-clean-data" onClick={cleanAllData}><Trash2 size={16} /> Clean all data</button></div></div>
    </div>
  </div>;
}
