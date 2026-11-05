import { getAccountBalances, getCustomerBalance, getLoanRemaining, getUdhaarRemaining } from "./PersonalAccountsContext";
import { today } from "./components/PersonalUI";

const asDate = (value) => new Date(`${String(value || "").slice(0, 10)}T12:00:00`);
const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function getRange(period, reference = new Date()) {
  const end = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const start = new Date(end);
  if (period === "Today") return { start: dateValue(start), end: dateValue(end) };
  if (period === "This week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return { start: dateValue(start), end: dateValue(end) };
  }
  if (period === "This year") {
    start.setMonth(0, 1);
    return { start: dateValue(start), end: dateValue(end) };
  }
  start.setDate(1);
  return { start: dateValue(start), end: dateValue(end) };
}

export const isInRange = (value, range) => String(value || "").slice(0, 10) >= range.start && String(value || "").slice(0, 10) <= range.end;

export function getUpcomingPayments(data, reference = new Date()) {
  const referenceDate = dateValue(reference);
  const dues = [];
  (data.reminders || []).filter((item) => item.status !== "Completed").forEach((reminder) => {
    dues.push({
      id: reminder.id, title: reminder.title, person: reminder.person || reminder.category || "Reminder",
      dueDate: reminder.dueDate, amount: Number(reminder.amount || 0), kind: "Reminder", status: reminder.dueDate < referenceDate ? "Overdue" : reminder.dueDate === referenceDate ? "Due today" : "Upcoming",
    });
  });
  (data.udhaar || []).filter((item) => getUdhaarRemaining(item) > 0 && item.expectedReturnDate).forEach((debt) => {
    dues.push({
      id: debt.id, title: debt.type === "given" ? `Collect from ${debt.person}` : `Repay ${debt.person}`,
      person: debt.person, dueDate: debt.expectedReturnDate, amount: getUdhaarRemaining(debt), kind: "Udhaar",
      status: debt.expectedReturnDate < referenceDate ? "Overdue" : debt.expectedReturnDate === referenceDate ? "Due today" : "Upcoming",
    });
  });
  (data.loans || []).filter((loan) => getLoanRemaining(data, loan) > 0).forEach((loan) => {
    const now = new Date(reference);
    let year = now.getFullYear();
    let month = now.getMonth();
    const dueDay = Math.min(31, Math.max(1, Number(loan.dueDay || 1)));
    let dueDate = new Date(year, month, Math.min(dueDay, new Date(year, month + 1, 0).getDate()));
    const isPaidThisMonth = data.emiPayments.some((payment) => payment.loanId === loan.id && payment.month === `${year}-${String(month + 1).padStart(2, "0")}` && payment.status !== "Partial");
    if (dueDate < now || isPaidThisMonth) {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
      dueDate = new Date(year, month, Math.min(dueDay, new Date(year, month + 1, 0).getDate()));
    }
    const due = dateValue(dueDate);
    dues.push({
      id: `loan-${loan.id}`, title: `${loan.name} EMI`, person: loan.lender || "Loan",
      dueDate: due, amount: Number(loan.emiAmount || 0), kind: "EMI",
      status: due < referenceDate ? "Overdue" : due === referenceDate ? "Due today" : "Upcoming",
    });
  });
  (data.customers || []).forEach((customer) => {
    const balance = getCustomerBalance(data, customer.id);
    const lastInvoice = data.customerEntries.filter((entry) => entry.customerId === customer.id && entry.type === "invoice" && entry.dueDate && balance > 0).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
    if (lastInvoice) dues.push({
      id: `customer-${customer.id}`, title: `Payment from ${customer.name}`, person: customer.name,
      dueDate: lastInvoice.dueDate, amount: balance, kind: "Customer", status: lastInvoice.dueDate < referenceDate ? "Overdue" : lastInvoice.dueDate === referenceDate ? "Due today" : "Upcoming",
    });
  });
  return dues.filter((item) => item.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getCurrentBalances(data) {
  return getAccountBalances(data).reduce((sum, account) => sum + account.currentBalance, 0);
}

export const getMonthTransactions = (data, month) => (data.transactions || []).filter((transaction) => transaction.date?.slice(0, 7) === month);

export function getMonthOverview(data, month) {
  const transactions = getMonthTransactions(data, month);
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return { month, income, expenses, savings: income - expenses };
}

export function getLoanPaymentDate(loan, reference = new Date()) {
  const dueDay = Math.min(31, Math.max(1, Number(loan.dueDay || 1)));
  const date = new Date(reference.getFullYear(), reference.getMonth(), Math.min(dueDay, new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate()));
  return dateValue(date);
}
