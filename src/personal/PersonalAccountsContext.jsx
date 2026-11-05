import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "orbit-personal-accounts-v1";
const COLLECTIONS = ["accounts", "transactions", "udhaar", "loans", "emiPayments", "customers", "customerEntries", "bankOperations", "reminders"];
const createEmptyData = () => ({
  profile: { name: "My Accounts", currency: "INR", dateFormat: "DD MMM YYYY", theme: "light" },
  categories: {
    expenses: ["Food", "Travel", "Rent", "Shopping", "Electricity", "Mobile Recharge", "Internet", "Medical", "Education", "Entertainment", "Other"],
    income: ["Salary", "Business", "Freelance", "Investment", "Gift", "Other"],
    methods: ["UPI", "Cash", "Bank Transfer", "Debit Card", "Credit Card", "Cheque", "Other"],
  },
  ...Object.fromEntries(COLLECTIONS.map((collection) => [collection, []])),
});

const makeId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const amountOf = (value) => Number(value || 0);

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createEmptyData();
    const parsed = JSON.parse(saved);
    const empty = createEmptyData();
    return {
      ...empty,
      ...parsed,
      profile: { ...empty.profile, ...parsed.profile },
      categories: {
        expenses: Array.isArray(parsed.categories?.expenses) ? parsed.categories.expenses : empty.categories.expenses,
        income: Array.isArray(parsed.categories?.income) ? parsed.categories.income : empty.categories.income,
        methods: Array.isArray(parsed.categories?.methods) ? parsed.categories.methods : empty.categories.methods,
      },
      ...Object.fromEntries(COLLECTIONS.map((collection) => [collection, Array.isArray(parsed[collection]) ? parsed[collection] : []])),
    };
  } catch (error) {
    console.error("Could not load personal account data.", error);
    return createEmptyData();
  }
}

export function PersonalAccountsProvider({ children }) {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save personal account data.", error);
    }
  }, [data]);

  const actions = useMemo(() => ({
    add: (collection, values) => {
      if (!COLLECTIONS.includes(collection)) throw new Error("Unsupported record type.");
      const current = data[collection];
      const amount = amountOf(values.amount ?? values.openingBalance ?? values.loanAmount);
      if (["transactions", "udhaar", "loans", "emiPayments", "customerEntries", "bankOperations"].includes(collection) && amount <= 0) {
        throw new Error("Amount must be greater than zero.");
      }
      if (collection === "accounts" && amount < 0) throw new Error("Opening balance cannot be negative.");
      if (collection === "emiPayments") {
        const loan = data.loans.find((item) => item.id === values.loanId);
        if (!loan) throw new Error("Choose a valid loan for this payment.");
        const duplicatePaidMonth = data.emiPayments.some((item) => item.loanId === values.loanId && item.month === values.month && item.status !== "Partial");
        if (duplicatePaidMonth) throw new Error("A completed payment is already recorded for this loan and month.");
        const paidPrincipal = data.emiPayments.filter((item) => item.loanId === loan.id).reduce((sum, item) => sum + amountOf(item.principalAmount ?? item.amount), 0);
        if (amountOf(values.principalAmount ?? values.amount) > Math.max(0, amountOf(loan.amount) - paidPrincipal)) {
          throw new Error("Principal payment cannot exceed the remaining loan balance.");
        }
      }
      const record = { ...values, id: makeId(collection.slice(0, 3)), createdAt: new Date().toISOString() };
      setData((previous) => ({ ...previous, [collection]: [...previous[collection], record] }));
      return record;
    },
    update: (collection, recordId, values) => {
      if (!COLLECTIONS.includes(collection)) throw new Error("Unsupported record type.");
      if (["transactions", "udhaar", "emiPayments", "customerEntries"].includes(collection) && values.amount !== undefined && amountOf(values.amount) <= 0) {
        throw new Error("Amount must be greater than zero.");
      }
      setData((previous) => ({
        ...previous,
        [collection]: previous[collection].map((item) => item.id === recordId ? { ...item, ...values, id: item.id, updatedAt: new Date().toISOString() } : item),
      }));
    },
    remove: (collection, recordId) => {
      if (!COLLECTIONS.includes(collection)) throw new Error("Unsupported record type.");
      const hasReferences = collection === "accounts" && (
        data.transactions.some((item) => item.accountId === recordId) ||
        data.udhaar.some((item) => item.accountId === recordId || item.repayments?.some((payment) => payment.accountId === recordId)) ||
        data.emiPayments.some((item) => item.accountId === recordId) ||
        data.customerEntries.some((item) => item.accountId === recordId) ||
        data.bankOperations.some((item) => item.accountId === recordId || item.fromAccountId === recordId || item.toAccountId === recordId)
      );
      if (hasReferences) throw new Error("This account has transaction history. Keep it or remove its linked records first.");
      if (collection === "loans" && data.emiPayments.some((item) => item.loanId === recordId)) throw new Error("This loan has payment history. Keep it to preserve the records.");
      if (collection === "customers" && data.customerEntries.some((item) => item.customerId === recordId)) throw new Error("This customer has transaction history. Keep the customer to preserve the records.");
      setData((previous) => ({ ...previous, [collection]: previous[collection].filter((item) => item.id !== recordId) }));
    },
    addUdhaarRepayment: (udhaarId, payment) => {
      const debt = data.udhaar.find((item) => item.id === udhaarId);
      if (!debt) throw new Error("Udhaar record not found.");
      const paid = (debt.repayments || []).reduce((sum, item) => sum + amountOf(item.amount), 0);
      if (amountOf(payment.amount) <= 0 || amountOf(payment.amount) > amountOf(debt.amount) - paid) throw new Error("Enter a repayment within the remaining balance.");
      const repayment = { ...payment, id: makeId("rep"), createdAt: new Date().toISOString() };
      setData((previous) => ({ ...previous, udhaar: previous.udhaar.map((item) => item.id === udhaarId ? { ...item, repayments: [...(item.repayments || []), repayment] } : item) }));
      return repayment;
    },
    addCustomerEntry: (entry) => {
      if (!data.customers.some((item) => item.id === entry.customerId)) throw new Error("Choose a valid customer.");
      if (amountOf(entry.amount) <= 0) throw new Error("Amount must be greater than zero.");
      const record = { ...entry, id: makeId("centry"), createdAt: new Date().toISOString() };
      setData((previous) => ({ ...previous, customerEntries: [...previous.customerEntries, record] }));
      return record;
    },
    updateProfile: (profile) => setData((previous) => ({ ...previous, profile: { ...previous.profile, ...profile } })),
    updateCategories: (categories) => setData((previous) => ({ ...previous, categories: { ...previous.categories, ...categories } })),
    markReminder: (reminderId, status) => setData((previous) => ({ ...previous, reminders: previous.reminders.map((item) => item.id === reminderId ? { ...item, status } : item) })),
    replaceAll: (replacement) => {
      if (!replacement || typeof replacement !== "object" || COLLECTIONS.some((collection) => !Array.isArray(replacement[collection]))) {
        throw new Error("This file is not a valid personal accounts backup.");
      }
      const empty = createEmptyData();
      setData({ ...empty, ...replacement, profile: { ...empty.profile, ...replacement.profile }, categories: { ...empty.categories, ...replacement.categories } });
    },
    clearAll: () => setData(createEmptyData()),
  }), [data]);

  const value = useMemo(() => ({ data, ...actions }), [data, actions]);
  return <PersonalAccountsContext.Provider value={value}>{children}</PersonalAccountsContext.Provider>;
}

