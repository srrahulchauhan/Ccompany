import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Search, X } from "lucide-react";

export const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const formatCurrency = (value, currency = "INR") => {
  try { return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return rupees(value); }
};
export const today = () => new Date().toISOString().slice(0, 10);
export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="pa-page-heading"><div><p className="pa-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{action && <div className="pa-heading-actions">{action}</div>}</div>;
}

export function Button({ children, variant = "primary", icon: Icon, className = "", ...props }) {
  return <button className={`pa-btn pa-btn-${variant} ${className}`} {...props}>{Icon && <Icon size={16} />}{children}</button>;
}

export function StatCard({ label, value, caption, icon: Icon, tone = "yellow", change, onClick }) {
  const Content = <><span className={`pa-stat-icon pa-tone-${tone}`}><Icon size={18} /></span><span className="pa-stat-copy"><small>{label}</small><b>{value}</b><em>{caption}</em></span>{change && <span className="pa-stat-change">{change}</span>}</>;
  return onClick ? <button className="pa-stat-card pa-stat-clickable" onClick={onClick}>{Content}</button> : <div className="pa-stat-card">{Content}</div>;
}

export function EmptyState({ icon: Icon = Search, title, description, action }) {
  return <div className="pa-empty"><span><Icon size={22} /></span><b>{title}</b><p>{description}</p>{action}</div>;
}

export function SearchBox({ value, onChange, placeholder = "Search records..." }) {
  return <label className="pa-search"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function RecordModal({ title, description, fields, initial = {}, submitLabel = "Save record", onClose, onSubmit }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.name, initial[field.name] ?? field.defaultValue ?? (field.type === "date" ? today() : "")])));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key, value) => setValues((previous) => ({ ...previous, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const required = fields.find((field) => field.required && !String(values[field.name] ?? "").trim());
    if (required) { setError(`${required.label} is required.`); return; }
    const email = values.email;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    for (const field of fields) {
      if (field.type === "number" && values[field.name] !== "" && Number(values[field.name]) < Number(field.min ?? 0)) {
        setError(`${field.label} must be ${field.min ? `at least ${field.min}` : "zero or more"}.`);
        return;
      }
    }
    setSaving(true);
    try {
      await onSubmit(Object.fromEntries(fields.map((field) => [
        field.name,
        field.type === "number" ? Number(values[field.name] || 0) : values[field.name],
      ])));
      onClose();
    } catch (submitError) {
      setError(submitError.message || "Unable to save this record.");
      setSaving(false);
    }
  };
  return <div className="pa-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="pa-modal" role="dialog" aria-modal="true" aria-labelledby="pa-modal-title">
      <header className="pa-modal-head"><div><p className="pa-eyebrow">PERSONAL ACCOUNTS</p><h2 id="pa-modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="pa-icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></header>
      <form onSubmit={submit}><div className="pa-form-grid">
        {fields.map((field) => <label key={field.name} className={`pa-field ${field.wide ? "pa-field-wide" : ""}`}>
          <span>{field.label}{field.required && <i> *</i>}</span>
          {field.type === "textarea"
            ? <textarea rows={3} value={values[field.name] ?? ""} placeholder={field.placeholder || ""} onChange={(event) => update(field.name, event.target.value)} />
            : field.type === "select"
              ? <select value={values[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)}>{(field.options || []).map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}</select>
              : <input type={field.type || "text"} min={field.min} max={field.max} step={field.step || (field.type === "number" ? "0.01" : undefined)} value={values[field.name] ?? ""} placeholder={field.placeholder || ""} onChange={(event) => update(field.name, event.target.value)} />}
        </label>)}
      </div>
      {error && <p className="pa-form-error" role="alert">{error}</p>}
      <footer className="pa-modal-actions"><Button type="button" variant="plain" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : submitLabel}</Button></footer>
      </form>
    </section>
  </div>;
}

export function Table({ columns, rows, empty, renderRow }) {
  return <div className="pa-table-scroll"><table className="pa-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>
    {rows.length ? rows.map((row) => renderRow(row)) : <tr><td colSpan={columns.length}>{empty}</td></tr>}
  </tbody></table></div>;
}

export function exportCsv(filename, headers, rows) {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const contents = `\uFEFF${[headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const signedAmount = (value, positive) => positive
  ? <span className="pa-positive"><ArrowDownLeft size={14} />{rupees(value)}</span>
  : <span className="pa-negative"><ArrowUpRight size={14} />{rupees(value)}</span>;
