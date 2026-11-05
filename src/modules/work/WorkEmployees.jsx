import { useMemo, useState } from "react";
import { ArrowRightLeft, History, Pencil, Plus, Search, ShieldCheck, Unlock, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";
import { useStore } from "../../context/StoreContext";
import { dateKey } from "../../utils/date";
import { currency, CompanyPicker, StatCard, WorkModal } from "./WorkUI";

const employeeFields = [
  { name: "companyId", label: "Company", type: "select", required: true },
  { name: "name", label: "Employee name", required: true },
  { name: "mobile", label: "Mobile number", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "department", label: "Department" },
  { name: "designation", label: "Designation" },
  { name: "joiningDate", label: "Joining date", type: "date", required: true },
  { name: "salaryType", label: "Salary type", type: "select", options: ["Monthly", "Daily", "Hourly"] },
  { name: "monthlySalary", label: "Monthly salary (₹)", type: "number", min: 0 },
  { name: "dailySalary", label: "Daily salary (₹)", type: "number", min: 0 },
  { name: "hourlyRate", label: "Hourly rate (₹)", type: "number", min: 0 },
  { name: "workingDays", label: "Configured working days / month", type: "number", min: 1, max: 31 },
  { name: "paidLeaveEligible", label: "Paid leave is salary eligible", type: "checkbox", defaultValue: true },
];

export default function WorkEmployees() {
  const { data, add, update, switchEmployment, closeEmployment, toggleEmploymentLock, setWorkPreferences } = useStore();
  const [companyId, setCompanyId] = useState(data.workPreferences.selectedCompanyId || "all");
  const [query, setQuery] = useState("");
  const [employeeView, setEmployeeView] = useState("all");
  const [modal, setModal] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const activeCompanies = data.workCompanies.filter((company) => company.active && !company.archived);
  const visible = useMemo(() => data.workEmployees.filter((employee) =>
    (companyId === "all" || employee.companyId === companyId)
    && (employeeView === "all" || (employeeView === "active" ? employee.status === "Active" : employee.historyLocked && !employee.historyUnlocked))
    && (!query || [employee.name, employee.employeeId, employee.email, employee.mobile, employee.designation].some((value) => String(value || "").toLowerCase().includes(query.toLowerCase()))),
  ), [data.workEmployees, companyId, query, employeeView]);
  const switchFields = [
    { name: "companyId", label: "New company", type: "select", required: true, options: activeCompanies.filter((company) => company.id !== modal?.companyId).map((company) => ({ value: company.id, label: company.name })) },
    { name: "endDate", label: "Last working date at current company", type: "date", required: true },
    { name: "joiningDate", label: "Joining date at new company", type: "date", required: true },
    { name: "department", label: "Department" }, { name: "designation", label: "Designation" },
    { name: "salaryType", label: "Salary type", type: "select", options: ["Monthly", "Daily", "Hourly"] },
    { name: "monthlySalary", label: "Monthly salary (₹)", type: "number", min: 0 },
    { name: "dailySalary", label: "Daily salary (₹)", type: "number", min: 0 },
    { name: "hourlyRate", label: "Hourly rate (₹)", type: "number", min: 0 },
    { name: "workingDays", label: "Configured working days / month", type: "number", min: 1, max: 31 },
  ];

  const save = (values) => {
    try {
      if (modal?.id) { update("workEmployees", modal.id, values); toast.success("Employment record updated."); }
      else { add("workEmployees", { ...values, status: "Active" }); toast.success("Employee linked to company."); }
      setModal(null);
    } catch (error) { toast.error(error.message || "Unable to save employment record."); }
  };
  const saveSwitch = (values) => {
    try {
      switchEmployment(modal.id, values, values.endDate);
      setWorkPreferences({ selectedCompanyId: values.companyId });
      toast.success("Employment switched. Previous attendance is locked and final salary is preserved.");
      setModal(null);
    } catch (error) { toast.error(error.message || "Unable to switch employment."); }
  };
  const endEmployment = (employee) => {
    const endDate = window.prompt(`Last working date for ${employee.name} (YYYY-MM-DD):`, dateKey());
    if (!endDate) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(new Date(`${endDate}T12:00:00`).getTime())) { toast.error("Enter a valid date in YYYY-MM-DD format."); return; }
    if (endDate < employee.joiningDate) { toast.error("Last working date cannot be before the joining date."); return; }
    if (!window.confirm(`End ${employee.name}’s employment? Attendance will be locked and their final salary balance saved.`)) return;
    try { closeEmployment(employee.id, endDate); toast.success("Employment closed. Historical records are preserved and locked."); }
    catch (error) { toast.error(error.message || "Unable to end employment."); }
  };
  const openNew = () => {
    if (!activeCompanies.length) { toast.error("Add or activate a company before adding employees."); return; }
    const selected = companyId !== "all" && activeCompanies.some((company) => company.id === companyId) ? companyId : activeCompanies[0].id;
    setModal({ mode: "edit", companyId: selected, joiningDate: dateKey(), salaryType: data.workCompanies.find((company) => company.id === selected)?.salaryType || "Monthly", monthlySalary: 0, dailySalary: 0, hourlyRate: 0, workingDays: 26, paidLeaveEligible: true });
  };
  const addFields = [{ name: "companyId", label: "Company", type: "select", required: true, options: activeCompanies.map((company) => ({ value: company.id, label: company.name })) }, ...employeeFields.filter((field) => field.name !== "companyId")];
  return <div className="page-wrap work-page">
    <div className="page-heading"><div><p className="eyebrow">EMPLOYMENT RECORDS</p><h1>Company employees</h1><p className="page-subtitle">Employees are linked to individual company employments. A person can hold multiple employment records.</p></div><div className="heading-actions"><button className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add employee</button></div></div>
    <div className="work-stats-grid work-stats-three"><StatCard label="Employment records" value={data.workEmployees.length} note="Show all employment history" tone="purple" onClick={() => setEmployeeView("all")} active={employeeView === "all"} /><StatCard label="Active employments" value={data.workEmployees.filter((employee) => employee.status === "Active").length} note="Filter current employees" tone="green" onClick={() => setEmployeeView("active")} active={employeeView === "active"} /><StatCard label="Locked history" value={data.workEmployees.filter((employee) => employee.historyLocked && !employee.historyUnlocked).length} note="Filter locked history" tone="amber" onClick={() => setEmployeeView("locked")} active={employeeView === "locked"} /></div>
    <section className="panel work-table-panel"><div className="work-table-toolbar"><div><h2>Employee employment records</h2><p>{visible.length} records · company-specific salary and attendance</p></div><div className="work-toolbar-controls"><CompanyPicker companies={data.workCompanies} value={companyId} includeAll onChange={(value) => { setCompanyId(value); setWorkPreferences({ selectedCompanyId: value }); }} /><label className="table-search"><Search size={15} /><input placeholder="Search employees..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div></div>
      <div className="table-scroll"><table><thead><tr><th>Employee</th><th>Company</th><th>Department / role</th><th>Joining / leave dates</th><th>Salary basis</th><th>Status</th><th>History</th><th>Actions</th></tr></thead><tbody>
        {visible.map((employee) => {
          const company = data.workCompanies.find((item) => item.id === employee.companyId);
          const locked = employee.historyLocked && !employee.historyUnlocked;
          return <tr key={employee.id}><td><div className="work-person-cell"><span className="work-person-avatar">{employee.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span><span><b>{employee.name}</b><small>{employee.employeeId} · {employee.mobile || employee.email}</small></span></div></td><td>{company?.name || "Archived company"}</td><td>{employee.department || "—"}<small className="work-cell-subtitle">{employee.designation}</small></td><td><span className="employment-dates"><span><small>Joined</small>{employee.joiningDate || "—"}</span><span><small>Left</small>{employee.leaveDate || employee.endDate || "—"}</span></span></td><td><b>{employee.salaryType}</b><small className="work-cell-subtitle">{currency(employee.salaryType === "Daily" ? employee.dailySalary : employee.salaryType === "Hourly" ? employee.hourlyRate : employee.monthlySalary)}{employee.salaryType === "Daily" ? " / day" : employee.salaryType === "Hourly" ? " / hour" : " / month"}</small></td><td><span className={`status-pill status-${employee.status.toLowerCase()}`}>{employee.status}</span></td><td>{employee.historyLocked ? <span className={`lock-pill ${locked ? "locked" : "unlocked"}`}><ShieldCheck size={12} />{locked ? "Locked" : "Unlocked"}</span> : <span className="work-muted">Current</span>}</td><td><div className="row-actions work-row-actions"><button title="Employment and attendance history" onClick={() => setHistoryRecord(employee)}><History size={15} /></button>{employee.status === "Active" && <button title="Edit employment" onClick={() => setModal({ ...employee, mode: "edit" })}><Pencil size={15} /></button>}{employee.status === "Active" && <button title="Switch company" onClick={() => setModal({ ...employee, mode: "switch" })}><ArrowRightLeft size={15} /></button>}{employee.status === "Active" && <button title="End employment" className="action-delete" onClick={() => endEmployment(employee)}><X size={15} /></button>}{employee.historyLocked && <button title={locked ? "Unlock history" : "Lock history"} className={locked ? "" : "action-positive"} onClick={() => { toggleEmploymentLock(employee.id); toast.success(locked ? "Historical attendance unlocked for corrections." : "Historical attendance locked."); }}>{locked ? <Unlock size={15} /> : <ShieldCheck size={15} />}</button>}</div></td></tr>;
        })}
        {visible.length === 0 && <tr><td colSpan="8"><div className="empty-state"><div className="empty-icon"><UserRound size={22} /></div><b>No employment records found</b><p>Add an employee or change the company filter.</p><button className="btn btn-primary btn-small" onClick={openNew}><Plus size={14} /> Add employee</button></div></td></tr>}
      </tbody></table></div>
    </section>
    {modal && modal.mode === "switch" && <WorkModal title={`Switch ${modal.name} to another company`} fields={switchFields} initial={{ ...modal, joiningDate: dateKey() }} onClose={() => setModal(null)} onSave={saveSwitch} submitLabel="Close old & start new" wide />}
    {modal && modal.mode !== "switch" && <WorkModal title={modal.id ? `Edit ${modal.name}` : "Add employee to company"} fields={modal.id ? employeeFields.filter((field) => field.name !== "companyId") : addFields} initial={modal} onClose={() => setModal(null)} onSave={save} submitLabel={modal.id ? "Save employment" : "Create employment"} wide />}
    {historyRecord && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryRecord(null); }}><section className="modal-card details-modal work-history-modal"><div className="modal-head"><div><p className="eyebrow">EMPLOYMENT HISTORY</p><h2>{historyRecord.name}</h2></div><button className="icon-btn" onClick={() => setHistoryRecord(null)}><X size={20} /></button></div><div className="employment-history-summary"><span><small>Company</small><b>{data.workCompanies.find((company) => company.id === historyRecord.companyId)?.name}</b></span><span><small>Company joining date</small><b>{data.workCompanies.find((company) => company.id === historyRecord.companyId)?.joiningDate || "—"}</b></span><span><small>Employee joining date</small><b>{historyRecord.joiningDate || "—"}</b></span><span><small>Employee leave date</small><b>{historyRecord.leaveDate || historyRecord.endDate || "—"}</b></span><span><small>History status</small><b>{historyRecord.historyLocked && !historyRecord.historyUnlocked ? "Locked against changes" : "Editable"}</b></span></div><h3>Attendance history</h3><div className="table-scroll"><table><thead><tr><th>Date</th><th>Status</th><th>Hours</th><th>Overtime</th></tr></thead><tbody>{data.workAttendance.filter((record) => record.employmentId === historyRecord.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30).map((record) => <tr key={record.id}><td>{record.date}</td><td>{record.status}</td><td>{record.hours || 0}</td><td>{record.overtimeHours || 0}</td></tr>)}{!data.workAttendance.some((record) => record.employmentId === historyRecord.id) && <tr><td colSpan="4">No attendance records.</td></tr>}</tbody></table></div>{historyRecord.finalSettlement && <div className="settlement-callout"><b>Final salary snapshot · {historyRecord.finalSettlement.month}</b><span>Earned {currency(historyRecord.finalSettlement.earnedSalary)} · Received {currency(historyRecord.finalSettlement.received)} · Remaining {currency(historyRecord.finalSettlement.remaining)}</span></div>}</section></div>}
  </div>;
}
