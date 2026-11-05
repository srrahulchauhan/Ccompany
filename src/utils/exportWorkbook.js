import { modules, moduleOrder } from "../data/modules";
import { calculateWorkSalary } from "./workPayroll";

const workCollectionLabels = {
  workCompanies: "Companies",
  workEmployees: "Company Employments",
  workAttendance: "Company Attendance",
  workSalaryTransactions: "Salary Payments",
};

const workCollectionFields = {
  workCompanies: ["id", "name", "active", "address", "phone", "email", "joiningDate", "workType", "salaryCalculationMethod", "paymentDate", "notes", "createdAt"],
  workEmployees: ["id", "employeeId", "personKey", "name", "phone", "email", "companyId", "department", "designation", "joiningDate", "endDate", "salaryType", "monthlySalary", "dailySalary", "hourlyRate", "workingDays", "status", "historyLocked", "historyUnlocked", "createdAt"],
  workAttendance: ["id", "companyId", "employmentId", "date", "status", "checkIn", "checkOut", "hours", "overtimeHours", "notes", "createdAt"],
  workSalaryTransactions: ["id", "companyId", "employmentId", "month", "type", "amount", "date", "paymentMethod", "notes", "createdAt"],
};

const flattenRecord = (record, prefix = "", result = {}) => {
  Object.entries(record || {}).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !(value instanceof Date) && !Array.isArray(value)) {
      flattenRecord(value, path, result);
    } else if (Array.isArray(value)) {
      result[path] = value.map((item) => item && typeof item === "object" ? JSON.stringify(item) : String(item ?? "")).join("; ");
    } else {
      result[path] = value ?? "";
    }
  });
  return result;
};

const displayHeader = (key) => key
  .replace(/\./g, " / ")
  .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
  .replace(/[_-]/g, " ")
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const isDateField = (key) => /date|joining|deadline|createdat|updatedat|checkin|checkout/i.test(key);
const isNumericField = (key) => /salary|amount|budget|price|deduction|advance|earned|received|remaining|payable|overtime|rate|revenue|expense|profit|income|cost|bonus|allowance|days|hours|quantity|progress|count|total/i.test(key);

const prepareCellValue = (key, value) => {
  if (value === "" || value === null || value === undefined) return "";
  if (isDateField(key) && typeof value === "string" && value.trim()) {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const parsed = new Date(dateOnly ? `${value}T12:00:00` : value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (isNumericField(key) && typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return value;
};

const appendTableSheet = (workbook, { name, rows, fields = [], currencyColumns = [] }) => {
  const worksheet = workbook.addWorksheet(name.slice(0, 31));
  const flattened = rows.map((row) => flattenRecord(row));
  const keys = [...new Set(["id", ...fields, ...flattened.flatMap((row) => Object.keys(row))])].filter((key) =>
    fields.includes(key) || flattened.some((row) => Object.hasOwn(row, key)),
  );
  const headers = keys.map(displayHeader);
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF172554" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  flattened.forEach((row) => {
    worksheet.addRow(keys.map((key) => prepareCellValue(key, row[key] ?? "")));
  });

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  if (headers.length) worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(rows.length + 1, 1), column: headers.length } };
  worksheet.columns = keys.map((key, index) => {
    const widestValue = flattened.reduce((width, row) => Math.max(width, String(row[key] ?? "").length), headers[index].length);
    return { width: Math.min(Math.max(widestValue + 2, 14), 36) };
  });
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell, columnNumber) => {
        const key = keys[columnNumber - 1];
        if (cell.value instanceof Date) cell.numFmt = /time|checkin|checkout/i.test(key) ? "dd-mmm-yyyy hh:mm" : "dd-mmm-yyyy";
        else if (isNumericField(key)) cell.numFmt = currencyColumns.includes(key) || /salary|amount|budget|price|deduction|advance|earned|received|remaining|revenue|expense|profit|income|cost|bonus|allowance/i.test(key) ? '"₹" #,##0.00' : "#,##0.##";
      });
    }
  });
  return worksheet;
};

const relatedWorkRows = (data, collection) => {
  const companies = data.workCompanies || [];
  const employees = data.workEmployees || [];
  if (collection === "workEmployees") return employees.map((employee) => ({ ...employee, companyName: companies.find((company) => company.id === employee.companyId)?.name || "" }));
  if (collection === "workAttendance") return (data.workAttendance || []).map((record) => ({
    ...record,
    companyName: companies.find((company) => company.id === record.companyId)?.name || "",
    employeeName: employees.find((employee) => employee.id === record.employmentId)?.name || "",
    employeeId: employees.find((employee) => employee.id === record.employmentId)?.employeeId || "",
  }));
  if (collection === "workSalaryTransactions") return (data.workSalaryTransactions || []).map((record) => ({
    ...record,
    companyName: companies.find((company) => company.id === record.companyId)?.name || "",
    employeeName: employees.find((employee) => employee.id === record.employmentId)?.name || "",
    employeeId: employees.find((employee) => employee.id === record.employmentId)?.employeeId || "",
  }));
  return data[collection] || [];
};

