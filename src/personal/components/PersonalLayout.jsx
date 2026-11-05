import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeftRight, Bell, BriefcaseBusiness, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleDollarSign,
  HandCoins, LayoutDashboard, Menu, Settings2, ShoppingBag, UsersRound, Wallet, X,
} from "lucide-react";
import { usePersonalAccounts } from "../PersonalAccountsContext";

const links = [
  { label: "Overview", path: "/personal", icon: LayoutDashboard, end: true },
  { label: "Expenses", path: "/personal/expenses", icon: ShoppingBag },
  { label: "Income", path: "/personal/income", icon: CircleDollarSign },
  { label: "Udhaar khata", path: "/personal/udhaar", icon: HandCoins },
  { label: "Bank accounts", path: "/personal/banks", icon: Wallet },
  { label: "Loans & EMI", path: "/personal/loans", icon: BriefcaseBusiness },
  { label: "Customers", path: "/personal/customers", icon: UsersRound },
  { label: "Reports", path: "/personal/reports", icon: ChartNoAxesCombined },
  { label: "Reminders", path: "/personal/notifications", icon: Bell },
  { label: "Settings", path: "/personal/settings", icon: Settings2 },
];

export default function PersonalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data } = usePersonalAccounts();
  const location = useLocation();
  const current = links.find((item) => item.end ? location.pathname === item.path : location.pathname.startsWith(item.path));
  const unpaid = data.emiPayments.filter((payment) => payment.status === "Partial").length +
    data.reminders.filter((reminder) => reminder.status !== "Completed").length;
  return <div className="personal-shell">
    {sidebarOpen && <button className="pa-mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
    <aside className={`pa-sidebar ${sidebarOpen ? "pa-sidebar-open" : ""}`}>
      <div className="pa-brand">
        <div className="pa-brand-mark"><Wallet size={19} /></div>
        <div><b>pocket</b><span>PERSONAL FINANCE</span></div>
        <button className="pa-icon-button pa-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
      </div>
      <div className="pa-side-label">YOUR MONEY</div>
      <nav className="pa-nav">{links.map(({ label, path, icon: Icon, end }) => <NavLink key={path} to={path} end={end} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `pa-nav-link ${isActive ? "pa-nav-active" : ""}`}>
        <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === "Reminders" && unpaid > 0 && <i>{unpaid}</i>}
      </NavLink>)}</nav>
      <div className="pa-sidebar-bottom">
        <div className="pa-secure-note"><span>✦</span><b>Your finances, in focus.</b><small>Your personal account data is saved only in this browser.</small></div>
        <Link to="/" className="pa-back-company"><ArrowLeftRight size={16} /><span>Company workspace</span></Link>
      </div>
    </aside>
    <main className="pa-main">
      <header className="pa-topbar">
        <div className="pa-topbar-title"><button className="pa-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={19} /></button><div><span>Personal accounts</span><b>{current?.label || "Overview"}</b></div></div>
        <div className="pa-topbar-actions"><Link to="/personal/notifications" className="pa-notification-link" aria-label="Open reminders"><Bell size={18} />{unpaid > 0 && <i />}</Link><Link to="/personal/settings" className="pa-profile-chip"><span>{(data.profile.name || "M").trim().slice(0, 1).toUpperCase()}</span><b>{data.profile.name || "My Accounts"}</b><ChevronLeft size={14} /></Link></div>
      </header>
      <div className="pa-content"><Outlet /></div>
      <footer className="pa-footer"><span>Private by design · Your data stays on this device</span><span>{new Date().getFullYear()} Pocket accounts</span></footer>
    </main>
  </div>;
}
