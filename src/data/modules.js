export const navigation = [
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Companies", path: "/companies", icon: "Building" },
  { label: "Company employees", path: "/work-employees", icon: "UserRoundCog" },
  { label: "Company attendance", path: "/company-attendance", icon: "CalendarDays" },
  { label: "Company salary", path: "/company-salary", icon: "WalletCards" },
  { label: "Work reports", path: "/work-reports", icon: "ChartNoAxesCombined" },
  { label: "Employees", path: "/employees", icon: "Users" },
  { label: "Attendance", path: "/attendance", icon: "CalendarCheck" },
  { label: "Salary & Payroll", path: "/payroll", icon: "Wallet" },
  { label: "Leave Management", path: "/leaves", icon: "CalendarDays" },
  { label: "Projects", path: "/projects", icon: "BriefcaseBusiness" },
  { label: "Tasks", path: "/tasks", icon: "ListTodo" },
  { label: "Clients", path: "/clients", icon: "Handshake" },
  { label: "Finance", path: "/finance", icon: "ChartNoAxesCombined" },
  { label: "Inventory", path: "/inventory", icon: "Boxes" },
  { label: "Meetings", path: "/meetings", icon: "Video" },
  { label: "Reports", path: "/reports", icon: "ChartPie" },
  { label: "Notifications", path: "/notifications", icon: "Bell" },
  { label: "Settings", path: "/settings", icon: "Settings2" },
];

const employeeOptions = [{ value: "", label: "Unassigned" }];
const select = (options) => options.map((value) => ({ value, label: value }));
const employeeField = { name: "employee", label: "Employee", type: "select", options: employeeOptions };

