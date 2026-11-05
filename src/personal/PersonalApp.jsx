import { Navigate, Route, Routes } from "react-router-dom";
import { PersonalAccountsProvider } from "./PersonalAccountsContext";
import PersonalLayout from "./components/PersonalLayout";
import PersonalDashboard from "./pages/PersonalDashboard";
import PersonalLedger from "./pages/PersonalLedger";
import PersonalUdhaar from "./pages/PersonalUdhaar";
import PersonalBanks from "./pages/PersonalBanks";
import PersonalLoans from "./pages/PersonalLoans";
import PersonalCustomers from "./pages/PersonalCustomers";
import PersonalReports from "./pages/PersonalReports";
import PersonalNotifications from "./pages/PersonalNotifications";
import PersonalSettings from "./pages/PersonalSettings";
import "./personal.css";

export default function PersonalApp() {
  return <PersonalAccountsProvider><div className="personal-theme">
    <Routes>
      <Route element={<PersonalLayout />}>
        <Route index element={<PersonalDashboard />} />
        <Route path="expenses" element={<PersonalLedger type="expense" />} />
        <Route path="income" element={<PersonalLedger type="income" />} />
        <Route path="udhaar" element={<PersonalUdhaar />} />
        <Route path="banks" element={<PersonalBanks />} />
        <Route path="loans" element={<PersonalLoans />} />
        <Route path="customers" element={<PersonalCustomers />} />
        <Route path="reports" element={<PersonalReports />} />
        <Route path="notifications" element={<PersonalNotifications />} />
        <Route path="settings" element={<PersonalSettings />} />
        <Route path="*" element={<Navigate to="/personal" replace />} />
      </Route>
    </Routes>
  </div></PersonalAccountsProvider>;
}
