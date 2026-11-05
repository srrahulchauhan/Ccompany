import { useState } from "react";
import { Building2, Pencil, Plus, Power, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useStore } from "../../context/StoreContext";
import { dateKey } from "../../utils/date";
import { currency, monthlySalaryEquivalent, StatCard, WorkModal } from "./WorkUI";

const fields = [
  { name: "name", label: "Company name", required: true },
  { name: "logo", label: "Company logo URL", type: "url" },
  { name: "address", label: "Company address", type: "textarea", wide: true },
  { name: "phone", label: "Contact number", type: "tel" },
  { name: "email", label: "Company email", type: "email" },
  { name: "joiningDate", label: "Company joining date", type: "date" },
  { name: "leaveDate", label: "Company closure / leave date", type: "date" },
  { name: "workType", label: "Work type", type: "select", options: ["Office", "Hybrid", "Remote", "Field work"] },
  { name: "salaryType", label: "Default salary type", type: "select", options: ["Monthly", "Daily", "Hourly"] },
  { name: "monthlySalary", label: "Default monthly salary (₹)", type: "number", min: 0 },
  { name: "paymentDay", label: "Usual payment day of month", type: "number", min: 1, max: 31 },
  { name: "salaryCalculationMethod", label: "Monthly salary calculation", type: "select", options: [{ value: "calendar-days", label: "Calendar days in month" }, { value: "working-days", label: "Configured working days" }] },
  { name: "notes", label: "Notes", type: "textarea", wide: true },
];

export default function Companies() {
  const { data, add, update, setWorkPreferences } = useStore();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [companyView, setCompanyView] = useState("all");
  const companies = data.workCompanies;
  const displayedCompanies = companies.filter((company) => companyView === "all"
    || (companyView === "active" ? company.active && !company.archived
      : companyView === "inactive" ? !company.active && !company.archived
        : Boolean(company.archived)));
  const changeActive = (company) => {
    const active = !company.active;
    update("workCompanies", company.id, { active, leaveDate: active ? "" : company.leaveDate || dateKey() });
    toast.success(`${company.name} ${active ? "activated" : "deactivated"}.`);
  };
  const archive = (company) => {
    if (company.archived) {
      update("workCompanies", company.id, { active: true, archived: false });
      toast.success(`${company.name} restored.`);
      return;
    }
    const employeeCount = data.workEmployees.filter((employee) => employee.companyId === company.id).length;
    if (!window.confirm(`Archive ${company.name}? Its ${employeeCount} employment records, attendance, and salary history will be preserved.`)) return;
    update("workCompanies", company.id, { active: false, archived: true, leaveDate: company.leaveDate || dateKey() });
    toast.success(`${company.name} archived. Historical records are preserved.`);
  };
  const save = (values) => {
    if (modal?.id) {
      const active = values.leaveDate ? false : modal.active;
      update("workCompanies", modal.id, { ...values, active });
      toast.success("Company updated.");
    }
    else {
      const added = add("workCompanies", { ...values, active: !values.leaveDate });
      if (data.workPreferences.selectedCompanyId === "all" || !data.workPreferences.selectedCompanyId) setWorkPreferences({ selectedCompanyId: added.id });
      toast.success("Company added.");
    }
    setModal(null);
  };
  return <div className="page-wrap work-page">
    <div className="page-heading"><div><p className="eyebrow">COMPANY DIRECTORY</p><h1>Company management</h1><p className="page-subtitle">Add and manage multiple companies. Archiving preserves every linked employment, attendance, and payment record.</p></div><div className="heading-actions"><button className="btn btn-primary" onClick={() => setModal({})}><Plus size={16} /> Add company</button></div></div>
    <div className="work-stats-grid work-stats-four"><StatCard label="Total companies" value={companies.length} note="Show all company records" tone="purple" onClick={() => setCompanyView("all")} active={companyView === "all"} /><StatCard label="Active companies" value={companies.filter((company) => company.active && !company.archived).length} note="Filter active companies" tone="green" onClick={() => setCompanyView("active")} active={companyView === "active"} /><StatCard label="Inactive companies" value={companies.filter((company) => !company.active && !company.archived).length} note="Filter inactive companies" tone="amber" onClick={() => setCompanyView("inactive")} active={companyView === "inactive"} /><StatCard label="Employment records" value={data.workEmployees.length} note="Open employee records" tone="blue" to="/work-employees" /></div>
    <div className="company-directory">{displayedCompanies.map((company) => {
      const employees = data.workEmployees.filter((employee) => employee.companyId === company.id);
      const activeEmployees = employees.filter((employee) => employee.status === "Active").length;
      const totalMonthly = employees.filter((employee) => employee.status === "Active").reduce((sum, employee) => sum + monthlySalaryEquivalent(employee), 0);
      return <article key={company.id} className={`company-directory-card company-directory-clickable ${!company.active ? "company-inactive" : ""}`} role="link" tabIndex={0} aria-label={`Open ${company.name} payroll`} onClick={() => navigate(`/company-salary?company=${company.id}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/company-salary?company=${company.id}`); } }}>
        <div className="company-directory-top"><span className="company-logo-large">{company.logo ? <img src={company.logo} alt="" /> : <Building2 size={22} />}</span><span className={`company-active-pill ${company.active && !company.archived ? "is-active" : ""}`}>{company.archived ? "Archived" : company.active ? "Active" : "Inactive"}</span><div className="company-card-actions">{!company.archived && <><button title="Edit company" onClick={(event) => { event.stopPropagation(); setModal(company); }}><Pencil size={15} /></button><button title={company.active ? "Deactivate company" : "Activate company"} onClick={(event) => { event.stopPropagation(); changeActive(company); }}><Power size={15} /></button></>}<button title={company.archived ? "Restore company" : "Archive company"} onClick={(event) => { event.stopPropagation(); archive(company); }}>{company.archived ? <RotateCcw size={15} /> : <Trash2 size={15} />}</button></div></div>
        <h2>{company.name}</h2><p className="company-address">{company.address || "No address added"}</p><div className="company-contact"><span>{company.email || "No email"}</span><span>{company.phone || "No phone"}</span></div>
        <div className="company-directory-metrics"><div><small>Employees</small><b>{activeEmployees} active <span>· {employees.length} total</span></b></div><div><small>Monthly payroll</small><b>{currency(totalMonthly)}</b></div><div><small>Company joining date</small><b>{company.joiningDate || "—"}</b></div><div><small>Company leave / closure date</small><b>{company.leaveDate || "—"}</b></div></div>
        <button className="company-select-button" disabled={!company.active || company.archived} onClick={(event) => { event.stopPropagation(); setWorkPreferences({ selectedCompanyId: company.id }); toast.success(`${company.name} selected.`); }}>{company.archived ? "Restore company to switch" : company.active ? "Switch to this company" : "Activate company to switch"}</button>
      </article>;
    })}{companies.length === 0 && <div className="panel work-empty"><Building2 size={24} /><b>No companies configured</b><p>Create your first company to begin.</p></div>}</div>
    {modal && <WorkModal title={modal.id ? "Edit company" : "Add a company"} fields={fields} initial={modal.id ? modal : { joiningDate: dateKey(), leaveDate: "", workType: "Office", salaryType: "Monthly", monthlySalary: 0, paymentDay: 1, salaryCalculationMethod: "calendar-days" }} onClose={() => setModal(null)} onSave={save} submitLabel={modal.id ? "Save company" : "Create company"} wide />}
  </div>;
}
