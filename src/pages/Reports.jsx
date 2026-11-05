import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { modules } from "../data/modules";
import { dateKey, monthKey } from "../utils/date";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
export default function Reports() {
  const { data } = useStore();
  const [range, setRange] = useState("Monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const reports = [
    ["Employee Reports", "employees", data.employees.length, "Active employees", data.employees.filter((item) => item.status === "Active").length],
    ["HR Reports", "hr", data.hr.length, "Selected candidates", data.hr.filter((item) => item.status === "Selected").length],
    ["Attendance Reports", "attendance", data.attendance.length, "Present", data.attendance.filter((item) => item.status === "Present").length],
    ["Salary Reports", "payroll", data.payroll.length, "Paid payroll", data.payroll.filter((item) => item.status === "Paid").length],
    ["Leave Reports", "leaves", data.leaves.length, "Pending requests", data.leaves.filter((item) => item.status === "Pending").length],
    ["Project Reports", "projects", data.projects.length, "Running projects", data.projects.filter((item) => item.status === "Running").length],
    ["Task Reports", "tasks", data.tasks.length, "Open tasks", data.tasks.filter((item) => item.status !== "Completed").length],
    ["Client Reports", "clients", data.clients.length, "Outstanding", money(data.clients.reduce((sum, item) => sum + Math.max(0, Number(item.projectValue || 0) - Number(item.paidAmount || 0)), 0))],
    ["Income Reports", "finance", data.finance.filter((item) => item.type === "Income").length, "Total income", money(data.finance.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount || 0), 0))],
    ["Expense Reports", "finance", data.finance.filter((item) => item.type === "Expense").length, "Total expenses", money(data.finance.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount || 0), 0))],
  ];
  const financeData = useMemo(() => {
    const filtered = data.finance.filter((item) => {
      if (range === "Custom") return (!from || item.date >= from) && (!to || item.date <= to);
      if (range === "Today") return item.date === dateKey();
      if (range === "Weekly") return new Date(item.date) >= new Date(Date.now() - 7 * 86400000);
      if (range === "Yearly") return String(item.date).slice(0, 4) === String(new Date().getFullYear());
      return String(item.date).slice(0, 7) === monthKey();
    });
    const income = filtered.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenses = filtered.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { filtered, income, expenses, profit: income - expenses };
  }, [data.finance, range, from, to]);

  const exportCsv = (excel = false) => {
    const headers = ["Report", "Records", "Measure", "Value"];
    const reportRows = [headers, ...reports.map(([name, , count, measure, value]) => [name, count, measure, value])];
    const content = excel
      ? `<html><head><meta charset="utf-8"></head><body><table>${reportRows.map((row) => `<tr>${row.map((cell) => `<td>${String(cell).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`).join("")}</table></body></html>`
      : reportRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const href = URL.createObjectURL(new Blob([content], { type: excel ? "application/vnd.ms-excel" : "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = href; a.download = excel ? "orbit-reports.xls" : "orbit-reports.csv"; a.click(); URL.revokeObjectURL(href);
  };
  return <div className="page-wrap">
    <div className="page-heading"><div><p className="eyebrow">INSIGHTS & ANALYTICS</p><h1>Reports & analytics</h1><p className="page-subtitle">A clear view of company performance across every team.</p></div><div className="heading-actions"><button className="btn btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print report</button><button className="btn btn-primary" onClick={() => exportCsv(true)}><Download size={16} /> Export Excel</button></div></div>
    <section className="report-kpis"><div className="report-kpi"><span>Total income</span><b>{money(financeData.income)}</b><small>Based on selected period</small></div><div className="report-kpi"><span>Total expenses</span><b>{money(financeData.expenses)}</b><small>Based on selected period</small></div><div className="report-kpi"><span>Net profit</span><b>{money(financeData.profit)}</b><small>Income less expenses</small></div><div className="report-kpi"><span>Pending payments</span><b>{money(data.clients.reduce((sum, item) => sum + Math.max(0, Number(item.projectValue || 0) - Number(item.paidAmount || 0)), 0))}</b><small>Across active clients</small></div></section>
    <section className="panel report-chart-panel"><div className="panel-heading"><div><h2>Profit & loss summary</h2><p>Finance transactions in the selected date range</p></div><div className="report-filters"><select className="filter-select" value={range} onChange={(event) => setRange(event.target.value)}>{["Today", "Weekly", "Monthly", "Yearly", "Custom"].map((item) => <option key={item}>{item}</option>)}</select>{range === "Custom" && <><input className="filter-select" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><input className="filter-select" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></>}<button className="btn btn-secondary btn-small" onClick={() => exportCsv(false)}>CSV</button></div></div>
      <div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: range, Income: financeData.income, Expenses: financeData.expenses, Profit: financeData.profit }]} margin={{ top: 15, right: 12, left: 0, bottom: 0 }}><CartesianGrid stroke="#eef0f5" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} tickFormatter={(value) => value >= 100000 ? `${Math.round(value / 100000)}L` : value} /><Tooltip formatter={(value) => money(value)} /><Bar dataKey="Income" fill="#6558d3" radius={[5, 5, 0, 0]} /><Bar dataKey="Expenses" fill="#83b9ff" radius={[5, 5, 0, 0]} /><Bar dataKey="Profit" fill="#34c69b" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>
    </section>
    <section className="panel reports-table-panel"><div className="table-toolbar"><div><h2>Operational reports</h2><p>Live totals calculated from your saved records</p></div><button className="btn btn-secondary btn-small" onClick={() => exportCsv(false)}><Download size={15} /> Export CSV</button></div><div className="table-scroll"><table><thead><tr><th>Report</th><th>Records</th><th>Key measure</th><th>Value</th><th>Data source</th></tr></thead><tbody>{reports.map(([name, collection, count, measure, value]) => <tr key={name}><td><b>{name}</b></td><td>{count}</td><td>{measure}</td><td>{value}</td><td>{modules[collection]?.title || "Finance"}</td></tr>)}</tbody></table></div></section>
    <div className="export-note">Reports reflect current LocalStorage data. Use Print to save this report as a PDF from your browser.</div>
  </div>;
}
