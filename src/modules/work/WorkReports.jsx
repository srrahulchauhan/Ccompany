import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { monthKey } from "../../utils/date";
import { calculateWorkSalary } from "../../utils/workPayroll";
import { CompanyPicker, currency, MonthPicker, StatCard, downloadTableCsv } from "./WorkUI";

const years = Array.from({ length: 6 }, (_, index) => String(new Date().getFullYear() - index));
const listMonths = (year) => Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);

export default function WorkReports() {
  const { data } = useStore();
  const [companyId, setCompanyId] = useState("all");
  const [month, setMonth] = useState(data.workPreferences.selectedMonth || monthKey());
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [employmentId, setEmploymentId] = useState("");
  const companies = data.workCompanies;
  const scopedEmployments = data.workEmployees.filter((employee) => companyId === "all" || employee.companyId === companyId);
  const payrollEmployees = scopedEmployments.filter((employee) => employee.status === "Active" || employee.finalSettlement?.month === month);
  const monthPayroll = payrollEmployees.map((employee) => ({ employee, salary: calculateWorkSalary(data, employee, month) }));
  const paymentHistory = data.workSalaryTransactions.filter((transaction) =>
    (companyId === "all" || transaction.companyId === companyId) && String(transaction.date || "").slice(0, 4) === year,
  ).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const attendanceHistory = data.workAttendance.filter((record) =>
    (companyId === "all" || record.companyId === companyId) && record.date.slice(0, 7) === month,
  ).sort((a, b) => b.date.localeCompare(a.date));
  const selectedHistoryEmployment = scopedEmployments.find((employee) => employee.id === employmentId) || scopedEmployments[0];
  const salaryHistory = useMemo(() => selectedHistoryEmployment
    ? listMonths(year).filter((value) => value >= selectedHistoryEmployment.joiningDate.slice(0, 7) && (!selectedHistoryEmployment.endDate || value <= selectedHistoryEmployment.endDate.slice(0, 7)))
      .map((value) => ({ month: value, salary: calculateWorkSalary(data, selectedHistoryEmployment, value) }))
    : [], [data, selectedHistoryEmployment, year]);
  const combinedMonthly = listMonths(year).map((value) => {
    const employees = scopedEmployments.filter((employee) => employee.status === "Active" || employee.finalSettlement?.month === value);
    const rows = employees.map((employee) => calculateWorkSalary(data, employee, value));
    return { month: value, earned: rows.reduce((sum, row) => sum + row.earnedSalary, 0), received: rows.reduce((sum, row) => sum + row.received, 0), pending: rows.reduce((sum, row) => sum + row.remaining, 0) };
  });
  const attendanceByCompany = companies.filter((company) => companyId === "all" || company.id === companyId).map((company) => {
    const records = data.workAttendance.filter((record) => record.companyId === company.id && record.date.slice(0, 7) === month);
    return { company, records, present: records.filter((record) => ["Present", "Overtime"].includes(record.status)).length, absent: records.filter((record) => record.status === "Absent").length, half: records.filter((record) => record.status === "Half Day").length, leave: records.filter((record) => record.status === "Paid Leave").length };
  });
  const pendingTotal = monthPayroll.reduce((sum, row) => sum + row.salary.remaining, 0);
  const earnedTotal = monthPayroll.reduce((sum, row) => sum + row.salary.earnedSalary, 0);
  const receivedTotal = monthPayroll.reduce((sum, row) => sum + row.salary.received, 0);
  const csvRows = monthPayroll.map(({ employee, salary }) => [companies.find((company) => company.id === employee.companyId)?.name, employee.name, month, salary.earnedSalary, salary.received, salary.remaining, salary.status]);
  const exportCsv = () => downloadTableCsv(`work-reports-${month}.csv`, ["Company", "Employee", "Month", "Earned", "Received", "Pending", "Status"], csvRows);
  const exportExcel = () => {
    const values = [["Company", "Employee", "Month", "Earned", "Received", "Pending", "Status"], ...csvRows];
    const html = `<html><head><meta charset="utf-8"></head><body><table>${values.map((row) => `<tr>${row.map((cell) => `<td>${String(cell ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
    const href = URL.createObjectURL(new Blob([html], { type: "application/vnd.ms-excel" }));
    const link = document.createElement("a"); link.href = href; link.download = `work-reports-${month}.xls`; link.click(); URL.revokeObjectURL(href);
  };
  return <div className="page-wrap work-page">
    <div className="page-heading"><div><p className="eyebrow">MULTI-COMPANY INSIGHTS</p><h1>Work reports</h1><p className="page-subtitle">Monthly and yearly attendance, earnings, payment history, and pending salary reports.</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={exportCsv}><Download size={15} /> CSV</button><button className="btn btn-secondary" onClick={exportExcel}><Download size={15} /> Excel</button><button className="btn btn-primary" onClick={() => window.print()}><Printer size={15} /> PDF / Print</button></div></div>
    <div className="work-month-toolbar"><div><span className="work-report-period">{companyId === "all" ? "All companies" : companies.find((company) => company.id === companyId)?.name} · Reports</span></div><div className="work-toolbar-controls"><CompanyPicker companies={companies} value={companyId} includeAll onChange={setCompanyId} /><MonthPicker value={month} onChange={setMonth} label="Report month" /><label className="work-filter"><span>Report year</span><select className="filter-select" value={year} onChange={(event) => setYear(event.target.value)}>{years.map((item) => <option key={item}>{item}</option>)}</select></label></div></div>
    <div className="work-stats-grid work-stats-three"><StatCard label="Monthly earnings" value={currency(earnedTotal)} note={month} tone="purple" to="#monthly-salary-report" /><StatCard label="Salary received" value={currency(receivedTotal)} note="Payments recorded" tone="green" to="#payment-history-report" /><StatCard label="Pending salary" value={currency(pendingTotal)} note="Unpaid balance this month" tone="amber" to="#pending-salary-report" /></div>
    <section className="panel work-report-panel" id="attendance-report"><div className="work-table-toolbar"><div><h2>Company-wise monthly attendance</h2><p>Attendance totals for {month}</p></div></div><div className="table-scroll"><table><thead><tr><th>Company</th><th>Present</th><th>Absent</th><th>Half day</th><th>Paid leave</th><th>Total records</th></tr></thead><tbody>{attendanceByCompany.map(({ company, records, present, absent, half, leave }) => <tr key={company.id}><td><b>{company.name}</b></td><td>{present}</td><td>{absent}</td><td>{half}</td><td>{leave}</td><td>{records.length}</td></tr>)}</tbody></table></div></section>
    <section className="panel work-report-panel" id="monthly-salary-report"><div className="work-table-toolbar"><div><h2>Company-wise monthly salary</h2><p>Calculated earnings, payments, and pending balance for {month}</p></div></div><div className="table-scroll"><table><thead><tr><th>Company</th><th>Employees</th><th>Earned</th><th>Received</th><th>Pending</th></tr></thead><tbody>{companies.filter((company) => companyId === "all" || company.id === companyId).map((company) => {
      const companyRows = monthPayroll.filter((row) => row.employee.companyId === company.id);
      return <tr key={company.id}><td><b>{company.name}</b></td><td>{companyRows.length}</td><td>{currency(companyRows.reduce((sum, row) => sum + row.salary.earnedSalary, 0))}</td><td>{currency(companyRows.reduce((sum, row) => sum + row.salary.received, 0))}</td><td>{currency(companyRows.reduce((sum, row) => sum + row.salary.remaining, 0))}</td></tr>;
    })}</tbody></table></div></section>
    <section className="panel work-report-panel"><div className="work-table-toolbar"><div><h2>Combined monthly earnings · {year}</h2><p>Year-to-date salary earning and payment summary</p></div></div><div className="table-scroll"><table><thead><tr><th>Month</th><th>Earned</th><th>Received</th><th>Pending</th></tr></thead><tbody>{combinedMonthly.map((row) => <tr key={row.month}><td>{new Date(`${row.month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</td><td>{currency(row.earned)}</td><td>{currency(row.received)}</td><td>{currency(row.pending)}</td></tr>)}</tbody></table></div></section>
    <section className="panel work-report-panel"><div className="work-table-toolbar"><div><h2>Employee-wise salary history</h2><p>Monthly calculation by employment record</p></div><select className="filter-select" value={selectedHistoryEmployment?.id || ""} onChange={(event) => setEmploymentId(event.target.value)}>{scopedEmployments.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} · {companies.find((company) => company.id === employee.companyId)?.name}</option>)}</select></div><div className="table-scroll"><table><thead><tr><th>Month</th><th>Attendance</th><th>Payable days</th><th>Earned</th><th>Received</th><th>Pending</th><th>Status</th></tr></thead><tbody>{salaryHistory.map(({ month: monthValue, salary }) => <tr key={monthValue}><td>{monthValue}</td><td>{salary.counts.totalWorkingDays}</td><td>{salary.payableDays}</td><td>{currency(salary.earnedSalary)}</td><td>{currency(salary.received)}</td><td>{currency(salary.remaining)}</td><td><span className={`status-pill status-${salary.status.toLowerCase()}`}>{salary.status}</span></td></tr>)}{salaryHistory.length === 0 && <tr><td colSpan="7">No salary history for this employee and year.</td></tr>}</tbody></table></div></section>
    <section className="panel work-report-panel" id="pending-salary-report"><div className="work-table-toolbar"><div><h2>Pending salary report</h2><p>Employees with unpaid balance for {month}</p></div></div><div className="table-scroll"><table><thead><tr><th>Company</th><th>Employee</th><th>Final payable</th><th>Received</th><th>Remaining</th></tr></thead><tbody>{monthPayroll.filter((row) => row.salary.remaining > 0).map(({ employee, salary }) => <tr key={employee.id}><td>{companies.find((company) => company.id === employee.companyId)?.name}</td><td>{employee.name}</td><td>{currency(salary.finalPayable)}</td><td>{currency(salary.received)}</td><td className="text-warn">{currency(salary.remaining)}</td></tr>)}{pendingTotal === 0 && <tr><td colSpan="5">No pending salary for this month.</td></tr>}</tbody></table></div></section>
    <section className="panel work-report-panel" id="payment-history-report"><div className="work-table-toolbar"><div><h2>Payment history</h2><p>Recorded payments, advances, and deductions · {year}</p></div></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Company</th><th>Employee</th><th>Type</th><th>Method</th><th>Month</th><th>Amount</th><th>Note</th></tr></thead><tbody>{paymentHistory.map((transaction) => <tr key={transaction.id}><td>{transaction.date}</td><td>{companies.find((company) => company.id === transaction.companyId)?.name || "Archived"}</td><td>{data.workEmployees.find((employee) => employee.id === transaction.employmentId)?.name || "Historical employment"}</td><td className="capitalize">{transaction.type}</td><td>{transaction.method}</td><td>{transaction.month}</td><td>{currency(transaction.amount)}</td><td>{transaction.note}</td></tr>)}{paymentHistory.length === 0 && <tr><td colSpan="8">No payments found for this year.</td></tr>}</tbody></table></div></section>
    <section className="panel work-report-panel"><div className="work-table-toolbar"><div><h2>Date-wise work history</h2><p>Attendance calendar entries and daily work status · {month}</p></div></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Company</th><th>Employee</th><th>Status</th><th>Hours</th><th>Overtime</th><th>Notes</th></tr></thead><tbody>{attendanceHistory.map((record) => <tr key={record.id}><td>{record.date}</td><td>{companies.find((company) => company.id === record.companyId)?.name}</td><td>{data.workEmployees.find((employee) => employee.id === record.employmentId)?.name || "Historical employment"}</td><td>{record.status}</td><td>{record.hours || 0}</td><td>{record.overtimeHours || 0}</td><td>{record.notes || "—"}</td></tr>)}{attendanceHistory.length === 0 && <tr><td colSpan="7">No attendance history for this month.</td></tr>}</tbody></table></div></section>
    <div className="export-note">Yearly earnings are calculated from each month’s attendance and saved transactions. Use PDF / Print to save this report through your browser’s print dialog.</div>
  </div>;
}
