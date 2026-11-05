import { Link } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCheck, CircleDollarSign,
  Clock3, Plus, TrendingUp, Users, Wallet, Zap,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { useStore } from "../context/StoreContext";
import { dateKey, monthKey } from "../utils/date";

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const monthLabel = (month) => new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });
const getRecentMonths = () => Array.from({ length: 6 }, (_, index) => {
  const date = new Date();
  date.setMonth(date.getMonth() - (5 - index), 1);
  return date.toISOString().slice(0, 7);
});

export default function Dashboard() {
  const { data } = useStore();
  const active = data.employees.filter((item) => item.status === "Active").length;
  const today = dateKey();
  const currentMonth = monthKey();
  const currentMonthFinance = data.finance.filter((item) => String(item.date || "").slice(0, 7) === currentMonth);
  const income = currentMonthFinance.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = currentMonthFinance.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const runningProjects = data.projects.filter((item) => item.status === "Running").length;
  const pendingTasks = data.tasks.filter((item) => item.status !== "Completed").length;
  const todayAttendance = data.attendance.filter((item) => item.date === today);
  const attendancePresent = todayAttendance.filter((item) => ["Present", "Late", "Half Day"].includes(item.status)).length;
  const attendancePercent = data.employees.length ? Math.round((attendancePresent / data.employees.length) * 100) : 0;
  const months = getRecentMonths();
  const monthlyData = months.map((month) => {
    const records = data.finance.filter((item) => String(item.date || "").slice(0, 7) === month);
    const revenue = records.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenses = records.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { month: monthLabel(month), Revenue: revenue, Expenses: expenses, Profit: revenue - expenses };
  });
  const departments = data.departments.map((item) => ({ name: item.name, employees: data.employees.filter((employee) => employee.department === item.name).length })).filter((item) => item.employees > 0);
  const departmentColors = ["#5145cd", "#13b8a6", "#f7a94b", "#5b9cf6", "#e36b9a", "#a58bfa", "#2c91a6"];
  const upcoming = data.meetings.filter((item) => item.date >= today && item.status === "Scheduled").sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const recentEmployees = [...data.employees].slice(-5).reverse();
  const recentActivities = [
    ...data.employees.map((item) => ({ id: item.id, title: `${item.name} joined the team`, group: "Employee", date: item.createdAt || item.joiningDate, href: "/employees" })),
    ...data.projects.map((item) => ({ id: item.id, title: `Project ${item.name} started`, group: "Project", date: item.createdAt || item.startDate, href: "/projects" })),
    ...data.tasks.map((item) => ({ id: item.id, title: `Task ${item.title} added`, group: "Task", date: item.createdAt || item.startDate, href: "/tasks" })),
    ...data.finance.map((item) => ({ id: item.id, title: `${item.type} of ${formatMoney(item.amount)} recorded`, group: "Finance", date: item.createdAt || item.date, href: "/finance" })),
    ...data.hr.map((item) => ({ id: item.id, title: `${item.recordType} updated for ${item.name}`, group: "People", date: item.createdAt || item.date, href: "/hr" })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const notifications = [
    ...data.leaves.filter((item) => item.status === "Pending").map((item) => ({ title: "Leave request needs review", detail: `${item.employee} · ${item.days} day${item.days === 1 ? "" : "s"}`, tone: "purple" })),
    ...data.payroll.filter((item) => item.status === "Pending").map((item) => ({ title: "Payroll pending", detail: `${item.employee} · ${item.month}`, tone: "amber" })),
    ...data.inventory.filter((item) => Number(item.quantity) <= 5 || item.status === "Low stock").map((item) => ({ title: "Inventory running low", detail: `${item.name} · ${item.quantity} remaining`, tone: "blue" })),
  ].slice(0, 4);
  const cards = [
    { title: "Total employees", value: data.employees.length, note: `${active} active right now`, icon: Users, tone: "purple", change: "+12%", path: "/employees" },
    { title: "Active employees", value: active, note: "Across all departments", icon: Zap, tone: "green", change: "+8%", path: "/employees" },
    { title: "Departments", value: data.departments.length, note: "Teams across the company", icon: BriefcaseBusiness, tone: "blue", change: "Teams", path: "/departments" },
    { title: "Monthly revenue", value: formatMoney(income), note: "From recorded income", icon: CircleDollarSign, tone: "green", change: "+18%", path: "/finance" },
    { title: "Monthly expenses", value: formatMoney(expense), note: "From recorded expenses", icon: Wallet, tone: "amber", change: "Tracked", path: "/finance" },
    { title: "Company profit", value: formatMoney(income - expense), note: "Income less expenses", icon: TrendingUp, tone: "purple", change: income >= expense ? "Positive" : "Review", path: "/reports" },
    { title: "Running projects", value: runningProjects, note: `${data.projects.length} total projects`, icon: BriefcaseBusiness, tone: "blue", change: "In progress", path: "/projects" },
    { title: "Pending tasks", value: pendingTasks, note: `${data.tasks.filter((task) => task.status === "Completed").length} completed`, icon: CheckCheck, tone: "pink", change: "To do", path: "/tasks" },
  ];

  return <div className="page-wrap dashboard-page">
    <div className="page-heading dashboard-heading"><div><p className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}</p><h1>Good morning, {data.preferences.profileName.split(" ")[0]} <span className="wave">✦</span></h1><p className="page-subtitle">Here’s what’s happening across your company today.</p></div><div className="heading-actions"><Link to="/reports" className="btn btn-secondary">View reports <ArrowRight size={16} /></Link><Link to="/employees" className="btn btn-primary"><Plus size={17} /> Add employee</Link></div></div>
    <div className="stats-grid">{cards.map((card) => <Link className="stat-card stat-card-link" to={card.path} key={card.title} aria-label={`Open ${card.title} records`}><div className="stat-top"><span className={`stat-icon icon-${card.tone}`}><card.icon size={18} /></span><span className={`stat-change ${card.change === "Review" ? "change-negative" : ""}`}>{card.change === "Review" ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}{card.change}</span></div><p>{card.title}</p><h2>{card.value}</h2><small>{card.note}</small></Link>)}</div>
    <div className="dashboard-grid chart-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Revenue vs expenses</h2><p>Income and outgoing cash · last 6 months</p></div><Link to="/finance">View finance <ArrowRight size={14} /></Link></div><div className="chart-legend"><span><i className="legend-purple" /> Revenue</span><span><i className="legend-blue" /> Expenses</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData} barGap={7} margin={{ top: 10, right: 4, left: -12, bottom: 0 }}><CartesianGrid stroke="#eef0f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#98a2b3", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a2b3", fontSize: 10 }} tickFormatter={(value) => value >= 100000 ? `${Math.round(value / 100000)}L` : value} /><Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ border: "1px solid #eef0f5", borderRadius: 10, fontSize: 12 }} /><Bar dataKey="Revenue" fill="#6558d3" radius={[5, 5, 0, 0]} /><Bar dataKey="Expenses" fill="#83b9ff" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section>
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Monthly profit</h2><p>Net income · last 6 months</p></div><span className="trend-label"><TrendingUp size={14} /> Profit & loss</span></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyData} margin={{ top: 18, right: 5, left: -15, bottom: 0 }}><defs><linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#39c6a0" stopOpacity={0.22} /><stop offset="100%" stopColor="#39c6a0" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#eef0f5" vertical={false} /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#98a2b3", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#98a2b3", fontSize: 10 }} tickFormatter={(value) => value >= 100000 ? `${Math.round(value / 100000)}L` : value} /><Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ border: "1px solid #eef0f5", borderRadius: 10, fontSize: 12 }} /><Area type="monotone" dataKey="Profit" stroke="#27b991" strokeWidth={2.5} fill="url(#profitFill)" /></AreaChart></ResponsiveContainer></div></section>
    </div>
    <div className="dashboard-grid lower-grid">
      <section className="panel department-panel"><div className="panel-heading"><div><h2>Team distribution</h2><p>Employees by department</p></div><Link to="/departments">Departments <ArrowRight size={14} /></Link></div><div className="department-chart"><ResponsiveContainer width="48%" height={185}><PieChart><Pie data={departments} dataKey="employees" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="none">{departments.map((entry, index) => <Cell key={entry.name} fill={departmentColors[index % departmentColors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="department-legend">{departments.slice(0, 5).map((item, index) => <div key={item.name}><span><i style={{ backgroundColor: departmentColors[index] }} />{item.name}</span><b>{item.employees}</b></div>)}</div></div></section>
      <section className="panel attendance-panel"><div className="panel-heading"><div><h2>Attendance</h2><p>Team attendance snapshot · today</p></div><Link to="/attendance">View all <ArrowRight size={14} /></Link></div><div className="attendance-summary"><div className="attendance-donut" style={{ "--attendance": `${attendancePercent}%` }}><div><b>{attendancePercent}%</b><span>Attendance</span></div></div><div className="attendance-numbers"><div><i className="dot-present" /><span>Present</span><b>{attendancePresent}</b></div><div><i className="dot-late" /><span>Late arrival</span><b>{todayAttendance.filter((item) => item.status === "Late").length}</b></div><div><i className="dot-absent" /><span>Absent</span><b>{todayAttendance.filter((item) => item.status === "Absent").length}</b></div></div></div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent employees</h2><p>Latest additions to your team</p></div><Link to="/employees">View all <ArrowRight size={14} /></Link></div><div className="recent-list">{recentEmployees.map((employee) => <div className="recent-person" key={employee.id}><img src={employee.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=e8eaff&color=5147d9`} alt="" /><span><b>{employee.name}</b><small>{employee.designation}</small></span><i className={`online-dot ${employee.status === "Active" ? "online" : ""}`} /></div>)}{recentEmployees.length === 0 && <p className="muted-empty">No employees added yet.</p>}</div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes in your workspace</p></div><Link to="/hr">Activity history <ArrowRight size={14} /></Link></div><div className="alert-list">{recentActivities.map((item) => <div className="alert-row" key={`${item.group}-${item.id}`}><span className="activity-dot">{item.group.slice(0, 1)}</span><span><b>{item.title}</b><small>{item.group} · {new Date(item.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small></span></div>)}{recentActivities.length === 0 && <p className="muted-empty">New actions will appear here as records are created.</p>}</div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Upcoming meetings</h2><p>What’s on the calendar</p></div><Link to="/meetings">Calendar <ArrowRight size={14} /></Link></div><div className="meeting-list">{upcoming.map((meeting) => <div className="meeting-item" key={meeting.id}><div className="meeting-date"><b>{new Date(`${meeting.date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit" })}</b><span>{new Date(`${meeting.date}T00:00:00`).toLocaleDateString("en-IN", { month: "short" })}</span></div><div><b>{meeting.title}</b><small><Clock3 size={12} /> {meeting.time} · {meeting.location}</small></div></div>)}{upcoming.length === 0 && <p className="muted-empty">No upcoming meetings. <Link to="/meetings">Schedule one</Link></p>}</div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Tasks to focus on</h2><p>Open work across the team</p></div><Link to="/tasks">View tasks <ArrowRight size={14} /></Link></div><div className="task-list">{data.tasks.filter((task) => task.status !== "Completed").slice(0, 4).map((task) => <div className="task-row" key={task.id}><span className={`priority-mark priority-${task.priority.toLowerCase()}`} /><div><b>{task.title}</b><small>{task.employee} · Due {task.dueDate}</small></div><span className={`status-pill status-${task.status.toLowerCase().replaceAll(" ", "-")}`}>{task.status}</span></div>)}{pendingTasks === 0 && <p className="muted-empty">All tasks are complete. Great work!</p>}</div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Needs your attention</h2><p>Important company updates</p></div><Link to="/notifications">All alerts <ArrowRight size={14} /></Link></div><div className="alert-list">{notifications.map((item, index) => <div className="alert-row" key={`${item.title}-${index}`}><span className={`alert-icon alert-${item.tone}`}><CalendarDays size={15} /></span><span><b>{item.title}</b><small>{item.detail}</small></span></div>)}{notifications.length === 0 && <p className="muted-empty">You’re all caught up.</p>}</div></section>
    </div>
    <div className="dashboard-footer"><span>© {new Date().getFullYear()} {data.company.name}</span><span>Everything is saved automatically <i className="save-dot" /></span></div>
  </div>;
}
