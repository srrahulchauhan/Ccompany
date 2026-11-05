import { dateKey, monthKey } from "./date";

export const attendanceWeights = {
  Present: 1,
  "Half Day": 0.5,
  "Paid Leave": 1,
  Overtime: 1,
  Absent: 0,
  "Weekly Off": 0,
  Holiday: 0,
};

export const monthDays = (month) => {
  const [year, value] = month.split("-").map(Number);
  return new Date(year, value, 0).getDate();
};

export const calculateWorkSalary = (data, employment, month = monthKey()) => {
  const records = (data.workAttendance || []).filter((item) =>
    item.employmentId === employment.id && item.companyId === employment.companyId && String(item.date || "").slice(0, 7) === month,
  );
  const days = monthDays(month);
  const counts = {
    present: records.filter((item) => item.status === "Present" || item.status === "Overtime").length,
    absent: records.filter((item) => item.status === "Absent").length,
    halfDay: records.filter((item) => item.status === "Half Day").length,
    paidLeave: records.filter((item) => item.status === "Paid Leave").length,
    weeklyOff: records.filter((item) => item.status === "Weekly Off").length,
    holiday: records.filter((item) => item.status === "Holiday").length,
    totalWorkingDays: records.filter((item) => ["Present", "Absent", "Half Day", "Paid Leave", "Overtime"].includes(item.status)).length,
  };
  const paidLeaveDays = employment.paidLeaveEligible === false ? 0 : counts.paidLeave;
  const payableDays = counts.present + counts.halfDay * 0.5 + paidLeaveDays;
  const company = (data.workCompanies || []).find((item) => item.id === employment.companyId);
  const calculationMethod = company?.salaryCalculationMethod || "calendar-days";
  const weekdayCount = Array.from({ length: days }, (_, index) => new Date(`${month}-${String(index + 1).padStart(2, "0")}T12:00:00`).getDay()).filter((day) => day !== 0 && day !== 6).length;
  const denominator = calculationMethod === "working-days" ? Number(employment.workingDays || weekdayCount) : days;
  const overtimeHours = records.reduce((sum, item) => sum + Number(item.overtimeHours || 0), 0);
  const overtimeRate = employment.salaryType === "Daily"
    ? Number(employment.dailySalary || 0) / 8
    : employment.salaryType === "Hourly"
      ? Number(employment.hourlyRate || 0)
      : Number(employment.monthlySalary || 0) / days / 8;
  const customOvertimeRate = company?.overtimeRate !== "" && company?.overtimeRate != null && Number.isFinite(Number(company.overtimeRate))
    ? Number(company.overtimeRate)
    : null;
  const overtimeAmount = Math.round(overtimeHours * (customOvertimeRate ?? overtimeRate * Number(data.workPreferences?.overtimeMultiplier || 1.5)));
  const baseRate = employment.salaryType === "Daily"
    ? Number(employment.dailySalary || 0)
    : employment.salaryType === "Hourly"
      ? Number(employment.hourlyRate || 0) * records.reduce((sum, item) => sum + Number(item.hours || 0) * (attendanceWeights[item.status] || 0), 0)
      : Number(employment.monthlySalary || 0) / Math.max(denominator, 1) * payableDays;
  const earnedSalary = Math.round(baseRate + overtimeAmount);
  const transactions = (data.workSalaryTransactions || []).filter((item) =>
    item.employmentId === employment.id && item.companyId === employment.companyId && item.month === month,
  );
  const deductions = transactions.filter((item) => item.type === "deduction").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const advances = transactions.filter((item) => item.type === "advance").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const received = transactions.filter((item) => item.type === "payment").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const finalPayable = Math.max(0, earnedSalary - deductions);
  const remaining = Math.max(0, finalPayable - advances - received);
  const status = remaining === 0 && finalPayable > 0 ? "Paid" : received > 0 || advances > 0 ? "Partial" : "Pending";
  return {
    month, daysInMonth: days, counts, payableDays, denominator, overtimeHours, overtimeAmount,
    earnedSalary, deductions, advances, finalPayable, received, remaining, status,
    transactions: transactions.sort((a, b) => String(b.date).localeCompare(String(a.date))),
  };
};

export const totalCompanyPayroll = (data, companyId, month = monthKey()) =>
  (data.workEmployees || [])
    .filter((employee) => employee.companyId === companyId && (employee.status === "Active" || employee.endDate?.slice(0, 7) === month))
    .reduce((sum, employee) => sum + calculateWorkSalary(data, employee, month).finalPayable, 0);

export const isEmploymentAttendanceLocked = (employment, date) =>
  Boolean(employment?.historyLocked && employment.endDate && date <= employment.endDate);

export const currentMonthKey = () => monthKey(new Date());
export const toDateInput = () => dateKey(new Date());
