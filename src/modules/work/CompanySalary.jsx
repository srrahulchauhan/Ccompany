import { useMemo, useState } from "react";
import { ArrowDownToLine, CircleDollarSign, FileText, History, Plus, WalletCards, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useStore } from "../../context/StoreContext";
import { dateKey, monthKey } from "../../utils/date";
import { calculateWorkSalary } from "../../utils/workPayroll";
import { CompanyPicker, currency, MonthPicker, StatCard, WorkModal, downloadTableCsv } from "./WorkUI";

const paymentFields = [
  { name: "type", label: "Transaction type", type: "select", options: [{ value: "payment", label: "Salary payment" }, { value: "advance", label: "Advance payment" }, { value: "deduction", label: "Deduction" }] },
  { name: "amount", label: "Amount (₹)", type: "number", min: 1, required: true },
  { name: "date", label: "Payment date", type: "date", required: true },
  { name: "method", label: "Payment method", type: "select", options: ["Bank transfer", "UPI", "Cash", "Card", "Cheque"] },
  { name: "note", label: "Note", type: "textarea", wide: true },
];

export default function CompanySalary() {
  const { data, add, setWorkPreferences } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const companies = data.workCompanies;
  const requestedCompany = searchParams.get("company");
  const fallback = companies.find((company) => company.id === data.workPreferences.selectedCompanyId)?.id || companies.find((company) => company.active)?.id || "all";
  const [companyId, setCompanyId] = useState(requestedCompany && companies.some((company) => company.id === requestedCompany) ? requestedCompany : fallback);
  const [month, setMonth] = useState(searchParams.get("month") || data.workPreferences.selectedMonth || monthKey());
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [historyRecord, setHistoryRecord] = useState(null);
  const [viewFilter, setViewFilter] = useState(searchParams.get("view") || "all");
  const allRows = useMemo(() => data.workEmployees
    .filter((employee) => (companyId === "all" || employee.companyId === companyId)
      && (employee.status === "Active" || employee.finalSettlement?.month === month)
      && (!query || `${employee.name} ${employee.employeeId} ${employee.designation}`.toLowerCase().includes(query.toLowerCase())))
    .map((employee) => ({ employee, salary: calculateWorkSalary(data, employee, month) })), [data, companyId, month, query]);
  const rows = allRows.filter(({ salary }) => viewFilter === "all"
    || (viewFilter === "received" ? salary.received > 0
      : viewFilter === "pending" ? salary.remaining > 0
        : viewFilter === "advance" ? salary.advances > 0 : true));
  const totalEarned = allRows.reduce((sum, row) => sum + row.salary.earnedSalary, 0);
  const totalReceived = allRows.reduce((sum, row) => sum + row.salary.received, 0);
  const totalPending = allRows.reduce((sum, row) => sum + row.salary.remaining, 0);
  const totalAdvance = allRows.reduce((sum, row) => sum + row.salary.advances, 0);
  const changeCompany = (value) => {
    setCompanyId(value);
    setWorkPreferences({ selectedCompanyId: value });
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("company"); else params.set("company", value);
    setSearchParams(params);
  };
  const changeMonth = (value) => {
    setMonth(value);
    setWorkPreferences({ selectedMonth: value });
    const params = new URLSearchParams(searchParams);
    params.set("month", value);
    setSearchParams(params);
  };
  const changeView = (value) => {
    setViewFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === "all") params.delete("view"); else params.set("view", value);
    setSearchParams(params);
  };
  const openTransaction = (row, type = "payment", fullAmount = false) => setModal({
    employeeId: row.employee.id,
    companyId: row.employee.companyId,
    month,
    type,
    amount: fullAmount && type === "payment" ? row.salary.remaining : "",
    date: dateKey(),
    method: "Bank transfer",
    note: "",
  });
  const printSlip = (employee, salary) => {
    setHistoryRecord({ ...employee, printSalary: salary });
    const cleanup = () => document.body.classList.remove("printing-salary");
    window.addEventListener("afterprint", cleanup, { once: true });
    document.body.classList.add("printing-salary");
    setTimeout(() => window.print(), 80);
  };
  const saveTransaction = (values) => {
    const employee = data.workEmployees.find((item) => item.id === modal.employeeId);
    if (!employee) { toast.error("Employment record not found."); return; }
    const current = calculateWorkSalary(data, employee, month);
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error("Enter an amount greater than zero."); return; }
    if (amount > current.remaining) { toast.error(`This transaction exceeds the remaining salary of ${currency(current.remaining)}.`); return; }
    try {
      add("workSalaryTransactions", { ...values, amount, companyId: employee.companyId, employmentId: employee.id, month });
      toast.success(`${values.type === "payment" ? "Salary payment" : values.type === "advance" ? "Advance" : "Deduction"} recorded.`);
      setModal(null);
    } catch (error) { toast.error(error.message || "Unable to record salary transaction."); }
  };
  const exportCsv = () => downloadTableCsv(`company-salary-${month}.csv`,
    ["Company", "Employee", "Month", "Monthly salary", "Attendance days", "Absent days", "Half days", "Paid leave", "Overtime amount", "Deductions", "Advance", "Earned salary", "Received", "Remaining", "Status"],
    rows.map(({ employee, salary }) => [companies.find((company) => company.id === employee.companyId)?.name, employee.name, month, employee.monthlySalary, salary.counts.totalWorkingDays, salary.counts.absent, salary.counts.halfDay, salary.counts.paidLeave, salary.overtimeAmount, salary.deductions, salary.advances, salary.earnedSalary, salary.received, salary.remaining, salary.status]));
  const selectedCompanyName = companyId === "all" ? "All companies" : companies.find((company) => company.id === companyId)?.name;
  return <div className="page-wrap work-page">
    <div className="page-heading"><div><p className="eyebrow">PAYROLL & PAYMENTS</p><h1>Monthly salary</h1><p className="page-subtitle">Salary is recalculated from company attendance. Payments and advances remain in the employee’s payment history.</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={exportCsv}><ArrowDownToLine size={15} /> Export CSV</button><button className="btn btn-primary" onClick={() => window.print()}><FileText size={15} /> Print / PDF</button></div></div>
    <div className="work-month-toolbar"><div><WalletCards size={17} /><span>{selectedCompanyName} · salary register</span></div><div className="work-toolbar-controls"><CompanyPicker companies={companies} value={companyId} includeAll onChange={changeCompany} /><MonthPicker value={month} onChange={changeMonth} /></div></div>
    <div className="work-stats-grid work-stats-four"><StatCard label="Total earned" numberValue={totalEarned} formatNumber={currency} note={`Calculated for ${month} · all rows`} tone="purple" onClick={() => changeView("all")} active={viewFilter === "all"} /><StatCard label="Already received" numberValue={totalReceived} formatNumber={currency} note="Filter employees with payments" tone="green" onClick={() => changeView("received")} active={viewFilter === "received"} /><StatCard label="Remaining salary" numberValue={totalPending} formatNumber={currency} note="Filter pending or partial" tone="amber" onClick={() => changeView("pending")} active={viewFilter === "pending"} /><StatCard label="Advance payments" numberValue={totalAdvance} formatNumber={currency} note="Filter employees with advances" tone="blue" onClick={() => changeView("advance")} active={viewFilter === "advance"} /></div>
    <section className="panel work-table-panel salary-register"><div className="work-table-toolbar"><div><h2>Employee salary register</h2><p>{rows.length} employment records · updates automatically when attendance changes</p></div><label className="table-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees..." /></label></div>
      <div className="table-scroll"><table><thead><tr><th>Employee</th>{companyId === "all" && <th>Company</th>}<th>Monthly salary</th><th>Attendance / absent</th><th>Half / leave</th><th>Overtime</th><th>Deductions</th><th>Advance</th><th>Final payable</th><th>Received</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {rows.map(({ employee, salary }) => <tr key={employee.id}><td><div className="salary-person"><b>{employee.name}</b><small>{employee.employeeId}</small>{employee.status === "Left" && <small className="work-cell-subtitle">Final settlement</small>}</div></td>{companyId === "all" && <td>{companies.find((company) => company.id === employee.companyId)?.name || "Archived"}</td>}<td>{currency(employee.salaryType === "Monthly" ? employee.monthlySalary : employee.salaryType === "Daily" ? employee.dailySalary : employee.hourlyRate)}<small className="work-cell-subtitle">{employee.salaryType === "Daily" ? "per day" : employee.salaryType === "Hourly" ? "per hour" : "per month"}</small></td><td>{salary.counts.totalWorkingDays} / {salary.counts.absent}</td><td>{salary.counts.halfDay} / {salary.counts.paidLeave}</td><td>{currency(salary.overtimeAmount)}<small className="work-cell-subtitle">{salary.overtimeHours} hours</small></td><td>{currency(salary.deductions)}</td><td>{currency(salary.advances)}</td><td><b>{currency(salary.finalPayable)}</b><small className="work-cell-subtitle">{salary.payableDays} payable days</small></td><td>{currency(salary.received)}</td><td><b className={salary.remaining ? "text-warn" : "text-good"}>{currency(salary.remaining)}</b></td><td><span className={`status-pill status-${salary.status.toLowerCase()}`}>{salary.status}</span></td><td><div className="salary-actions"><button title="Record salary payment" disabled={salary.remaining <= 0} onClick={() => openTransaction({ employee, salary }, "payment", true)}><CircleDollarSign size={15} /></button><button title="Add partial payment" disabled={salary.remaining <= 0} onClick={() => openTransaction({ employee, salary }, "payment")}><Plus size={15} /></button><button title="Add advance" disabled={salary.remaining <= 0} onClick={() => openTransaction({ employee, salary }, "advance")}><WalletCards size={15} /></button><button title="Payment history" onClick={() => setHistoryRecord(employee)}><History size={15} /></button><button title="Salary slip PDF" onClick={() => printSlip(employee, salary)}><FileText size={15} /></button></div></td></tr>)}
        {rows.length === 0 && <tr><td colSpan={companyId === "all" ? 13 : 12}><div className="empty-state"><div className="empty-icon"><WalletCards size={22} /></div><b>No payroll records for this month</b><p>Choose another company or month, or add an employee employment.</p></div></td></tr>}
      </tbody></table></div></section>
    <div className="salary-formula-note"><b>Calculation method:</b> Present days + (Half days × 0.5) + eligible paid leave. Monthly rate is divided by calendar days or configured working days per company. Overtime is calculated separately.</div>
    {modal && <WorkModal title={`Salary transaction · ${data.workEmployees.find((employee) => employee.id === modal.employeeId)?.name || ""}`} fields={paymentFields} initial={modal} onClose={() => setModal(null)} onSave={saveTransaction} submitLabel="Save transaction" />}
    {historyRecord && !historyRecord.printSalary && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryRecord(null); }}><section className="modal-card details-modal"><div className="modal-head"><div><p className="eyebrow">PAYMENT HISTORY · {month}</p><h2>{historyRecord.name}</h2></div><button className="icon-btn" onClick={() => setHistoryRecord(null)} aria-label="Close payment history"><X size={20} /></button></div><div className="salary-history-summary"><span><small>Company</small><b>{companies.find((company) => company.id === historyRecord.companyId)?.name}</b></span><span><small>Final payable</small><b>{currency(calculateWorkSalary(data, historyRecord, month).finalPayable)}</b></span><span><small>Remaining</small><b>{currency(calculateWorkSalary(data, historyRecord, month).remaining)}</b></span></div><div className="table-scroll"><table><thead><tr><th>Date</th><th>Type</th><th>Method</th><th>Note</th><th>Amount</th></tr></thead><tbody>{calculateWorkSalary(data, historyRecord, month).transactions.map((transaction) => <tr key={transaction.id}><td>{transaction.date}</td><td className="capitalize">{transaction.type}</td><td>{transaction.method}</td><td>{transaction.note}</td><td>{currency(transaction.amount)}</td></tr>)}{calculateWorkSalary(data, historyRecord, month).transactions.length === 0 && <tr><td colSpan="5">No payments, advances, or deductions recorded for this month.</td></tr>}</tbody></table></div></section></div>}
    {historyRecord?.printSalary && <div className="salary-print"><h1>{companies.find((company) => company.id === historyRecord.companyId)?.name}</h1><p>Salary slip · {month}</p><hr /><p><b>Employee:</b> {historyRecord.name} ({historyRecord.employeeId})</p><p><b>Monthly salary:</b> {currency(historyRecord.monthlySalary)}</p><p><b>Attendance:</b> {historyRecord.printSalary.counts.totalWorkingDays} days · {historyRecord.printSalary.payableDays} payable days</p><p><b>Overtime:</b> {currency(historyRecord.printSalary.overtimeAmount)}</p><p><b>Deductions:</b> −{currency(historyRecord.printSalary.deductions)}</p><p><b>Advance:</b> −{currency(historyRecord.printSalary.advances)}</p><hr /><h2>Final payable: {currency(historyRecord.printSalary.finalPayable)}</h2><p><b>Received:</b> {currency(historyRecord.printSalary.received)} · <b>Remaining:</b> {currency(historyRecord.printSalary.remaining)}</p></div>}
  </div>;
}
