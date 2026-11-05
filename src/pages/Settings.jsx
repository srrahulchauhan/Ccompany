import { useRef, useState } from "react";
import { Download, Moon, Sun, Upload, Save, RotateCcw, ShieldCheck, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { initialData } from "../data/seedData";
import { moduleOrder } from "../data/modules";
import { useStore } from "../context/StoreContext";

export default function Settings() {
  const { data, updateCompany, updatePreferences, reset, replaceAll } = useStore();
  const [company, setCompany] = useState(data.company);
  const [profile, setProfile] = useState(data.preferences.profileName);
  const importRef = useRef(null);
  const saveCompany = (event) => { event.preventDefault(); updateCompany(company); updatePreferences({ profileName: profile }); toast.success("Settings saved successfully."); };
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
      replaceAll(imported); setCompany({ ...initialData.company, ...imported.company }); setProfile(imported.preferences?.profileName || "Alex Morgan");
      toast.success("Backup imported successfully.");
    } catch (error) { toast.error(error.message || "Unable to import this backup."); }
    event.target.value = "";
  };
  const restoreDemo = () => {
    if (window.confirm("Restore the original demo data? This replaces all current records and settings.")) { reset(); setCompany(initialData.company); setProfile(initialData.preferences.profileName); toast.success("Demo data restored."); }
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
      <div className="panel settings-card"><div className="settings-section-head"><span className="settings-icon settings-icon-green"><Download size={18} /></span><div><h2>Data backup & portability</h2><p>Your data stays in this browser. Download a backup anytime.</p></div></div>
        <div className="backup-actions"><button className="backup-action" onClick={exportData}><span className="backup-action-icon"><Download size={18} /></span><span><b>Export all data</b><small>Download all records as a JSON backup.</small></span><Download size={16} /></button><button className="backup-action" onClick={() => importRef.current?.click()}><span className="backup-action-icon"><Upload size={18} /></span><span><b>Import JSON backup</b><small>Restore a previously exported Orbit backup.</small></span><Upload size={16} /></button><input ref={importRef} className="hidden-input" type="file" accept=".json,application/json" onChange={importData} /></div>
      </div>
      <div className="panel settings-card danger-card"><div className="settings-section-head"><span className="settings-icon settings-icon-red"><RotateCcw size={18} /></span><div><h2>Reset application data</h2><p>Restore the original sample records. This will replace your current data.</p></div></div><button className="btn btn-danger" onClick={restoreDemo}><RotateCcw size={16} /> Reset demo data</button></div>
    </div>
  </div>;
}