const PersonalAccountsContext = createContext(null);

export function usePersonalAccounts() {
  const store = useContext(PersonalAccountsContext);
  if (!store) throw new Error("usePersonalAccounts must be used inside PersonalAccountsProvider.");
  return store;
}

export const getUdhaarPaid = (record) => (record.repayments || []).reduce((sum, payment) => sum + amountOf(payment.amount), 0);
export const getUdhaarRemaining = (record) => Math.max(0, amountOf(record.amount) - getUdhaarPaid(record));
export const getCustomerBalance = (data, customerId) => (data.customerEntries || [])
  .filter((entry) => entry.customerId === customerId)
  .reduce((balance, entry) => balance + (entry.type === "invoice" ? amountOf(entry.amount) : -amountOf(entry.amount)), 0);
export const getLoanPaid = (data, loanId) => (data.emiPayments || [])
  .filter((payment) => payment.loanId === loanId)
  .reduce((sum, payment) => sum + amountOf(payment.amount), 0);
export const getLoanRemaining = (data, loan) => Math.max(0, amountOf(loan.amount) - (data.emiPayments || [])
  .filter((payment) => payment.loanId === loan.id)
  .reduce((sum, payment) => sum + amountOf(payment.principalAmount ?? payment.amount), 0));

export function getAccountBalances(data) {
  const balanceMap = new Map((data.accounts || []).map((account) => [account.id, amountOf(account.openingBalance)]));
  const apply = (accountId, amount) => {
    if (accountId && balanceMap.has(accountId)) balanceMap.set(accountId, balanceMap.get(accountId) + amount);
  };
  (data.transactions || []).forEach((item) => apply(item.accountId, (item.type === "income" ? 1 : -1) * amountOf(item.amount)));
  (data.udhaar || []).forEach((item) => apply(item.accountId, (item.type === "given" ? -1 : 1) * amountOf(item.amount)));
  (data.udhaar || []).forEach((item) => (item.repayments || []).forEach((payment) => apply(payment.accountId, (item.type === "given" ? 1 : -1) * amountOf(payment.amount))));
  (data.loans || []).forEach((loan) => apply(loan.accountId, amountOf(loan.amount)));
  (data.emiPayments || []).forEach((payment) => apply(payment.accountId, -amountOf(payment.amount)));
  (data.customerEntries || []).filter((entry) => entry.type === "payment").forEach((entry) => apply(entry.accountId, amountOf(entry.amount)));
  (data.bankOperations || []).forEach((operation) => {
    if (operation.type === "deposit") apply(operation.accountId, amountOf(operation.amount));
    if (operation.type === "withdrawal") apply(operation.accountId, -amountOf(operation.amount));
    if (operation.type === "transfer") {
      apply(operation.fromAccountId, -amountOf(operation.amount));
      apply(operation.toAccountId, amountOf(operation.amount));
    }
  });
  return (data.accounts || []).map((account) => ({ ...account, currentBalance: balanceMap.get(account.id) ?? 0 }));
}
