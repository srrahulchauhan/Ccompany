import { Link } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CircleDollarSign, Plus, WalletCards } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { calculateWorkSalary } from "../../utils/workPayroll";
import { monthKey } from "../../utils/date";
import { CompanyPicker, currency, MonthPicker, monthlySalaryEquivalent, StatCard } from "./WorkUI";
import AnimatedNumber from "../../components/AnimatedNumber";

export default function WorkDashboard() {
  const { data, setWorkPreferences } = useStore();
  const month = data.workPreferences.selectedMonth || monthKey();
  const activeCompanies = data.workCompanies.filter((company) => company.active && !company.archived);
  const preferredCompanyId = data.workPreferences.selectedCompanyId;
  const companyId = activeCompanies.some((company) => company.id === preferredCompanyId)
    ? preferredCompanyId
    : activeCompanies[0]?.id || "all";
  const companies = companyId === "all" ? activeCompanies : activeCompanies.filter((company) => company.id === companyId);
  const companyIds = new Set(companies.map((company) => company.id));
  const employmentRecords = data.workEmployees.filter((employee) => companyIds.has(employee.companyId));
  const activeEmployees = employmentRecords.filter((employee) => employee.status === "Active");
  const payrollRows = employmentRecords.filter((employee) => employee.status === "Active" || employee.finalSettlement?.month === month)
    .map((employee) => ({ employee, salary: calculateWorkSalary(data, employee, month) }));
  const earned = payrollRows.reduce((sum, row) => sum + row.salary.earnedSalary, 0);
  const received = payrollRows.reduce((sum, row) => sum + row.salary.received, 0);
  const pending = payrollRows.reduce((sum, row) => sum + row.salary.remaining, 0);
  const advances = payrollRows.reduce((sum, row) => sum + row.salary.advances, 0);
  const presentDays = data.workAttendance.filter((record) => companyIds.has(record.companyId) && record.date.slice(0, 7) === month && ["Present", "Overtime"].includes(record.status)).length;
  const cards = [
    { label: "Total companies", value: companies.length, note: `${companies.length} active in this view`, tone: "purple", to: "/companies" },
    { label: "Active employees", value: activeEmployees.length, note: "Across all companies", tone: "blue", to: "/work-employees" },
    { label: "Present days", value: presentDays, note: "Selected month", tone: "green", to: `/company-attendance?month=${month}` },
    { label: "Monthly earnings", numberValue: earned, formatNumber: currency, note: "Calculated from attendance", tone: "purple", to: `/company-salary?month=${month}` },
    { label: "Salary received", numberValue: received, formatNumber: currency, note: "Payments recorded", tone: "green", to: `/company-salary?month=${month}&view=received` },
    { label: "Pending salary", numberValue: pending, formatNumber: currency, note: "Remaining to pay", tone: "amber", to: `/company-salary?month=${month}&view=pending` },
    { label: "Advance payments", numberValue: advances, formatNumber: currency, note: "This month", tone: "blue", to: `/company-salary?month=${month}&view=advance` },
  ];
  return <div className="page-wrap work-page">
    <div className="page-heading"><div><p className="eyebrow">MULTI-COMPANY OPERATIONS</p><h1>Work & earnings overview</h1><p className="page-subtitle">Attendance-based earnings and salary payments for the active company you select.</p></div><div className="heading-actions"><Link to="/companies" className="btn btn-secondary"><BriefcaseBusiness size={15} /> Manage companies</Link><Link to="/work-employees" className="btn btn-primary"><Plus size={16} /> Add employee</Link></div></div>
    <div className="work-month-toolbar"><div><CalendarCheck size={17} /><span>{companies[0]?.name || "Active companies"} · attendance and earnings</span></div><div className="work-toolbar-controls"><CompanyPicker companies={activeCompanies} value={companyId} includeAll onChange={(value) => setWorkPreferences({ selectedCompanyId: value })} /><MonthPicker value={month} onChange={(value) => setWorkPreferences({ selectedMonth: value })} /></div></div>
    <section className="work-stats-grid">{cards.map((card) => <StatCard key={card.label} {...card} />)}</section>
    <div className="work-section-heading"><div><h2>Company-wise salary summary</h2><p>Earned, received, and outstanding amounts for {month}</p></div><Link to="/company-salary">View salary management <ArrowRight size={15} /></Link></div>
    <div className="company-salary-grid">{companies.map((company) => {
      const companyRows = payrollRows.filter((row) => row.employee.companyId === company.id);
      const companyEarned = companyRows.reduce((sum, row) => sum + row.salary.earnedSalary, 0);
      const companyReceived = companyRows.reduce((sum, row) => sum + row.salary.received, 0);
      const companyPending = companyRows.reduce((sum, row) => sum + row.salary.remaining, 0);
      const monthlyBase = activeEmployees.filter((employee) => employee.companyId === company.id).reduce((sum, employee) => sum + monthlySalaryEquivalent(employee), 0);
      return <Link className="company-salary-card company-salary-card-link" key={company.id} to={`/company-salary?company=${company.id}&month=${month}`} aria-label={`Open ${company.name} payroll. Earned ${currency(companyEarned)}, received ${currency(companyReceived)}, pending ${currency(companyPending)}.`}><div className="company-card-head"><span className="company-logo-small">{company.logo ? <img src={company.logo} alt="" /> : company.name.slice(0, 1)}</span><div><b>{company.name}</b><small>{company.active ? "Active company" : "Inactive company"}</small></div><ArrowRight size={16} /></div><div className="company-card-metrics"><div><span>Monthly salary</span><b><AnimatedNumber value={monthlyBase} format={currency} /></b></div><div><span>Earned</span><b><AnimatedNumber value={companyEarned} format={currency} /></b></div><div><span>Received</span><b><AnimatedNumber value={companyReceived} format={currency} /></b></div><div><span>Pending</span><b className={companyPending ? "text-warn" : "text-good"}><AnimatedNumber value={companyPending} format={currency} /></b></div></div><span className="company-card-footer"><WalletCards size={14} /> Open company payroll <ArrowRight size={14} /></span></Link>;
    })}{companies.length === 0 && <div className="panel work-empty"><BriefcaseBusiness size={24} /><b>No companies yet</b><p>Add a company to start tracking work and payroll.</p><Link className="btn btn-primary" to="/companies">Add company</Link></div>}</div>
    <div className="work-section-heading"><div><h2>Quick links</h2><p>Manage work records separately from the legacy workspace modules.</p></div></div>
    <div className="work-quick-links"><Link to="/company-attendance"><CalendarCheck size={18} /><span><b>Company attendance</b><small>Mark daily and monthly records</small></span><ArrowRight size={15} /></Link><Link to="/company-salary"><CircleDollarSign size={18} /><span><b>Monthly salary</b><small>Calculate pay and record payments</small></span><ArrowRight size={15} /></Link><Link to="/work-reports"><WalletCards size={18} /><span><b>Reports & history</b><small>Export monthly and yearly records</small></span><ArrowRight size={15} /></Link></div>
  </div>;
}