export const modules = {
  employees: {
    title: "Employees", singular: "employee", subtitle: "Manage your people, profiles, and employment details.", search: ["name", "email", "employeeId"],
    fields: [
      { name: "photo", label: "Photo URL", type: "url" }, { name: "name", label: "Full name", required: true },
      { name: "email", label: "Email address", type: "email", required: true }, { name: "phone", label: "Phone number", type: "tel" },
      { name: "gender", label: "Gender", type: "select", options: select(["Female", "Male", "Non-binary", "Prefer not to say"]) },
      { name: "dateOfBirth", label: "Date of birth", type: "date" }, { name: "department", label: "Department", type: "select", options: select(["Engineering", "Design", "Marketing", "Human Resources", "Finance", "Operations", "Sales"]) },
      { name: "designation", label: "Designation" }, { name: "joiningDate", label: "Joining date", type: "date" },
      { name: "employmentType", label: "Employment type", type: "select", options: select(["Full-time", "Part-time", "Contract", "Intern"]) },
      { name: "salary", label: "Monthly salary (₹)", type: "number", min: 0 }, { name: "address", label: "Address", type: "textarea" },
      { name: "emergencyContact", label: "Emergency contact" }, { name: "status", label: "Status", type: "select", options: select(["Active", "On leave", "Inactive"]) },
    ],
    columns: [["employeeId", "Employee ID"], ["name", "Employee"], ["designation", "Designation"], ["department", "Department"], ["email", "Email"], ["status", "Status"]],
    defaults: { status: "Active", employmentType: "Full-time" },
  },
  hr: {
    title: "HR Management", singular: "HR record", subtitle: "Coordinate recruitment, interviews, candidate decisions, and employee documents.", search: ["name", "email", "role", "recordType"],
    fields: [
      { name: "recordType", label: "Record type", type: "select", options: select(["Job application", "Interview", "Employee document", "Activity history"]), required: true },
      { name: "name", label: "Candidate / employee name", required: true }, { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "tel" }, { name: "role", label: "Position / document name" },
      { name: "department", label: "Department" }, { name: "date", label: "Date / interview date", type: "date" },
      { name: "status", label: "Status", type: "select", options: select(["Applied", "Interview scheduled", "Selected", "Rejected", "Received", "Completed"]) },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [["recordType", "Record type"], ["name", "Name"], ["role", "Position / document"], ["date", "Date"], ["status", "Status"]],
    defaults: { status: "Applied", recordType: "Job application" },
  },
  departments: {
    title: "Departments", singular: "department", subtitle: "Organize teams, leadership, and department budgets.", search: ["name", "head"],
    fields: [
      { name: "name", label: "Department name", required: true }, { name: "head", label: "Department head" },
      { name: "description", label: "Description", type: "textarea" }, { name: "budget", label: "Annual budget (₹)", type: "number", min: 0 },
    ],
    columns: [["name", "Department"], ["head", "Department head"], ["description", "Description"], ["budget", "Budget"], ["employeeCount", "Team size"]],
  },
  attendance: {
    title: "Attendance", singular: "attendance record", subtitle: "Track daily presence, punctuality, and working hours.", search: ["employee", "date"],
    fields: [
      employeeField, { name: "date", label: "Date", type: "date", required: true },
      { name: "status", label: "Attendance status", type: "select", options: select(["Present", "Absent", "Half Day", "Late"]) },
      { name: "checkIn", label: "Check in", type: "time" }, { name: "checkOut", label: "Check out", type: "time" }, { name: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [["employee", "Employee"], ["date", "Date"], ["checkIn", "Check in"], ["checkOut", "Check out"], ["status", "Status"]],
    defaults: { status: "Present" },
  },
  payroll: {
    title: "Salary & Payroll", singular: "payroll record", subtitle: "Prepare monthly payroll, track payments, and preview salary slips.", search: ["employee", "month", "status"],
    fields: [
      employeeField, { name: "month", label: "Payroll month", type: "month", required: true },
      { name: "basic", label: "Basic salary (₹)", type: "number", min: 0 }, { name: "allowances", label: "Allowances (₹)", type: "number", min: 0 },
      { name: "bonus", label: "Bonus (₹)", type: "number", min: 0 }, { name: "deductions", label: "Deductions (₹)", type: "number", min: 0 },
      { name: "advance", label: "Advance salary (₹)", type: "number", min: 0 }, { name: "paymentDate", label: "Payment date", type: "date" },
      { name: "status", label: "Payment status", type: "select", options: select(["Pending", "Paid"]) },
    ],
    columns: [["employee", "Employee"], ["month", "Month"], ["basic", "Basic"], ["netSalary", "Net salary"], ["paymentDate", "Payment date"], ["status", "Status"]],
    defaults: { status: "Pending", allowances: 0, bonus: 0, deductions: 0, advance: 0 },
  },
  leaves: {
    title: "Leave Management", singular: "leave request", subtitle: "Review leave requests, balances, and approved time off.", search: ["employee", "leaveType", "status"],
    fields: [
      employeeField, { name: "leaveType", label: "Leave type", type: "select", options: select(["Annual", "Sick", "Personal", "Parental", "Unpaid"]) },
      { name: "startDate", label: "Start date", type: "date", required: true }, { name: "endDate", label: "End date", type: "date", required: true },
      { name: "days", label: "Total leave days", type: "number", min: 1, required: true }, { name: "reason", label: "Reason", type: "textarea" },
      { name: "status", label: "Request status", type: "select", options: select(["Pending", "Approved", "Rejected"]) },
    ],
    columns: [["employee", "Employee"], ["leaveType", "Leave type"], ["startDate", "Dates"], ["days", "Days"], ["leaveBalance", "Balance"], ["reason", "Reason"], ["status", "Status"]],
    defaults: { status: "Pending" },
  },
  projects: {
    title: "Projects", singular: "project", subtitle: "Manage delivery, client budgets, team assignments, and deadlines.", search: ["name", "client", "status"],
    fields: [
      { name: "name", label: "Project name", required: true }, { name: "client", label: "Client name" },
      { name: "description", label: "Description", type: "textarea" }, { name: "budget", label: "Project budget (₹)", type: "number", min: 0 },
      { name: "startDate", label: "Start date", type: "date" }, { name: "deadline", label: "Deadline", type: "date" },
      { name: "team", label: "Assigned employees (comma-separated)" }, { name: "progress", label: "Progress (%)", type: "number", min: 0, max: 100 },
      { name: "status", label: "Project status", type: "select", options: select(["Running", "Pending", "Completed", "On hold"]) },
    ],
    columns: [["name", "Project"], ["client", "Client"], ["team", "Team"], ["deadline", "Deadline"], ["progress", "Progress"], ["status", "Status"]],
    defaults: { status: "Running", progress: 0 },
  },
  tasks: {
    title: "Tasks", singular: "task", subtitle: "Assign owners, monitor priorities, and keep delivery on track.", search: ["title", "employee", "project", "status"],
    fields: [
      { name: "title", label: "Task title", required: true }, { name: "description", label: "Description", type: "textarea" },
      employeeField, { name: "project", label: "Related project" }, { name: "priority", label: "Priority", type: "select", options: select(["Low", "Medium", "High"]) },
      { name: "startDate", label: "Start date", type: "date" }, { name: "dueDate", label: "Due date", type: "date" },
      { name: "progress", label: "Progress (%)", type: "number", min: 0, max: 100 },
      { name: "status", label: "Task status", type: "select", options: select(["Pending", "In Progress", "Completed"]) },
    ],
    columns: [["title", "Task"], ["employee", "Assignee"], ["project", "Project"], ["priority", "Priority"], ["dueDate", "Due date"], ["status", "Status"]],
    defaults: { status: "Pending", priority: "Medium", progress: 0 },
  },
  clients: {
    title: "Clients", singular: "client", subtitle: "Keep client relationships, contact details, and project receivables together.", search: ["name", "company", "email"],
    fields: [
      { name: "name", label: "Client name", required: true }, { name: "company", label: "Company name" },
      { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone", type: "tel" },
      { name: "address", label: "Address", type: "textarea" }, { name: "projectValue", label: "Total project value (₹)", type: "number", min: 0 },
      { name: "paidAmount", label: "Paid amount (₹)", type: "number", min: 0 }, { name: "paymentHistory", label: "Payment history", type: "textarea" },
    ],
    columns: [["name", "Client"], ["company", "Company"], ["email", "Email"], ["projectValue", "Project value"], ["paidAmount", "Paid"], ["pendingAmount", "Pending"]],
    defaults: { projectValue: 0, paidAmount: 0 },
  },
  finance: {
    title: "Company Finance", singular: "transaction", subtitle: "Record income and expenses, and follow your company cash flow.", search: ["description", "category", "type"],
    fields: [
      { name: "type", label: "Transaction type", type: "select", options: select(["Income", "Expense"]), required: true },
      { name: "category", label: "Category", type: "select", options: select(["Services", "Product sales", "Office rent", "Electricity", "Internet", "Employee salary", "Office supplies", "Travel expenses", "Other"]) },
      { name: "amount", label: "Amount (₹)", type: "number", min: 0, required: true }, { name: "date", label: "Date", type: "date", required: true },
      { name: "paymentMethod", label: "Payment method", type: "select", options: select(["Bank transfer", "UPI", "Cash", "Card", "Cheque"]) },
      { name: "description", label: "Description", type: "textarea" }, { name: "status", label: "Payment status", type: "select", options: select(["Paid", "Pending"]) },
    ],
    columns: [["type", "Type"], ["category", "Category"], ["description", "Description"], ["date", "Date"], ["amount", "Amount"], ["status", "Status"]],
    defaults: { type: "Income", status: "Paid" },
  },
  inventory: {
    title: "Inventory", singular: "product", subtitle: "Monitor stock levels, unit pricing, and supplier information.", search: ["name", "productId", "category", "supplier"],
    fields: [
      { name: "name", label: "Product name", required: true }, { name: "productId", label: "Product ID" },
      { name: "category", label: "Category" }, { name: "quantity", label: "Quantity in stock", type: "number", min: 0, required: true },
      { name: "purchasePrice", label: "Purchase price (₹)", type: "number", min: 0 }, { name: "sellingPrice", label: "Selling price (₹)", type: "number", min: 0 },
      { name: "supplier", label: "Supplier" }, { name: "status", label: "Stock status", type: "select", options: select(["In stock", "Low stock", "Out of stock"]) },
      { name: "stockHistory", label: "Stock history", type: "textarea" },
    ],
    columns: [["productId", "Product ID"], ["name", "Product"], ["category", "Category"], ["quantity", "Quantity"], ["purchasePrice", "Purchase price"], ["supplier", "Supplier"], ["status", "Stock status"]],
    defaults: { quantity: 0, status: "In stock" },
  },
  meetings: {
    title: "Meetings", singular: "meeting", subtitle: "Schedule team and client meetings, agendas, and participants.", search: ["title", "location", "status"],
    fields: [
      { name: "title", label: "Meeting title", required: true }, { name: "date", label: "Meeting date", type: "date", required: true },
      { name: "time", label: "Meeting time", type: "time" }, { name: "location", label: "Meeting location" },
      { name: "participants", label: "Participants (comma-separated)" }, { name: "agenda", label: "Meeting agenda", type: "textarea" },
      { name: "status", label: "Meeting status", type: "select", options: select(["Scheduled", "Completed", "Cancelled"]) },
    ],
    columns: [["title", "Meeting"], ["date", "Date"], ["time", "Time"], ["location", "Location"], ["participants", "Participants"], ["status", "Status"]],
    defaults: { status: "Scheduled" },
  },
};

export const moduleOrder = Object.keys(modules);