export async function buildManagementWorkbook(data) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = data.company?.name || "Orbit Company Management";
  workbook.created = new Date();
  workbook.subject = "Company management, attendance, and payroll data";
  workbook.title = `${data.company?.name || "Company"} data export`;

  const month = data.workPreferences?.selectedMonth || new Date().toISOString().slice(0, 7);
  const companyById = new Map((data.workCompanies || []).map((company) => [company.id, company]));
  const employments = (data.workEmployees || []).filter((employee) => employee.status === "Active" || employee.finalSettlement?.month === month);
  const monthlyPayroll = employments.map((employee) => {
    const salary = calculateWorkSalary(data, employee, month);
    return {
      "Company ID": employee.companyId || "",
      Company: companyById.get(employee.companyId)?.name || "",
      "Employee ID": employee.employeeId || "",
      Employee: employee.name || "",
      Month: month,
      "Employment Status": employee.status || "",
      "Salary Type": employee.salaryType || "",
      "Monthly Salary": Number(employee.monthlySalary || 0),
      "Present Days": salary.counts.present,
      "Absent Days": salary.counts.absent,
      "Half Days": salary.counts.halfDay,
      "Paid Leaves": salary.counts.paidLeave,
      "Payable Days": salary.payableDays,
      "Overtime Amount": salary.overtimeAmount,
      Deductions: salary.deductions,
      Advances: salary.advances,
      "Earned Salary": salary.earnedSalary,
      "Final Payable": salary.finalPayable,
      Received: salary.received,
      Remaining: salary.remaining,
      "Payment Status": salary.status,
    };
  });

  const overviewRows = [
    { Item: "Company", Value: data.company?.name || "" },
    { Item: "Exported on", Value: new Date() },
    { Item: "Payroll month", Value: month },
    ...moduleOrder.map((collection) => ({ Item: modules[collection]?.title || collection, Value: (data[collection] || []).length })),
    ...Object.entries(workCollectionLabels).map(([collection, label]) => ({ Item: label, Value: (data[collection] || []).length })),
    { Item: "Monthly salary rows", Value: monthlyPayroll.length },
  ];
  appendTableSheet(workbook, { name: "Overview", rows: overviewRows, fields: ["Item", "Value"] });

  appendTableSheet(workbook, {
    name: "Monthly Salary",
    rows: monthlyPayroll,
    fields: Object.keys(monthlyPayroll[0] || {
      "Company ID": "", Company: "", "Employee ID": "", Employee: "", Month: "", "Employment Status": "", "Salary Type": "", "Monthly Salary": 0,
      "Present Days": 0, "Absent Days": 0, "Half Days": 0, "Paid Leaves": 0, "Payable Days": 0, "Overtime Amount": 0,
      Deductions: 0, Advances: 0, "Earned Salary": 0, "Final Payable": 0, Received: 0, Remaining: 0, "Payment Status": "",
    }),
  });

  const companySummary = (data.workCompanies || []).map((company) => {
    const rows = monthlyPayroll.filter((row) => row["Company ID"] === company.id);
    return {
      "Company ID": company.id,
      Company: company.name,
      Month: month,
      "Employee Count": rows.length,
      "Monthly Salary": rows.reduce((total, row) => total + row["Monthly Salary"], 0),
      Earned: rows.reduce((total, row) => total + row["Earned Salary"], 0),
      Received: rows.reduce((total, row) => total + row.Received, 0),
      Pending: rows.reduce((total, row) => total + row.Remaining, 0),
    };
  });
  appendTableSheet(workbook, { name: "Company Salary Summary", rows: companySummary, fields: ["Company ID", "Company", "Month", "Employee Count", "Monthly Salary", "Earned", "Received", "Pending"] });

  appendTableSheet(workbook, { name: "Company Profile", rows: [data.company || {}], fields: ["name", "email", "phone", "address", "logo"] });
  appendTableSheet(workbook, { name: "Preferences", rows: [data.preferences || {}, data.workPreferences || {}], fields: ["theme", "profileName", "notifications", "selectedCompanyId", "selectedMonth", "overtimeMultiplier"] });

  const collections = [...moduleOrder, ...Object.keys(workCollectionLabels)];
  collections.forEach((collection) => {
    const rows = relatedWorkRows(data, collection);
    const fields = collection.startsWith("work")
      ? workCollectionFields[collection] || []
      : ["id", "createdAt", ...(modules[collection]?.fields || []).map((field) => field.name)];
    appendTableSheet(workbook, {
      name: modules[collection]?.title || workCollectionLabels[collection] || collection,
      rows,
      fields,
    });
  });

  return workbook;
}

export async function downloadManagementWorkbook(data) {
  const workbook = await buildManagementWorkbook(data);
  const buffer = await workbook.xlsx.writeBuffer();
  const href = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = href;
  link.download = `orbit-company-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
