import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Employees from "./modules/employees";
import HrManagement from "./modules/hr";
import Departments from "./modules/departments";
import Attendance from "./modules/attendance";
import Payroll from "./modules/payroll";
import Leaves from "./modules/leaves";
import Projects from "./modules/projects";
import Tasks from "./modules/tasks";
import Clients from "./modules/clients";
import Finance from "./modules/finance";
import Inventory from "./modules/inventory";
import Meetings from "./modules/meetings";
import WorkDashboard from "./modules/work/WorkDashboard";
import Companies from "./modules/work/Companies";
import WorkEmployees from "./modules/work/WorkEmployees";
import CompanyAttendance from "./modules/work/CompanyAttendance";
import CompanySalary from "./modules/work/CompanySalary";
import WorkReports from "./modules/work/WorkReports";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const PersonalApp = lazy(() => import("./personal/PersonalApp"));

export default function App() {
  return <>
    <Toaster position="top-right" toastOptions={{ duration: 2800, style: { borderRadius: "12px", fontSize: "13px" } }} />
    <Routes>
      <Route path="/personal/*" element={<Suspense fallback={<div className="page-loading">Loading personal accounts…</div>}><PersonalApp /></Suspense>} />
      <Route element={<Layout />}>
        <Route index element={<WorkDashboard />} />
        <Route path="overview" element={<Suspense fallback={<div className="page-loading">Loading your workspace…</div>}><Dashboard /></Suspense>} />
        <Route path="work" element={<WorkDashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="work-employees" element={<WorkEmployees />} />
        <Route path="company-attendance" element={<CompanyAttendance />} />
        <Route path="company-salary" element={<CompanySalary />} />
        <Route path="work-reports" element={<WorkReports />} />
        <Route path="employees" element={<Employees />} />
        <Route path="hr" element={<HrManagement />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="projects" element={<Projects />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="clients" element={<Clients />} />
        <Route path="finance" element={<Finance />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="meetings" element={<Meetings />} />
        <Route path="reports" element={<Suspense fallback={<div className="page-loading">Loading reports…</div>}><Reports /></Suspense>} />
        <Route path="notifications" element={<Suspense fallback={<div className="page-loading">Loading notifications…</div>}><Notifications /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<div className="page-loading">Loading settings…</div>}><Settings /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </>;
}
