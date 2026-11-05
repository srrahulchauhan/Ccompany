import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedNumber from "../../components/AnimatedNumber";

export const currency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
export const monthlySalaryEquivalent = (employee) => employee.salaryType === "Daily"
  ? Number(employee.dailySalary || 0) * Number(employee.workingDays || 26)
  : employee.salaryType === "Hourly"
    ? Number(employee.hourlyRate || 0) * 8 * Number(employee.workingDays || 26)
    : Number(employee.monthlySalary || 0);

export function StatCard({ label, value, numberValue, formatNumber = (number) => Math.round(number).toLocaleString("en-IN"), note, tone = "purple", to, onClick, active = false }) {
  const className = `work-stat ${to || onClick ? "work-stat-clickable" : ""} ${active ? "work-stat-selected" : ""}`;
  const number = numberValue !== undefined ? numberValue : typeof value === "number" ? value : null;
  const display = number === null ? value : <AnimatedNumber value={number} format={formatNumber} />;
  const content = <><span className={`work-stat-icon work-${tone}`} /><small>{label}</small><b>{display}</b>{note && <i>{note}</i>}</>;
  if (to) return <Link className={className} to={to} aria-label={`${label}: ${value}. Open related records.`}>{content}</Link>;
  if (onClick) return <button className={className} type="button" onClick={onClick} aria-pressed={active} aria-label={`${label}: ${value}. ${active ? "Selected filter." : "Filter records."}`}>{content}</button>;
  return <div className="work-stat">{content}</div>;
}

export function CompanyPicker({ companies, value, onChange, includeAll = false, label = "Company" }) {
  return <label className="work-filter"><span>{label}</span><select className="filter-select" value={value} onChange={(event) => onChange(event.target.value)}>
    {includeAll && <option value="all">All companies</option>}
    {companies.map((company) => <option key={company.id} value={company.id}>{company.name}{company.archived ? " · Archived" : company.active ? "" : " · Inactive"}</option>)}
  </select></label>;
}

export function MonthPicker({ value, onChange, label = "Payroll month" }) {
  return <label className="work-filter"><span>{label}</span><input className="filter-select" type="month" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

export function WorkModal({ title, fields, initial = {}, onClose, onSave, submitLabel = "Save record", wide = false }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.name, initial[field.name] ?? field.defaultValue ?? (field.type === "checkbox" ? false : "")])));
  const [error, setError] = useState("");
  const setValue = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));
  const submit = (event) => {
    event.preventDefault();
    const invalid = fields.find((field) => field.required && !String(values[field.name] ?? "").trim());
    if (invalid) { setError(`${invalid.label} is required.`); return; }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) { setError("Enter a valid email address."); return; }
    if (values.joiningDate && values.leaveDate && values.leaveDate < values.joiningDate) { setError("Leave date cannot be before the joining date."); return; }
    if (values.monthlySalary !== undefined && Number(values.monthlySalary) < 0) { setError("Salary cannot be negative."); return; }
    const cleaned = { ...values };
    fields.forEach((field) => {
      if (field.type === "number" && !(field.allowEmpty && cleaned[field.name] === "")) cleaned[field.name] = cleaned[field.name] === "" ? 0 : Number(cleaned[field.name]);
      if (field.type === "checkbox") cleaned[field.name] = Boolean(cleaned[field.name]);
    });
    onSave(cleaned);
  };
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal-card work-modal ${wide ? "work-modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="work-modal-title">
      <div className="modal-head"><div><p className="eyebrow">MULTI-COMPANY WORKSPACE</p><h2 id="work-modal-title">{title}</h2></div><button className="icon-btn" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <form onSubmit={submit}><div className="form-grid">
        {fields.map((field) => <label key={field.name} className={`form-field ${field.wide || field.type === "textarea" ? "field-wide" : ""} ${field.type === "checkbox" ? "work-checkbox-field" : ""}`}>
          {field.type === "checkbox" ? <><input type="checkbox" checked={Boolean(values[field.name])} onChange={(event) => setValue(field.name, event.target.checked)} /><span>{field.label}</span></>
            : <><span>{field.label}{field.required && <i> *</i>}</span>
              {field.type === "textarea" ? <textarea className="form-input" rows={3} value={values[field.name]} onChange={(event) => setValue(field.name, event.target.value)} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} />
                : field.type === "select" ? <select className="form-input" value={values[field.name]} onChange={(event) => setValue(field.name, event.target.value)}>{(field.options || []).map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}</select>
                  : <input className="form-input" type={field.type || "text"} min={field.min} max={field.max} step={field.step} required={field.required} disabled={field.disabled} value={values[field.name]} onChange={(event) => setValue(field.name, event.target.value)} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} />}
            </>}
        </label>)}
      </div>{error && <p className="form-error">{error}</p>}
      <div className="modal-actions"><button className="btn btn-ghost" type="button" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit">{submitLabel}</button></div></form>
    </section>
  </div>;
}

export function downloadTableCsv(filename, headers, rows) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [headers, ...rows].map((row) => row.map(quote).join(",")).join("\n");
  const href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}
