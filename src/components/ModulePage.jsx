import { useMemo, useState } from "react";
import { Download, Eye, Pencil, Plus, Search, Trash2, X, Check, XCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { modules } from "../data/modules";
import { useStore } from "../context/StoreContext";
import { useSearchParams } from "react-router-dom";

const moneyFields = new Set(["salary", "budget", "basic", "allowances", "bonus", "deductions", "advance", "netSalary", "projectValue", "paidAmount", "pendingAmount", "amount", "purchasePrice", "sellingPrice"]);
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const displayValue = (row, key, collection, data) => {
  if (key === "employeeId" && !row[key]) return "—";
  if (key === "employeeCount") return data.employees.filter((employee) => employee.department === row.name).length;
  if (key === "leaveBalance") {
    const used = data.leaves.filter((leave) => leave.employee === row.employee && leave.status === "Approved" && leave.leaveType === "Annual").reduce((sum, leave) => sum + Number(leave.days || 0), 0);
    return `${Math.max(0, 20 - used)} days`;
  }
  if (key === "netSalary") return money(row.netSalary ?? (Number(row.basic || 0) + Number(row.allowances || 0) + Number(row.bonus || 0) - Number(row.deductions || 0) - Number(row.advance || 0)));
  if (key === "pendingAmount") return money(Number(row.projectValue || 0) - Number(row.paidAmount || 0));
  if (moneyFields.has(key)) return money(row[key]);
  if (key === "date" && collection === "leaves") return `${row.startDate || "—"} – ${row.endDate || "—"}`;
  if (key === "employee" && !row[key]) return "Unassigned";
  const value = row[key];
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
};

function RecordForm({ config, record, onClose, onSave, employees }) {
  const [form, setForm] = useState(() => ({ ...config.defaults, ...record }));
  const [error, setError] = useState("");
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    const invalid = config.fields.find((field) => field.required && !String(form[field.name] ?? "").trim());
    if (invalid) { setError(`${invalid.label} is required.`); return; }
    if (form.endDate && form.startDate && form.endDate < form.startDate) { setError("End date must be on or after the start date."); return; }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return; }
    const cleaned = { ...form };
    config.fields.forEach((field) => {
      if (field.type === "number") cleaned[field.name] = cleaned[field.name] === "" ? 0 : Number(cleaned[field.name]);
    });
    onSave(cleaned);
  };
  const inputClass = "form-input";
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="record-form-title">
      <div className="modal-head"><div><p className="eyebrow">{record?.id ? "UPDATE RECORD" : "NEW RECORD"}</p><h2 id="record-form-title">{record?.id ? `Edit ${config.singular}` : `Add ${config.singular}`}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <form onSubmit={submit}>
        <div className="form-grid">
          {config.fields.map((field) => <label key={field.name} className={`form-field ${field.type === "textarea" ? "field-wide" : ""}`}>
            <span>{field.label}{field.required && <i> *</i>}</span>
            {field.type === "textarea"
              ? <textarea className={inputClass} rows={3} value={form[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} placeholder={`Enter ${field.label.toLowerCase()}`} />
              : field.type === "select"
                ? <select className={inputClass} value={form[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)}>
                  {(field.name === "employee" ? [{ value: "", label: "Unassigned" }, ...employees.map((employee) => ({ value: employee.name, label: employee.name }))] : field.options).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                : <input className={inputClass} type={field.type || "text"} min={field.min} max={field.max} required={field.required} value={form[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} placeholder={field.type === "url" ? "https://" : `Enter ${field.label.toLowerCase()}`} />}
          </label>)}
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary">{record?.id ? "Save changes" : `Create ${config.singular}`}</button></div>
      </form>
    </section>
  </div>;
}

function RecordDetails({ record, config, collection, data, onClose, onSlip }) {
  const isEmployee = collection === "employees";
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card details-modal" role="dialog" aria-modal="true">
      <div className="modal-head"><div><p className="eyebrow">{isEmployee ? "EMPLOYEE PROFILE" : "RECORD DETAILS"}</p><h2>{record.name || record.title || record.employee || record.productId || config.singular}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      {isEmployee && <div className="employee-profile-banner"><img src={record.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.name)}&background=e8eaff&color=5147d9`} alt="" /><div><b>{record.name}</b><span>{record.designation} · {record.department}</span><span>{record.employeeId} · {record.status}</span></div></div>}
      <div className="detail-grid">{config.fields.map((field) => <div key={field.name} className="detail-item"><span>{field.label}</span><b>{displayValue(record, field.name, collection, data)}</b></div>)}
        {collection === "employees" && <><div className="detail-item"><span>Employee ID</span><b>{record.employeeId}</b></div><div className="detail-item"><span>Monthly salary</span><b>{money(record.salary)}</b></div></>}
        {collection === "payroll" && <div className="detail-item"><span>Net salary</span><b>{money(record.netSalary ?? Number(record.basic || 0) + Number(record.allowances || 0) + Number(record.bonus || 0) - Number(record.deductions || 0) - Number(record.advance || 0))}</b></div>}
      </div>
      {collection === "payroll" && <button className="btn btn-primary mt-5" onClick={onSlip}><FileText size={16} /> Preview salary slip / Print PDF</button>}
    </section>
  </div>;
}

export default function ModulePage({ collection }) {
  const config = modules[collection];
  const { data, add, update, remove } = useStore();
  const rows = data[collection] || [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [details, setDetails] = useState(null);
  const pageSize = 8;
  const filterOptions = useMemo(() => {
    const filterKey = collection === "employees" ? "department" : "status";
    return [...new Set(rows.map((item) => item[filterKey]).filter(Boolean))].sort();
  }, [rows, collection]);
  const visibleRows = useMemo(() => rows.filter((row) => {
    const matchesText = !query || (config.search || config.columns.map(([key]) => key)).some((key) => String(row[key] || "").toLowerCase().includes(query.toLowerCase()));
    const filterKey = collection === "employees" ? "department" : "status";
    return matchesText && (filter === "All" || row[filterKey] === filter);
  }), [rows, query, filter, collection, config]);
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const pageRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);
  const filterLabel = collection === "employees" ? "All departments" : "All statuses";

  const save = (record) => {
    if (collection === "employees" && rows.some((item) => item.email?.toLowerCase() === record.email?.toLowerCase() && item.id !== record.id)) {
      toast.error("An employee with this email already exists."); return;
    }
    if (modal?.id) { update(collection, modal.id, record); toast.success(`${config.singular} updated.`); }
    else { add(collection, record); toast.success(`${config.singular} added.`); }
    setModal(null);
  };
  const exportCsv = () => {
    const keys = config.columns.map(([key]) => key);
    const csv = [keys.map((key) => `"${(config.columns.find(([column]) => column === key)?.[1] || key).replaceAll('"', '""')}"`).join(","), ...visibleRows.map((row) => keys.map((key) => `"${String(displayValue(row, key, collection, data)).replaceAll('"', '""')}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `${collection}-report.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  const approve = (row, status) => { update(collection, row.id, { status }); toast.success(`${config.singular} ${status.toLowerCase()}.`); };

  return <div className="page-wrap">
    <div className="page-heading"><div><p className="eyebrow">COMPANY WORKSPACE</p><h1>{config.title}</h1><p className="page-subtitle">{config.subtitle}</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={exportCsv}><Download size={16} /> Export</button><button className="btn btn-primary" onClick={() => setModal({})}><Plus size={17} /> Add {config.singular}</button></div></div>
    <section className="panel data-panel">
      <div className="table-toolbar"><div><h2>All {config.title.toLowerCase()}</h2><p>{visibleRows.length} records in your workspace</p></div><div className="toolbar-filters">
        <label className="table-search"><Search size={16} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setSearchParams(event.target.value ? { q: event.target.value } : {}); }} placeholder={`Search ${config.title.toLowerCase()}...`} /></label>
        {filterOptions.length > 0 && <select className="filter-select" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} aria-label={filterLabel}><option>All</option>{filterOptions.map((option) => <option key={option}>{option}</option>)}</select>}
      </div></div>
      <div className="table-scroll"><table><thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}<th className="actions-heading">Actions</th></tr></thead>
        <tbody>{pageRows.map((row) => <tr key={row.id}>
          {config.columns.map(([key, label]) => <td key={key}>
            {key === "name" && collection === "employees" ? <div className="person-cell"><img src={row.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=e8eaff&color=5147d9`} alt="" /><span><b>{row.name}</b><small>{row.employeeId}</small></span></div>
              : key === "status" || key === "priority" || key === "type" ? <span className={`status-pill status-${String(row[key] || "").toLowerCase().replaceAll(" ", "-")}`}>{displayValue(row, key, collection, data)}</span>
                : <span className={label === "Amount" || label === "Net salary" ? "amount-cell" : ""}>{displayValue(row, key, collection, data)}</span>}
          </td>)}
          <td><div className="row-actions">
            <button title="View details" onClick={() => setDetails(row)}><Eye size={16} /></button>
            {collection === "leaves" && row.status === "Pending" && <><button title="Approve" className="action-positive" onClick={() => approve(row, "Approved")}><Check size={16} /></button><button title="Reject" className="action-negative" onClick={() => approve(row, "Rejected")}><XCircle size={16} /></button></>}
            <button title="Edit" onClick={() => setModal(row)}><Pencil size={15} /></button>
            <button title="Delete" className="action-delete" onClick={() => { if (window.confirm(`Delete this ${config.singular}? This action cannot be undone.`)) { remove(collection, row.id); toast.success(`${config.singular} deleted.`); } }}><Trash2 size={15} /></button>
          </div></td>
        </tr>)}
        {pageRows.length === 0 && <tr><td colSpan={config.columns.length + 1}><div className="empty-state"><div className="empty-icon"><Search size={22} /></div><b>No records found</b><p>Try changing your search or add a new {config.singular}.</p><button className="btn btn-primary btn-small" onClick={() => setModal({})}><Plus size={15} /> Add {config.singular}</button></div></td></tr>}
        </tbody></table></div>
      <div className="table-footer"><span>Showing {visibleRows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, visibleRows.length)} of {visibleRows.length}</span><div className="pagination"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>
    </section>
    {modal && <RecordForm config={config} record={modal.id ? modal : null} employees={data.employees} onClose={() => setModal(null)} onSave={save} />}
    {details && <RecordDetails record={details} config={config} collection={collection} data={data} onClose={() => setDetails(null)} onSlip={() => { const slip = document.getElementById("salary-slip"); if (slip) window.print(); }} />}
    {details && collection === "payroll" && <div id="salary-slip" className="print-only"><h1>{data.company.name}</h1><h2>Salary slip · {details.month}</h2><p>Employee: {details.employee}</p><p>Basic salary: {money(details.basic)}</p><p>Allowances: {money(details.allowances)}</p><p>Bonus: {money(details.bonus)}</p><p>Deductions: −{money(details.deductions)}</p><p>Advance: −{money(details.advance)}</p><hr /><h2>Net salary: {money(details.netSalary ?? Number(details.basic || 0) + Number(details.allowances || 0) + Number(details.bonus || 0) - Number(details.deductions || 0) - Number(details.advance || 0))}</h2><p>Payment status: {details.status}</p></div>}
  </div>;
}
