import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowUpRight, Bell, Boxes, BriefcaseBusiness, Building, CalendarCheck, CalendarDays, ChartNoAxesCombined,
  ChartPie, ChevronDown, ChevronsLeft, ChevronsRight, Circle, Handshake, LayoutDashboard, ListTodo, Menu,
  Search, Settings2, UserRoundCog, Users, Video, Wallet, WalletCards, X,
} from "lucide-react";
import { navigation } from "../data/modules";
import { useStore } from "../context/StoreContext";

const iconMap = {
  LayoutDashboard, Users, Building, CalendarCheck, Wallet, WalletCards, CalendarDays,
  BriefcaseBusiness, ListTodo, Handshake, ChartNoAxesCombined, Boxes, Video, ChartPie, Bell, Settings2, UserRoundCog,
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data } = useStore();
  const alerts = data.preferences.notifications === false ? [] : [
    ...data.leaves.filter((item) => item.status === "Pending"),
    ...data.payroll.filter((item) => item.status === "Pending"),
    ...data.inventory.filter((item) => item.status === "Low stock" || Number(item.quantity) <= 5),
  ];

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/employees?q=${encodeURIComponent(query)}`);
  };
  const Sidebar = ({ mobile = false }) => (
    <aside className={`sidebar ${collapsed && !mobile ? "sidebar-collapsed" : ""} ${mobile ? "mobile-sidebar" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">o</div>
        {(!collapsed || mobile) && <div className="brand-copy"><b>orbit</b><span>COMPANY OS</span></div>}
        {mobile && <button className="icon-btn ml-auto" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>}
      </div>
      <div className="nav-section-title">{(!collapsed || mobile) && "MULTI-COMPANY WORK"}</div>
      <nav className="sidebar-nav">
        {navigation.slice(0, 6).map((item) => {
          const Icon = iconMap[item.icon] || Circle;
          return <NavLink key={item.path} to={item.path} end={item.path === "/"} onClick={() => setMobileOpen(false)} title={collapsed && !mobile ? item.label : ""} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
          </NavLink>;
        })}
      </nav>
      <div className="nav-section-title nav-secondary">{(!collapsed || mobile) && "COMPANY OPERATIONS"}</div>
      <nav className="sidebar-nav">
        {navigation.slice(6, 11).map((item) => {
          const Icon = iconMap[item.icon] || Circle;
          return <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} title={collapsed && !mobile ? item.label : ""} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
          </NavLink>;
        })}
      </nav>
      <div className="nav-section-title nav-secondary">{(!collapsed || mobile) && "PROJECTS & ADMIN"}</div>
      <nav className="sidebar-nav">
        {navigation.slice(11).map((item) => {
          const Icon = iconMap[item.icon] || Circle;
          return <NavLink key={item.path} to={item.path} onClick={() => setMobileOpen(false)} title={collapsed && !mobile ? item.label : ""} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
            {item.label === "Notifications" && alerts.length > 0 && <span className="nav-badge">{alerts.length}</span>}
          </NavLink>;
        })}
      </nav>
      <div className="nav-section-title nav-secondary">{(!collapsed || mobile) && "PERSONAL FINANCE"}</div>
      <nav className="sidebar-nav">
        <NavLink to="/personal" onClick={() => setMobileOpen(false)} title={collapsed && !mobile ? "Personal Accounts" : ""} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
          <ChartNoAxesCombined size={18} strokeWidth={1.8} /><span>Personal Accounts</span>
        </NavLink>
      </nav>
      <div className="sidebar-bottom">
        {(!collapsed || mobile) && <div className="help-card"><div className="help-icon">✦</div><b>Need a hand?</b><p>Our team is here to help you get more from Orbit.</p><button onClick={() => window.open("mailto:support@orbit.co")}>Contact support <ArrowUpRight size={14} /></button></div>}
        <button className="collapse-btn" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronsRight size={17} /> : <><ChevronsLeft size={17} /><span>Collapse menu</span></>}</button>
      </div>
    </aside>
  );

  return <div className={`app-shell ${data.preferences.theme === "dark" ? "dark-theme" : ""}`}>
    <div className="desktop-sidebar"><Sidebar /></div>
    {mobileOpen && <div className="mobile-backdrop" onClick={() => setMobileOpen(false)}><div onClick={(event) => event.stopPropagation()}><Sidebar mobile /></div></div>}
    <main className={`main-shell ${collapsed ? "main-expanded" : ""}`}>
      <header className="topbar">
        <div className="topbar-left"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Overview</strong></div></div>
        <div className="topbar-actions">
          <form className="top-search" onSubmit={submitSearch}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees..." aria-label="Search employees" /><kbd>⌘ K</kbd></form>
          <Link className="top-icon" to="/notifications" aria-label="Notifications"><Bell size={19} />{alerts.length > 0 && <i />}</Link>
          <div className="profile-wrap">
            <button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)}>
              <span className="avatar avatar-admin">AM</span><span className="profile-name">{data.preferences.profileName}</span><ChevronDown size={15} />
            </button>
            {profileOpen && <div className="profile-menu"><div className="profile-menu-head"><b>{data.preferences.profileName}</b><span>Workspace administrator</span></div><Link to="/settings" onClick={() => setProfileOpen(false)}>Profile & settings</Link><button onClick={() => { setProfileOpen(false); navigate("/settings"); }}>Company preferences</button></div>}
          </div>
        </div>
      </header>
      <div className="content-area"><Outlet /></div>
    </main>
  </div>;
}
