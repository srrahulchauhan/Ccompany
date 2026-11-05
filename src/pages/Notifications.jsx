import { useMemo } from "react";
import { Bell, CalendarDays, CircleDollarSign, Package, UserRoundCheck, CheckCheck, ClipboardList } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { dateKey } from "../utils/date";

export default function Notifications() {
  const { data, updatePreferences } = useStore();
  const notifications = useMemo(() => [
    ...data.leaves.filter((item) => item.status === "Pending").map((item) => ({ id: `leave-${item.id}`, title: "Leave request", detail: `${item.employee} requested ${item.days} day${Number(item.days) === 1 ? "" : "s"} of ${item.leaveType.toLowerCase()} leave.`, date: item.startDate, href: "/leaves", icon: CalendarDays, tone: "purple" })),
    ...data.payroll.filter((item) => item.status === "Pending").map((item) => ({ id: `pay-${item.id}`, title: "Salary payment pending", detail: `${item.employee} · ${item.month} payroll is awaiting payment.`, date: item.month, href: "/payroll", icon: CircleDollarSign, tone: "amber" })),
    ...data.projects.filter((item) => item.status !== "Completed" && item.deadline && item.deadline <= dateKey(Date.now() + 7 * 86400000)).map((item) => ({ id: `project-${item.id}`, title: "Project deadline approaching", detail: `${item.name} is due ${item.deadline}.`, date: item.deadline, href: "/projects", icon: ClipboardList, tone: "blue" })),
    ...data.tasks.filter((item) => item.status !== "Completed" && item.dueDate && item.dueDate <= dateKey(Date.now() + 3 * 86400000)).map((item) => ({ id: `task-${item.id}`, title: "Task deadline approaching", detail: `${item.title} · assigned to ${item.employee || "Unassigned"}.`, date: item.dueDate, href: "/tasks", icon: ClipboardList, tone: "pink" })),
    ...data.inventory.filter((item) => item.status === "Low stock" || Number(item.quantity) <= 5).map((item) => ({ id: `stock-${item.id}`, title: "Low inventory", detail: `${item.name} has ${item.quantity} unit${Number(item.quantity) === 1 ? "" : "s"} remaining.`, date: "", href: "/inventory", icon: Package, tone: "amber" })),
    ...data.meetings.filter((item) => item.status === "Scheduled" && item.date >= dateKey()).map((item) => ({ id: `meeting-${item.id}`, title: "Upcoming meeting", detail: `${item.title} · ${item.time} at ${item.location}.`, date: item.date, href: "/meetings", icon: CalendarDays, tone: "green" })),
    ...data.employees.filter((item) => item.createdAt).map((item) => ({ id: `employee-${item.id}`, title: "New employee added", detail: `${item.name} joined as ${item.designation}.`, date: item.joiningDate, href: "/employees", icon: UserRoundCheck, tone: "purple" })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date))), [data]);
  const readIds = data.preferences.readNotificationIds || [];
  const unreadCount = notifications.filter((item) => !readIds.includes(item.id)).length;
  const markRead = (id) => updatePreferences({ readNotificationIds: [...new Set([...readIds, id])] });
  const markAll = () => { updatePreferences({ readNotificationIds: notifications.map((item) => item.id) }); toast.success("All notifications marked as read."); };
  return <div className="page-wrap">
    <div className="page-heading"><div><p className="eyebrow">STAY IN THE LOOP</p><h1>Notifications</h1><p className="page-subtitle">Important updates from across your company.</p></div><div className="heading-actions">{unreadCount > 0 && <button className="btn btn-secondary" onClick={markAll}><CheckCheck size={16} /> Mark all as read</button>}</div></div>
    <section className="panel notification-panel"><div className="notification-summary"><span><Bell size={17} /> {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}</span><span>Updates are generated from your saved records</span></div>
      {notifications.length === 0 ? <div className="empty-state"><div className="empty-icon"><Bell size={22} /></div><b>You’re all caught up</b><p>New notifications will appear here when an item needs your attention.</p></div>
        : <div className="notification-list">{notifications.map((item) => { const Icon = item.icon; const read = readIds.includes(item.id); return <div key={item.id} className={`notification-item ${read ? "notification-read" : ""}`}><span className={`alert-icon alert-${item.tone}`}><Icon size={17} /></span><div className="notification-copy"><Link to={item.href}><b>{item.title}</b></Link><p>{item.detail}</p><small>{item.date || "Needs attention"}</small></div>{!read && <button className="mark-read" onClick={() => markRead(item.id)}>Mark read</button>}<span className={`unread-indicator ${read ? "is-read" : ""}`} /></div>; })}</div>}
    </section>
  </div>;
}
