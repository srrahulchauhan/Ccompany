import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { usePersonalAccounts } from "../PersonalAccountsContext";
import { Button, EmptyState, exportCsv, formatCurrency, formatDate, PageHeading, RecordModal, SearchBox, Table } from "../components/PersonalUI";

export default function PersonalLedger({ type }) {
  const { data, add, update, remove } = usePersonalAccounts();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [method, setMethod] = useState("All methods");
  const [period, setPeriod] = useState("This month");
  const [modal, setModal] = useState(null);
  const isExpense = type === "expense";
  const records = data.transactions.filter((item) => item.type === type);
  const visible = useMemo(() => records.filter((item) => {
    const text = `${item.title} ${item.category} ${item.description} ${item.notes}`.toLowerCase();
    const date = String(item.date || "");
    const inPeriod = period === "All time" || (period === "This month" && date.slice(0, 7) === new Date().toISOString().slice(0, 7)) || (period === "This year" && date.slice(0, 4) === String(new Date().getFullYear()));
    return (!query || text.includes(query.toLowerCase())) && (category === "All categories" || item.category === category) && (method === "All methods" || item.method === method) && inPeriod;
  }).sort((a, b) => String(b.date).localeCompare(String(a.date))), [records, query, category, method, period]);
  const accountName = (id) => data.accounts.find((account) => account.id === id)?.nickname || data.accounts.find((account) => account.id === id)?.bankName || "Cash / unassigned";
  const categoryChoices = isExpense ? data.categories.expenses : data.categories.income;
  const total = visible.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const save = (values) => {
    if (modal?.id) update("transactions", modal.id, { ...values, type });
    else add("transactions", { ...values, type });
    toast.success(`${isExpense ? "Expense" : "Income"} ${modal?.id ? "updated" : "added"}.`);
    setModal(null);
  };
  const deleteRecord = (record) => {
    if (!window.confirm(`Delete “${record.title}” for ${formatCurrency(record.amount, data.profile.currency)}? This will recalculate account balances.`)) return;
    try { remove("transactions", record.id); toast.success("Transaction deleted."); }
    catch (error) { toast.error(error.message); }
  };
  const exportRows = visible.map((item) => [item.title, item.category, item.amount, item.method, accountName(item.accountId), item.date, item.description || ""]);
  const fields = [
    { name: "title", label: isExpense ? "Expense title" : "Income title", required: true },
    { name: "amount", label: "Amount", type: "number", min: 0.01, required: true },
    { name: "category", label: "Category", type: "select", required: true, options: categoryChoices.map((item) => ({ value: item, label: item })) },
    { name: "method", label: "Payment method", type: "select", options: [{ value: "", label: "Select a method" }, ...data.categories.methods.map((item) => ({ value: item, label: item }))] },
    { name: "accountId", label: "Bank account / cash wallet", type: "select", options: [{ value: "", label: "Cash / not linked" }, ...data.accounts.map((item) => ({ value: item.id, label: item.nickname || item.bankName }))] },
    { name: "date", label: isExpense ? "Expense date" : "Received date", type: "date", required: true },
    { name: "description", label: "Description", type: "textarea", wide: true },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
  ];
  return <div className="pa-page">
    <PageHeading eyebrow={isExpense ? "SPENDING TRACKER" : "MONEY IN"} title={isExpense ? "Daily expenses" : "Income"} subtitle={isExpense ? "Track every purchase and understand your spending habits." : "Keep every income source in one clear, searchable place."} action={<><Button variant="soft" icon={Download} onClick={() => exportCsv(`${type}-records-${new Date().toISOString().slice(0, 10)}.csv`, ["Title", "Category", "Amount", "Payment method", "Account", "Date", "Description"], exportRows)}>Export CSV</Button><Button icon={Plus} onClick={() => setModal({})}>Add {isExpense ? "expense" : "income"}</Button></>} />
    <div className="pa-ledger-summary"><span><small>{isExpense ? "Total expenses" : "Total income"} · {period.toLowerCase()}</small><b>{formatCurrency(total, data.profile.currency)}</b><em>{visible.length} {visible.length === 1 ? "transaction" : "transactions"}</em></span><div className={`pa-ledger-symbol ${isExpense ? "pa-expense-symbol" : "pa-income-symbol"}`}>{isExpense ? "−" : "+"}</div></div>
    <section className="pa-panel pa-list-panel">
      <div className="pa-list-toolbar"><SearchBox value={query} onChange={setQuery} placeholder={`Search ${isExpense ? "expenses" : "income"}...`} /><div className="pa-filter-group">
        <select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Filter by period"><option>This month</option><option>This year</option><option>All time</option></select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option>All categories</option>{categoryChoices.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={method} onChange={(event) => setMethod(event.target.value)} aria-label="Filter by payment method"><option>All methods</option>{data.categories.methods.map((item) => <option key={item}>{item}</option>)}</select>
      </div></div>
      <Table columns={[{ key: "transaction", label: "Transaction" }, { key: "category", label: "Category" }, { key: "date", label: "Date" }, { key: "method", label: "Payment method" }, { key: "account", label: "Account" }, { key: "amount", label: "Amount" }, { key: "actions", label: "" }]} rows={visible} empty={<EmptyState title={`No ${isExpense ? "expenses" : "income"} found`} description={query || category !== "All categories" ? "Try changing the search or filters." : "Add a record to start building your financial history."} action={<Button icon={Plus} onClick={() => setModal({})}>Add {isExpense ? "expense" : "income"}</Button>} />} renderRow={(item) => <tr key={item.id}>
        <td><div className="pa-table-primary"><b>{item.title}</b><small>{item.description || item.notes || "—"}</small></div></td><td><span className="pa-tag">{item.category}</span></td><td>{formatDate(item.date)}</td><td>{item.method || "—"}</td><td>{accountName(item.accountId)}</td><td><b className={isExpense ? "pa-amount-text" : "pa-positive-text"}>{isExpense ? "−" : "+"}{formatCurrency(item.amount, data.profile.currency)}</b></td><td><div className="pa-row-actions"><button title="Edit transaction" aria-label="Edit transaction" onClick={() => setModal(item)}><Pencil size={15} /></button><button title="Delete transaction" aria-label="Delete transaction" onClick={() => deleteRecord(item)}><Trash2 size={15} /></button></div></td>
      </tr>} />
    </section>
    {modal && <RecordModal title={`${modal.id ? "Edit" : "Add"} ${isExpense ? "expense" : "income"}`} description="The account balance and dashboard totals update automatically." fields={fields} initial={modal} submitLabel={modal.id ? "Save changes" : `Add ${isExpense ? "expense" : "income"}`} onClose={() => setModal(null)} onSubmit={save} />}
  </div>;
}
