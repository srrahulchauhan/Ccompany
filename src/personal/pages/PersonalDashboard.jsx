import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown, ArrowUp, ArrowUpRight, BadgeIndianRupee, Banknote, CalendarClock, CircleDollarSign,
  HandCoins, PiggyBank, Plus, Wallet, WalletCards,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { getAccountBalances, getCustomerBalance, getLoanRemaining, getUdhaarRemaining, usePersonalAccounts } from "../PersonalAccountsContext";
import { getMonthOverview, getRange, getUpcomingPayments } from "../calculations";
import { EmptyState, formatCurrency, formatDate, PageHeading, StatCard } from "../components/PersonalUI";

const chartColors = ["#f3c64e", "#f08078", "#75bce7", "#a792e7", "#60c9a7", "#f2a75a", "#90a3b8"];
const sumBy = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

function sixMonthTrend(data) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const values = getMonthOverview(data, key);
    return { month: date.toLocaleDateString("en-IN", { month: "short" }), Income: values.income, Expenses: values.expenses, Savings: values.savings };
  });
}

export default function PersonalDashboard() {
  const { data } = usePersonalAccounts();
  const [period, setPeriod] = useState("This month");
  const navigate = useNavigate();
  const range = getRange(period);
  const periodTransactions = data.transactions.filter((item) => item.date >= range.start && item.date <= range.end);
  const income = sumBy(periodTransactions.filter((item) => item.type === "income"), "amount");
  const expenses = sumBy(periodTransactions.filter((item) => item.type === "expense"), "amount");
  const accounts = getAccountBalances(data);
  const available = sumBy(accounts, "currentBalance");
  const expensesToday = sumBy(data.transactions.filter((item) => item.type === "expense" && item.date === range.end), "amount");
  const gaveOutstanding = sumBy(data.udhaar.filter((item) => item.type === "given"), "amount") -
    data.udhaar.filter((item) => item.type === "given").reduce((sum, item) => sum + item.repayments?.reduce((total, payment) => total + Number(payment.amount || 0), 0), 0);
  const receivedOutstanding = sumBy(data.udhaar.filter((item) => item.type === "received"), "amount") -
    data.udhaar.filter((item) => item.type === "received").reduce((sum, item) => sum + item.repayments?.reduce((total, payment) => total + Number(payment.amount || 0), 0), 0);
  const loanOutstanding = data.loans.reduce((sum, loan) => sum + getLoanRemaining(data, loan), 0);
  const emiTotal = sumBy(data.emiPayments.filter((item) => item.date >= range.start && item.date <= range.end), "amount");
  const upcoming = getUpcomingPayments(data).filter((item) => item.kind === "EMI" && item.status !== "Overdue");
  const categoryData = useMemo(() => {
    const totals = periodTransactions.filter((item) => item.type === "expense").reduce((result, item) => {
      result[item.category || "Other"] = (result[item.category || "Other"] || 0) + Number(item.amount || 0);
      return result;
    }, {});
    return Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [periodTransactions]);
  const trend = useMemo(() => sixMonthTrend(data), [data]);
  const recent = [...data.transactions].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6);
  const money = (value) => formatCurrency(value, data.profile.currency);
  const upcomingPayments = getUpcomingPayments(data).filter((item) => item.status !== "Completed").slice(0, 5);
  const customerPending = data.customers.reduce((sum, customer) => sum + Math.max(0, getCustomerBalance(data, customer.id)), 0);
  const totals = [
    ["Available balance", money(available), "Across all accounts", Wallet, "sky", "/personal/banks"],
    ["Income", money(income), period, ArrowDown, "green", "/personal/income"],
    ["Daily expenses", money(expensesToday), "Today", ArrowUp, "pink", "/personal/expenses"],
    ["Monthly expenses", money(expenses), period, Banknote, "yellow", "/personal/expenses"],
    ["Savings", money(income - expenses), "Income less expenses", PiggyBank, "purple", "/personal/reports"],
    ["Udhaar given", money(Math.max(0, gaveOutstanding)), "Still to collect", HandCoins, "pink", "/personal/udhaar"],
    ["Udhaar received", money(Math.max(0, receivedOutstanding)), "Still to repay", CircleDollarSign, "sky", "/personal/udhaar"],
    ["Outstanding loans", money(loanOutstanding), "Loan balances", WalletCards, "yellow", "/personal/loans"],
    ["EMI payments", money(emiTotal), period, BadgeIndianRupee, "green", "/personal/loans"],
    ["Upcoming EMIs", money(sumBy(upcoming, "amount")), "Next scheduled payment", CalendarClock, "purple", "/personal/loans"],
  ];
  return <div className="pa-page">
    <PageHeading eyebrow="YOUR FINANCIAL SNAPSHOT" title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${data.profile.name || "there"}`} subtitle="Here is how your personal finances are looking." action={<><Link className="pa-btn pa-btn-soft" to="/personal/expenses"><Plus size={16} /> Add expense</Link><Link className="pa-btn pa-btn-primary" to="/personal/income"><Plus size={16} /> Add income</Link></>} />
    <div className="pa-overview-strip"><div><span className="pa-live-dot" />Personal overview</div><div className="pa-period-switch">{["Today", "This week", "This month", "This year"].map((item) => <button key={item} className={period === item ? "pa-period-active" : ""} onClick={() => setPeriod(item)}>{item.replace("This ", "")}</button>)}</div></div>
    <div className="pa-stat-grid">{totals.map(([label, value, caption, icon, tone, path]) => <StatCard key={label} label={label} value={value} caption={caption} icon={icon} tone={tone} onClick={() => navigate(path)} />)}</div>
    <div className="pa-chart-grid">
      <section className="pa-panel pa-trend-panel"><div className="pa-panel-heading"><div><h2>Income vs expenses</h2><p>Your monthly cash flow over the last six months</p></div><Link to="/personal/reports">View report <ArrowUpRight size={14} /></Link></div>
        <div className="pa-chart-wrap">{trend.some((item) => item.Income || item.Expenses) ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="paIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f3c64e" stopOpacity={0.25} /><stop offset="90%" stopColor="#f3c64e" stopOpacity={0} /></linearGradient><linearGradient id="paExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f08078" stopOpacity={0.2} /><stop offset="90%" stopColor="#f08078" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eef0f4" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9aa2b0", fontSize: 10 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9aa2b0", fontSize: 9 }} tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value} /><Tooltip formatter={(value) => money(value)} contentStyle={{ border: "1px solid #eef0f4", borderRadius: 10, fontSize: 11 }} /><Area type="monotone" dataKey="Income" stroke="#e5b12d" strokeWidth={2.5} fill="url(#paIncome)" /><Area type="monotone" dataKey="Expenses" stroke="#ed827a" strokeWidth={2.5} fill="url(#paExpense)" /></AreaChart></ResponsiveContainer> : <EmptyState icon={CircleDollarSign} title="Your cash flow will appear here" description="Add an income or expense to start seeing trends." action={<Link className="pa-text-link" to="/personal/income">Add your first income</Link>} />}</div>
        <div className="pa-chart-legend"><span><i className="pa-legend-yellow" />Income</span><span><i className="pa-legend-pink" />Expenses</span><span className="pa-chart-period">Last 6 months</span></div>
      </section>
      <section className="pa-panel pa-category-panel"><div className="pa-panel-heading"><div><h2>Spending breakdown</h2><p>Where your money goes · {period.toLowerCase()}</p></div><Link to="/personal/expenses">Details <ArrowUpRight size={14} /></Link></div>
        {categoryData.length ? <><div className="pa-donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={91} paddingAngle={3} stroke="none">{categoryData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => money(value)} contentStyle={{ border: "1px solid #eef0f4", borderRadius: 10, fontSize: 11 }} /></PieChart></ResponsiveContainer><div className="pa-donut-total"><small>Total expenses</small><b>{money(expenses)}</b></div></div><div className="pa-category-list">{categoryData.slice(0, 4).map((item, index) => <div key={item.name}><span><i style={{ background: chartColors[index % chartColors.length] }} />{item.name}</span><b>{money(item.value)}</b></div>)}</div></> : <div className="pa-chart-empty"><EmptyState icon={ShoppingBag} title="No expenses yet" description="Your category breakdown will show after you add expenses." action={<Link className="pa-text-link" to="/personal/expenses">Add an expense</Link>} /></div>}
      </section>
    </div>
    <div className="pa-lower-grid">
      <section className="pa-panel pa-recent-panel"><div className="pa-panel-heading"><div><h2>Recent transactions</h2><p>Your latest money movements</p></div><Link to="/personal/reports">All activity <ArrowUpRight size={14} /></Link></div>
        {recent.length ? <div className="pa-transaction-list">{recent.map((item) => <div className="pa-transaction-row" key={item.id}><span className={`pa-transaction-icon ${item.type === "income" ? "pa-transaction-income" : "pa-transaction-expense"}`}>{item.type === "income" ? <ArrowDown size={16} /> : <ArrowUp size={16} />}</span><span className="pa-transaction-description"><b>{item.title}</b><small>{item.category} · {formatDate(item.date)}</small></span><b className={item.type === "income" ? "pa-positive-text" : "pa-amount-text"}>{item.type === "income" ? "+" : "−"}{money(item.amount)}</b></div>)}</div> : <EmptyState icon={CircleDollarSign} title="No transactions yet" description="Your latest income and expenses will appear here." action={<Link className="pa-text-link" to="/personal/expenses">Add your first transaction</Link>} />}
      </section>
      <section className="pa-panel pa-reminder-panel"><div className="pa-panel-heading"><div><h2>Upcoming payments</h2><p>Keep an eye on what is due next</p></div><Link to="/personal/notifications">All reminders <ArrowUpRight size={14} /></Link></div>
        {upcomingPayments.length ? <div className="pa-reminder-list">{upcomingPayments.map((item) => <div className="pa-reminder-row" key={`${item.kind}-${item.id}`}><span className={`pa-reminder-dot ${item.status === "Overdue" ? "pa-dot-overdue" : item.status === "Due today" ? "pa-dot-today" : ""}`} /><span><b>{item.title}</b><small>{item.person} · {formatDate(item.dueDate)}</small></span><strong>{item.amount ? money(item.amount) : "—"}</strong></div>)}</div> : <EmptyState icon={CalendarClock} title="Nothing due soon" description="Upcoming EMI, Udhaar, and scheduled payment reminders appear here." action={<Link className="pa-text-link" to="/personal/loans">Add a loan</Link>} />}
        {customerPending > 0 && <div className="pa-pending-note"><span>Customer payments pending</span><b>{money(customerPending)}</b></div>}
      </section>
    </div>
  </div>;
}
