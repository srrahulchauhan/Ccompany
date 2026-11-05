import { dateKey, monthKey } from "../utils/date";

const date = (offset = 0) => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return dateKey(value);
};
const id = (prefix, number) => `${prefix}-${String(number).padStart(3, "0")}`;
const previousWorkday = (offset) => {
  const value = new Date();
  value.setDate(value.getDate() - offset);
  while (value.getDay() === 0 || value.getDay() === 6) value.setDate(value.getDate() - 1);
  return dateKey(value);
};

export const initialData = {
  workCompanies: [
    { id: "co-1", name: "Orbit Studio", logo: "", address: "72, 4th Main Road, Bengaluru", phone: "+91 80 4567 8900", email: "hello@orbit.co", joiningDate: date(-950), leaveDate: "", workType: "Office", salaryType: "Monthly", monthlySalary: 18000, paymentDay: 5, salaryCalculationMethod: "calendar-days", notes: "Design and product studio", active: true },
    { id: "co-2", name: "Northstar Services", logo: "", address: "18 Residency Road, Bengaluru", phone: "+91 80 4567 8911", email: "team@northstar.co", joiningDate: date(-620), leaveDate: "", workType: "Hybrid", salaryType: "Monthly", monthlySalary: 15000, paymentDay: 10, salaryCalculationMethod: "calendar-days", notes: "Operations and client delivery", active: true },
  ],
  workEmployees: [
    { id: "we-1", employeeId: "WEMP-1001", personKey: "person-1", companyId: "co-1", name: "Aarav Sharma", mobile: "+91 98765 11001", email: "aarav@orbit.co", department: "Operations", designation: "Studio Coordinator", joiningDate: date(-420), leaveDate: "", salaryType: "Monthly", monthlySalary: 18000, dailySalary: 800, hourlyRate: 120, workingDays: 26, status: "Active", historyLocked: false },
    { id: "we-2", employeeId: "WEMP-1002", personKey: "person-2", companyId: "co-1", name: "Meera Nair", mobile: "+91 98765 11002", email: "meera@orbit.co", department: "Design", designation: "Design Associate", joiningDate: date(-330), leaveDate: "", salaryType: "Monthly", monthlySalary: 24000, dailySalary: 1000, hourlyRate: 150, workingDays: 26, status: "Active", historyLocked: false },
    { id: "we-3", employeeId: "WEMP-1003", personKey: "person-3", companyId: "co-1", name: "Kabir Rao", mobile: "+91 98765 11003", email: "kabir@orbit.co", department: "Operations", designation: "Operations Assistant", joiningDate: date(-260), leaveDate: "", salaryType: "Daily", monthlySalary: 0, dailySalary: 850, hourlyRate: 110, workingDays: 26, status: "Active", historyLocked: false },
    { id: "we-4", employeeId: "WEMP-2001", personKey: "person-1", companyId: "co-2", name: "Aarav Sharma", mobile: "+91 98765 11001", email: "aarav@orbit.co", department: "Operations", designation: "Field Coordinator", joiningDate: date(-180), leaveDate: "", salaryType: "Monthly", monthlySalary: 15000, dailySalary: 700, hourlyRate: 100, workingDays: 26, status: "Active", historyLocked: false },
    { id: "we-5", employeeId: "WEMP-2002", personKey: "person-4", companyId: "co-2", name: "Ishita Das", mobile: "+91 98765 11004", email: "ishita@northstar.co", department: "Support", designation: "Support Executive", joiningDate: date(-210), leaveDate: "", salaryType: "Monthly", monthlySalary: 21000, dailySalary: 900, hourlyRate: 130, workingDays: 26, status: "Active", historyLocked: false },
  ],
  workAttendance: [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((offset) => ({ id: `wa-1-${offset}`, companyId: "co-1", employmentId: "we-1", date: previousWorkday(offset), status: offset === 8 ? "Paid Leave" : offset === 5 ? "Half Day" : "Present", hours: 8, overtimeHours: offset === 2 ? 1 : 0 })),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((offset) => ({ id: `wa-2-${offset}`, companyId: "co-1", employmentId: "we-2", date: previousWorkday(offset), status: offset === 7 ? "Absent" : "Present", hours: 8, overtimeHours: 0 })),
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((offset) => ({ id: `wa-3-${offset}`, companyId: "co-2", employmentId: "we-4", date: previousWorkday(offset), status: offset === 6 ? "Half Day" : "Present", hours: 8, overtimeHours: 0 })),
    ...[1, 2, 3, 4, 5, 6, 7].map((offset) => ({ id: `wa-4-${offset}`, companyId: "co-2", employmentId: "we-5", date: previousWorkday(offset), status: offset === 4 ? "Paid Leave" : "Present", hours: 8, overtimeHours: 1 })),
  ],
  workSalaryTransactions: [
    { id: "wst-1", companyId: "co-1", employmentId: "we-1", month: monthKey(), type: "payment", amount: 5000, date: date(-3), method: "UPI", note: "Salary part-payment" },
    { id: "wst-2", companyId: "co-1", employmentId: "we-2", month: monthKey(), type: "advance", amount: 2000, date: date(-5), method: "Bank transfer", note: "Festival advance" },
    { id: "wst-3", companyId: "co-2", employmentId: "we-4", month: monthKey(), type: "payment", amount: 4000, date: date(-2), method: "Cash", note: "Salary part-payment" },
  ],
  workPreferences: { selectedCompanyId: "all", selectedMonth: monthKey(), overtimeMultiplier: 1.5 },
  employees: [
    { id: id("emp", 1), employeeId: "EMP-1001", name: "Olivia Rhye", email: "olivia@orbit.co", phone: "+91 98765 43210", gender: "Female", dateOfBirth: "1993-04-12", department: "Design", designation: "Product Designer", joiningDate: "2022-03-14", employmentType: "Full-time", salary: 92000, address: "Indiranagar, Bengaluru", emergencyContact: "+91 90000 10001", status: "Active", photo: "https://i.pravatar.cc/80?img=47" },
    { id: id("emp", 2), employeeId: "EMP-1002", name: "Phoenix Baker", email: "phoenix@orbit.co", phone: "+91 98765 43211", gender: "Male", dateOfBirth: "1990-08-03", department: "Engineering", designation: "Engineering Lead", joiningDate: "2021-06-07", employmentType: "Full-time", salary: 145000, address: "Koramangala, Bengaluru", emergencyContact: "+91 90000 10002", status: "Active", photo: "https://i.pravatar.cc/80?img=12" },
    { id: id("emp", 3), employeeId: "EMP-1003", name: "Lana Steiner", email: "lana@orbit.co", phone: "+91 98765 43212", gender: "Female", dateOfBirth: "1995-01-21", department: "Marketing", designation: "Growth Manager", joiningDate: "2023-02-20", employmentType: "Full-time", salary: 88000, address: "Whitefield, Bengaluru", emergencyContact: "+91 90000 10003", status: "Active", photo: "https://i.pravatar.cc/80?img=44" },
    { id: id("emp", 4), employeeId: "EMP-1004", name: "Demi Wilkinson", email: "demi@orbit.co", phone: "+91 98765 43213", gender: "Female", dateOfBirth: "1992-11-07", department: "Human Resources", designation: "People Partner", joiningDate: "2022-09-05", employmentType: "Full-time", salary: 78000, address: "Jayanagar, Bengaluru", emergencyContact: "+91 90000 10004", status: "On leave", photo: "https://i.pravatar.cc/80?img=49" },
    { id: id("emp", 5), employeeId: "EMP-1005", name: "Candice Wu", email: "candice@orbit.co", phone: "+91 98765 43214", gender: "Female", dateOfBirth: "1991-05-19", department: "Finance", designation: "Finance Analyst", joiningDate: "2020-12-01", employmentType: "Full-time", salary: 96000, address: "HSR Layout, Bengaluru", emergencyContact: "+91 90000 10005", status: "Active", photo: "https://i.pravatar.cc/80?img=45" },
    { id: id("emp", 6), employeeId: "EMP-1006", name: "Natali Craig", email: "natali@orbit.co", phone: "+91 98765 43215", gender: "Female", dateOfBirth: "1994-02-15", department: "Sales", designation: "Account Executive", joiningDate: "2023-05-22", employmentType: "Full-time", salary: 82000, address: "Marathahalli, Bengaluru", emergencyContact: "+91 90000 10006", status: "Active", photo: "https://i.pravatar.cc/80?img=48" },
    { id: id("emp", 7), employeeId: "EMP-1007", name: "Drew Cano", email: "drew@orbit.co", phone: "+91 98765 43216", gender: "Male", dateOfBirth: "1989-09-30", department: "Operations", designation: "Operations Manager", joiningDate: "2020-04-13", employmentType: "Full-time", salary: 112000, address: "Malleshwaram, Bengaluru", emergencyContact: "+91 90000 10007", status: "Active", photo: "https://i.pravatar.cc/80?img=13" },
    { id: id("emp", 8), employeeId: "EMP-1008", name: "Andi Lane", email: "andi@orbit.co", phone: "+91 98765 43217", gender: "Non-binary", dateOfBirth: "1996-07-14", department: "Engineering", designation: "Frontend Developer", joiningDate: "2024-01-08", employmentType: "Full-time", salary: 105000, address: "BTM Layout, Bengaluru", emergencyContact: "+91 90000 10008", status: "Active", photo: "https://i.pravatar.cc/80?img=50" },
  ],
  departments: [
    { id: "dep-1", name: "Engineering", head: "Phoenix Baker", description: "Product engineering and platform", budget: 4800000 },
    { id: "dep-2", name: "Design", head: "Olivia Rhye", description: "Product design and research", budget: 1800000 },
    { id: "dep-3", name: "Marketing", head: "Lana Steiner", description: "Brand, growth, and communications", budget: 2100000 },
    { id: "dep-4", name: "Human Resources", head: "Demi Wilkinson", description: "People operations and hiring", budget: 1200000 },
    { id: "dep-5", name: "Finance", head: "Candice Wu", description: "Finance and compliance", budget: 1300000 },
    { id: "dep-6", name: "Sales", head: "Natali Craig", description: "Customer partnerships", budget: 1600000 },
    { id: "dep-7", name: "Operations", head: "Drew Cano", description: "Business operations", budget: 1500000 },
  ],
  attendance: [
    { id: "att-1", employee: "Olivia Rhye", date: date(0), checkIn: "09:02", checkOut: "18:04", status: "Present" },
    { id: "att-2", employee: "Phoenix Baker", date: date(0), checkIn: "09:28", checkOut: "18:12", status: "Late" },
    { id: "att-3", employee: "Lana Steiner", date: date(0), checkIn: "08:57", checkOut: "17:51", status: "Present" },
    { id: "att-4", employee: "Demi Wilkinson", date: date(0), checkIn: "", checkOut: "", status: "Absent" },
    { id: "att-5", employee: "Candice Wu", date: date(-1), checkIn: "09:05", checkOut: "18:09", status: "Present" },
  ],
  payroll: [
    { id: "pay-1", employee: "Olivia Rhye", month: monthKey(), basic: 92000, allowances: 8000, bonus: 5000, deductions: 2000, advance: 0, paymentDate: date(0), status: "Paid" },
    { id: "pay-2", employee: "Phoenix Baker", month: monthKey(), basic: 145000, allowances: 12000, bonus: 0, deductions: 3500, advance: 0, paymentDate: date(0), status: "Pending" },
    { id: "pay-3", employee: "Lana Steiner", month: monthKey(), basic: 88000, allowances: 7000, bonus: 3000, deductions: 1800, advance: 0, paymentDate: date(0), status: "Paid" },
  ],
  leaves: [
    { id: "lev-1", employee: "Demi Wilkinson", leaveType: "Annual", startDate: date(2), endDate: date(4), days: 3, reason: "Family trip", status: "Pending" },
    { id: "lev-2", employee: "Andi Lane", leaveType: "Sick", startDate: date(-8), endDate: date(-7), days: 2, reason: "Recovery", status: "Approved" },
    { id: "lev-3", employee: "Candice Wu", leaveType: "Personal", startDate: date(6), endDate: date(6), days: 1, reason: "Personal appointment", status: "Pending" },
  ],
  projects: [
    { id: "prj-1", name: "Website redesign", client: "Northstar Labs", description: "Refresh the customer-facing website and design system.", budget: 1250000, startDate: date(-45), deadline: date(18), team: "Olivia Rhye, Andi Lane", progress: 68, status: "Running" },
    { id: "prj-2", name: "Mobile app launch", client: "Brightside", description: "Launch a new mobile experience for customers.", budget: 2100000, startDate: date(-75), deadline: date(35), team: "Phoenix Baker, Andi Lane", progress: 42, status: "Running" },
    { id: "prj-3", name: "Brand refresh", client: "Northstar Labs", description: "Brand identity, content and launch campaign.", budget: 680000, startDate: date(-90), deadline: date(-2), team: "Lana Steiner, Olivia Rhye", progress: 100, status: "Completed" },
  ],
  tasks: [
    { id: "tsk-1", title: "Finalize dashboard concepts", description: "Share final dashboard concepts with product.", employee: "Olivia Rhye", project: "Website redesign", priority: "High", startDate: date(-2), dueDate: date(1), progress: 78, status: "In Progress" },
    { id: "tsk-2", title: "Review API integration", description: "Validate integration checklist with platform.", employee: "Phoenix Baker", project: "Mobile app launch", priority: "Medium", startDate: date(-4), dueDate: date(3), progress: 45, status: "In Progress" },
    { id: "tsk-3", title: "Prepare monthly campaign", description: "Prepare paid and organic campaign assets.", employee: "Lana Steiner", project: "Brand refresh", priority: "Low", startDate: date(-3), dueDate: date(5), progress: 10, status: "Pending" },
  ],
  clients: [
    { id: "cli-1", name: "Maya Patel", company: "Northstar Labs", email: "maya@northstar.example", phone: "+91 98710 11111", address: "Bengaluru, India", projectValue: 1930000, paidAmount: 1250000, paymentHistory: "₹12,50,000 · 12 Oct" },
    { id: "cli-2", name: "Jordan Lee", company: "Brightside", email: "jordan@brightside.example", phone: "+91 98710 22222", address: "Mumbai, India", projectValue: 2100000, paidAmount: 840000, paymentHistory: "₹8,40,000 · 03 Nov" },
    { id: "cli-3", name: "Aarav Shah", company: "Monocle Studio", email: "aarav@monocle.example", phone: "+91 98710 33333", address: "Pune, India", projectValue: 760000, paidAmount: 760000, paymentHistory: "Paid in full" },
  ],
  finance: [
    { id: "fin-1", type: "Income", category: "Services", amount: 1250000, date: date(-7), paymentMethod: "Bank transfer", description: "Northstar project milestone", status: "Paid" },
    { id: "fin-2", type: "Income", category: "Services", amount: 840000, date: date(-14), paymentMethod: "Bank transfer", description: "Brightside project deposit", status: "Paid" },
    { id: "fin-3", type: "Expense", category: "Office rent", amount: 185000, date: date(-4), paymentMethod: "Bank transfer", description: "Bengaluru office · monthly rent", status: "Paid" },
    { id: "fin-4", type: "Expense", category: "Office supplies", amount: 42000, date: date(-2), paymentMethod: "Card", description: "Team equipment and supplies", status: "Paid" },
  ],
  inventory: [
    { id: "inv-1", productId: "INV-001", name: "MacBook Pro 14”", category: "Equipment", quantity: 12, purchasePrice: 155000, sellingPrice: 179000, supplier: "Apple India", status: "In stock" },
    { id: "inv-2", productId: "INV-002", name: "Wireless headset", category: "Accessories", quantity: 4, purchasePrice: 7500, sellingPrice: 9900, supplier: "Soundworks", status: "Low stock" },
    { id: "inv-3", productId: "INV-003", name: "Office chair", category: "Furniture", quantity: 18, purchasePrice: 12500, sellingPrice: 16900, supplier: "Ergo Space", status: "In stock" },
  ],
  meetings: [
    { id: "mtg-1", title: "Weekly leadership sync", date: date(1), time: "10:00", location: "Boardroom / Meet", participants: "Drew Cano, Candice Wu, Phoenix Baker", agenda: "Weekly business review and priorities", status: "Scheduled" },
    { id: "mtg-2", title: "Northstar project review", date: date(2), time: "14:30", location: "Google Meet", participants: "Olivia Rhye, Maya Patel", agenda: "Review progress and next milestone", status: "Scheduled" },
    { id: "mtg-3", title: "Design critique", date: date(3), time: "11:00", location: "Design studio", participants: "Olivia Rhye, Andi Lane", agenda: "Feedback on dashboard concepts", status: "Scheduled" },
  ],
  hr: [
    { id: "hr-1", recordType: "Job application", name: "Ananya Rao", email: "ananya@example.com", phone: "+91 98900 10101", role: "Product Designer", department: "Design", date: date(-1), status: "Applied", notes: "Portfolio received" },
    { id: "hr-2", recordType: "Interview", name: "Rohan Mehta", email: "rohan@example.com", phone: "+91 98900 10102", role: "Frontend Developer", department: "Engineering", date: date(2), status: "Interview scheduled", notes: "Technical round · 11:30 AM" },
    { id: "hr-3", recordType: "Employee document", name: "Olivia Rhye", role: "Employment agreement", department: "Design", date: date(-14), status: "Received", notes: "Signed agreement on file" },
  ],
  company: { name: "Orbit Company", address: "72, 4th Main Road, Bengaluru, Karnataka 560034", email: "hello@orbit.co", phone: "+91 80 4567 8900", logo: "" },
  preferences: { theme: "light", notifications: true, profileName: "Alex Morgan", notificationsReadAt: "" },
};
