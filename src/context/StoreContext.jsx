import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createEmptyData } from "../data/seedData";
import { dateKey } from "../utils/date";
import { calculateWorkSalary } from "../utils/workPayroll";

const STORAGE_KEY = "orbit-company-management-v1";
const StoreContext = createContext(null);
const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const loadData = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const emptyData = createEmptyData();
    if (!saved) return emptyData;
    const parsed = JSON.parse(saved);
    return {
      ...emptyData,
      ...parsed,
      company: { ...emptyData.company, ...parsed.company },
      preferences: { ...emptyData.preferences, ...parsed.preferences },
      workPreferences: { ...emptyData.workPreferences, ...parsed.workPreferences },
    };
  } catch (error) {
    console.error("Could not load saved company data.", error);
    return createEmptyData();
  }
};

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadData);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save company data to LocalStorage.", error);
    }
  }, [data]);

  const actions = useMemo(() => ({
    add: (collection, record) => {
      const current = data[collection] || [];
      const next = { ...record, id: makeId(collection.slice(0, 3)), createdAt: new Date().toISOString() };
      if (collection === "employees") {
        const latestId = current.reduce((latest, item) => Math.max(latest, Number(String(item.employeeId || "").replace(/\D/g, "")) || 1000), 1000);
        next.employeeId = `EMP-${latestId + 1}`;
      }
      if (collection === "workEmployees") {
        const latestId = current.reduce((latest, item) => Math.max(latest, Number(String(item.employeeId || "").replace(/\D/g, "")) || 1000), 1000);
        next.employeeId = `WEMP-${latestId + 1}`;
        next.personKey ||= makeId("person");
        next.status ||= "Active";
        next.historyLocked = false;
      }
      if (collection === "workAttendance") {
        if (current.some((item) => item.employmentId === record.employmentId && item.companyId === record.companyId && item.date === record.date)) {
          throw new Error("Attendance is already recorded for this employee and date.");
        }
        const employment = data.workEmployees.find((item) => item.id === record.employmentId);
        const unlockedHistoricalEntry = employment?.status === "Left" && employment.historyLocked && employment.historyUnlocked && record.date <= employment.endDate;
        if (employment?.status !== "Active" && !unlockedHistoricalEntry) throw new Error("Attendance can only be recorded for an active employment or unlocked historical period.");
        const company = data.workCompanies.find((item) => item.id === record.companyId);
        if (!company?.active && !unlockedHistoricalEntry) throw new Error("Activate the company before recording new attendance.");
        if (employment.companyId !== record.companyId || record.date < employment.joiningDate) throw new Error("Attendance must match the employee's company and employment period.");
        if (employment.endDate && record.date > employment.endDate) throw new Error("Attendance cannot be dated after the employment ended.");
      }
      if (collection === "workSalaryTransactions") {
        if (Number(record.amount) <= 0) throw new Error("Payment amount must be greater than zero.");
        const employment = data.workEmployees.find((item) => item.id === record.employmentId);
        if (!employment) throw new Error("Employment record not found for salary transaction.");
        const current = calculateWorkSalary(data, employment, record.month);
        if (Number(record.amount) > current.remaining) throw new Error("Transaction amount exceeds the remaining salary balance.");
      }
      if (collection === "inventory" && !next.productId) {
        const latestId = current.reduce((latest, item) => Math.max(latest, Number(String(item.productId || "").replace(/\D/g, "")) || 0), 0);
        next.productId = `INV-${String(latestId + 1).padStart(3, "0")}`;
      }
      if (collection === "payroll") next.netSalary = Number(next.basic || 0) + Number(next.allowances || 0) + Number(next.bonus || 0) - Number(next.deductions || 0) - Number(next.advance || 0);
      if (collection === "inventory") {
        const quantity = Number(next.quantity || 0);
        next.status = quantity <= 0 ? "Out of stock" : quantity <= 5 ? "Low stock" : "In stock";
        next.stockHistory = [next.stockHistory, `${dateKey()} · Initial stock: ${quantity}`].filter(Boolean).join("\n");
      }
      setData((previous) => ({ ...previous, [collection]: [...(previous[collection] || []), next] }));
      return next;
    },
    update: (collection, recordId, record) => {
      if (collection === "workAttendance") {
        const existing = data.workAttendance.find((item) => item.id === recordId);
        const employment = data.workEmployees.find((item) => item.id === (record.employmentId || existing?.employmentId));
        const targetDate = record.date || existing?.date;
        if (existing && data.workAttendance.some((item) => item.id !== recordId && item.employmentId === (record.employmentId || existing.employmentId) && item.companyId === (record.companyId || existing.companyId) && item.date === (record.date || existing.date))) {
          throw new Error("Attendance is already recorded for this employee and date.");
        }
        if (existing && employment?.historyLocked && targetDate <= employment.endDate && !employment.historyUnlocked) {
          throw new Error("Historical attendance is locked. Unlock the employment history before editing.");
        }
        if (existing && (!employment || employment.companyId !== (record.companyId || existing.companyId) || targetDate < employment.joiningDate || (employment.endDate && targetDate > employment.endDate))) {
          throw new Error("Attendance must match the employee's company and employment period.");
        }
      }
      setData((previous) => ({
        ...previous,
        [collection]: (previous[collection] || []).map((item) => {
          if (item.id !== recordId) return item;
          const updated = { ...item, ...record };
          if (collection === "payroll") updated.netSalary = Number(updated.basic || 0) + Number(updated.allowances || 0) + Number(updated.bonus || 0) - Number(updated.deductions || 0) - Number(updated.advance || 0);
          if (collection === "inventory" && String(item.quantity) !== String(updated.quantity)) {
            updated.stockHistory = [item.stockHistory, `${dateKey()} · Quantity changed from ${item.quantity} to ${updated.quantity}`].filter(Boolean).join("\n");
          }
          if (collection === "inventory") {
            const quantity = Number(updated.quantity || 0);
            updated.status = quantity <= 0 ? "Out of stock" : quantity <= 5 ? "Low stock" : "In stock";
          }
          return updated;
        }),
      }));
    },
    remove: (collection, recordId) => {
      if (collection === "workAttendance") {
        const existing = data.workAttendance.find((item) => item.id === recordId);
        const employment = data.workEmployees.find((item) => item.id === existing?.employmentId);
        if (existing && employment?.historyLocked && existing.date <= employment.endDate && !employment.historyUnlocked) {
          throw new Error("Historical attendance is locked. Unlock the employment history before deleting.");
        }
      }
      setData((previous) => ({ ...previous, [collection]: (previous[collection] || []).filter((item) => item.id !== recordId) }));
    },
    switchEmployment: (employmentId, newTerms, endDate) => {
      const currentEmployment = data.workEmployees.find((item) => item.id === employmentId);
      if (!currentEmployment || currentEmployment.status !== "Active") throw new Error("Only an active employment can be switched.");
      if (currentEmployment.companyId === newTerms.companyId) throw new Error("Select a different company for the new employment.");
      const nextCompany = data.workCompanies.find((item) => item.id === newTerms.companyId);
      if (!nextCompany?.active || nextCompany.archived) throw new Error("Select an active company for the new employment.");
      if (endDate < currentEmployment.joiningDate || newTerms.joiningDate < endDate) throw new Error("Check the old employment end date and new company joining date.");
      const month = String(endDate).slice(0, 7);
      const settlement = calculateWorkSalary(data, currentEmployment, month);
      const now = new Date().toISOString();
      const newEmployment = {
        ...currentEmployment,
        ...newTerms,
        id: makeId("we"),
        employeeId: `WEMP-${data.workEmployees.reduce((latest, item) => Math.max(latest, Number(String(item.employeeId || "").replace(/\D/g, "")) || 1000), 1000) + 1}`,
        companyId: newTerms.companyId,
        joiningDate: newTerms.joiningDate || dateKey(),
        endDate: "",
        leaveDate: "",
        status: "Active",
        historyLocked: false,
        finalSettlement: null,
        createdAt: now,
      };
      setData((previous) => ({
        ...previous,
        workEmployees: previous.workEmployees.map((item) => item.id === employmentId
          ? { ...item, status: "Left", endDate, leaveDate: endDate, historyLocked: true, historyUnlocked: false, finalSettlement: { month, earnedSalary: settlement.earnedSalary, finalPayable: settlement.finalPayable, received: settlement.received, remaining: settlement.remaining, closedAt: now } }
          : item).concat(newEmployment),
      }));
      return newEmployment;
    },
    closeEmployment: (employmentId, endDate) => {
      const employment = data.workEmployees.find((item) => item.id === employmentId);
      if (!employment || employment.status !== "Active") throw new Error("Only an active employment can be ended.");
      if (endDate < employment.joiningDate) throw new Error("End date cannot be before the joining date.");
      const month = String(endDate).slice(0, 7);
      const settlement = calculateWorkSalary(data, employment, month);
      const now = new Date().toISOString();
      setData((previous) => ({
        ...previous,
        workEmployees: previous.workEmployees.map((item) => item.id === employmentId
          ? { ...item, status: "Left", endDate, leaveDate: endDate, historyLocked: true, historyUnlocked: false, finalSettlement: { month, earnedSalary: settlement.earnedSalary, finalPayable: settlement.finalPayable, received: settlement.received, remaining: settlement.remaining, closedAt: now } }
          : item),
      }));
    },
    setWorkPreferences: (preferences) => setData((previous) => ({ ...previous, workPreferences: { ...previous.workPreferences, ...preferences } })),
    deleteWorkCompany: (companyId) => {
      const employmentIds = new Set(data.workEmployees
        .filter((employment) => employment.companyId === companyId)
        .map((employment) => employment.id));
      const deletedCounts = {
        employments: employmentIds.size,
        attendance: data.workAttendance.filter((record) => record.companyId === companyId || employmentIds.has(record.employmentId)).length,
        salaryTransactions: data.workSalaryTransactions.filter((record) => record.companyId === companyId || employmentIds.has(record.employmentId)).length,
      };
      setData((previous) => ({
        ...previous,
        workCompanies: previous.workCompanies.filter((company) => company.id !== companyId),
        workEmployees: previous.workEmployees.filter((employment) => employment.companyId !== companyId),
        workAttendance: previous.workAttendance.filter((record) => record.companyId !== companyId && !employmentIds.has(record.employmentId)),
        workSalaryTransactions: previous.workSalaryTransactions.filter((record) => record.companyId !== companyId && !employmentIds.has(record.employmentId)),
        workPreferences: previous.workPreferences.selectedCompanyId === companyId
          ? { ...previous.workPreferences, selectedCompanyId: "all" }
          : previous.workPreferences,
      }));
      return deletedCounts;
    },
    toggleEmploymentLock: (employmentId) => setData((previous) => ({
      ...previous,
      workEmployees: previous.workEmployees.map((item) => item.id === employmentId ? { ...item, historyUnlocked: !item.historyUnlocked } : item),
    })),
    updateCompany: (company) => setData((previous) => ({ ...previous, company: { ...previous.company, ...company } })),
    updatePreferences: (preferences) => setData((previous) => ({ ...previous, preferences: { ...previous.preferences, ...preferences } })),
    reset: () => {
      localStorage.removeItem(STORAGE_KEY);
      setData(createEmptyData());
    },
    cleanAll: () => {
      localStorage.removeItem(STORAGE_KEY);
      setData(createEmptyData());
    },
    replaceAll: (replacement) => {
      const emptyData = createEmptyData();
      setData({
        ...emptyData,
        ...replacement,
        company: { ...emptyData.company, ...replacement.company },
        preferences: { ...emptyData.preferences, ...replacement.preferences },
        workPreferences: { ...emptyData.workPreferences, ...replacement.workPreferences },
      });
    },
  }), [data]);

  const value = useMemo(() => ({ data, ...actions }), [data, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider.");
  return store;
};
