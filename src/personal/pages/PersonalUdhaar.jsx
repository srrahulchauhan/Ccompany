import { useMemo, useState } from "react";
import { HandCoins, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getUdhaarPaid, getUdhaarRemaining, usePersonalAccounts } from "../PersonalAccountsContext";
import { Button, EmptyState, formatCurrency, formatDate, PageHeading, RecordModal, SearchBox, Table } from "../components/PersonalUI";

export default function PersonalUdhaar() {
  const { data, add, update, remove, addUdhaarRepayment } = usePersonalAccounts();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [modal, setModal] = useState(null);
  const [repay, setRepay] = useState(null);
  const rows = useMemo(() => data.udhaar.filter((item) => (kind === "all" || item.type === kind) &&
    (!query || `${item.person} ${item.mobile} ${item.description}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => String(b.givenDate || b.borrowedDate).localeCompare(String(a.givenDate || a.borrowedDate))), [data.udhaar, kind, query]);
  const given = data.udhaar.filter((item) => item.type === "given");
  const received = data.udhaar.filter((item) => item.type === "received");
  const remainingTotal = (list) => list.reduce((sum, item) => sum + getUdhaarRemaining(item), 0);
  const fields = [
    { name: "type", label: "Transaction type", type: "select", required: true, options: [{ value: "given", label: "Money given · collect back" }, { value: "received", label: "Money received · repay" }] },
    { name: "person", label: "Person name", required: true },
    { name: "mobile", label: "Mobile number", type: "tel" },
    { name: "amount", label: "Amount", type: "number", min: 0.01, required: true },
    { name: "accountId", label: "Bank account / cash wallet", type: "select", options: [{ value: "", label: "Cash / not linked" }, ...data.accounts.map((account) => ({ value: account.id, label: account.nickname || account.bankName }))] },
    { name: "givenDate", label: "Transaction date", type: "date", required: true },
    { name: "expectedReturnDate", label: "Expected return date", type: "date" },
    { name: "description", label: "Description", type: "textarea", wide: true },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
  ];
  const repayFields = [
    { name: "amount", label: "Repayment amount", type: "number", min: 0.01, required: true },
    { name: "date", label: "Payment date", type: "date", required: true },
    { name: "accountId", label: "Deposit / payment account", type: "select", options: [{ value: "", label: "Cash / not linked" }, ...data.accounts.map((account) => ({ value: account.id, label: account.nickname || account.bankName }))] },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
  ];
  const save = (values) => {
    const record = {
      ...values,
      type: values.type || modal?.type || "given",
      givenDate: values.givenDate,
      borrowedDate: values.givenDate,
    };
    if (modal?.id) update("udhaar", modal.id, record);
    else add("udhaar", record);
    toast.success(`Udhaar ${modal?.id ? "updated" : "recorded"}.`);
    setModal(null);
  };
  const submitRepayment = (values) => {
    addUdhaarRepayment(repay.id, values);
    toast.success("Repayment recorded and balance updated.");
    setRepay(null);
  };
  const deleteRecord = (record) => {
    if (!window.confirm(`Delete the Udhaar record for ${record.person}? Its repayment history will also be removed.`)) return;
    remove("udhaar", record.id);
    toast.success("Udhaar record deleted.");
  };
  const statusOf = (item) => getUdhaarRemaining(item) === 0 ? "Paid" : item.expectedReturnDate && item.expectedReturnDate < new Date().toISOString().slice(0, 10) ? "Overdue" : getUdhaarPaid(item) > 0 ? "Partial" : "Pending";
  const accountName = (id) => data.accounts.find((account) => account.id === id)?.nickname || data.accounts.find((account) => account.id === id)?.bankName || "Cash";
  return <div className="pa-page">
    <PageHeading eyebrow="PERSONAL LENDING & BORROWING" title="Udhaar khata" subtitle="Keep money you gave and borrowed separate, with clear remaining balances and repayments." action={<Button icon={Plus} onClick={() => setModal({})}>Add transaction</Button>} />
    <div className="pa-summary-grid pa-summary-three">
      <div className="pa-summary-card"><span className="pa-summary-icon pa-tone-sky"><HandCoins size={18} /></span><small>Still to collect</small><b>{formatCurrency(remainingTotal(given), data.profile.currency)}</b><em>Money you gave</em></div>
      <div className="pa-summary-card"><span className="pa-summary-icon pa-tone-pink"><RotateCcw size={18} /></span><small>Still to repay</small><b>{formatCurrency(remainingTotal(received), data.profile.currency)}</b><em>Money you borrowed</em></div>
      <div className="pa-summary-card"><span className="pa-summary-icon pa-tone-yellow"><HandCoins size={18} /></span><small>Total outstanding</small><b>{formatCurrency(remainingTotal(data.udhaar), data.profile.currency)}</b><em>Across all people</em></div>
    </div>
    <section className="pa-panel pa-list-panel">
      <div className="pa-list-toolbar"><SearchBox value={query} onChange={setQuery} placeholder="Search by person or notes..." /><div className="pa-filter-group"><select value={kind} onChange={(event) => setKind(event.target.value)} aria-label="Filter Udhaar"><option value="all">All transactions</option><option value="given">Money given</option><option value="received">Money received</option></select></div></div>
      <Table columns={[{ key: "person", label: "Person" }, { key: "type", label: "Direction" }, { key: "date", label: "Date / due" }, { key: "amount", label: "Amount" }, { key: "paid", label: "Paid" }, { key: "remaining", label: "Remaining" }, { key: "status", label: "Status" }, { key: "actions", label: "" }]} rows={rows} empty={<EmptyState icon={HandCoins} title="No Udhaar records" description="Record money given or borrowed to track each balance." action={<Button icon={Plus} onClick={() => setModal({})}>Add Udhaar</Button>} />} renderRow={(item) => {
        const remaining = getUdhaarRemaining(item);
        const status = statusOf(item);
        const date = item.givenDate || item.borrowedDate;
        return <tr key={item.id}>
          <td><div className="pa-table-primary"><b>{item.person}</b><small>{item.mobile || item.description || "No phone added"}</small></div></td>
          <td><span className={`pa-tag ${item.type === "given" ? "pa-tag-sky" : "pa-tag-pink"}`}>{item.type === "given" ? "You gave" : "You borrowed"}</span></td>
          <td><div className="pa-table-primary"><b>{formatDate(date)}</b><small>Due {formatDate(item.expectedReturnDate)}</small></div></td>
          <td>{formatCurrency(item.amount, data.profile.currency)}</td><td>{formatCurrency(getUdhaarPaid(item), data.profile.currency)}</td><td><b>{formatCurrency(remaining, data.profile.currency)}</b></td>
          <td><span className={`pa-status-pill pa-status-${status.toLowerCase()}`}>{status}</span></td>
          <td><div className="pa-row-actions"><button title="Record repayment" aria-label="Record repayment" disabled={!remaining} onClick={() => setRepay(item)}><RotateCcw size={15} /></button><button title="Edit Udhaar" aria-label="Edit Udhaar" onClick={() => setModal(item)}><Pencil size={15} /></button><button title="Delete Udhaar" aria-label="Delete Udhaar" onClick={() => deleteRecord(item)}><Trash2 size={15} /></button></div>
            {item.repayments?.length > 0 && <details className="pa-history-details"><summary>History ({item.repayments.length})</summary>{item.repayments.map((payment) => <div key={payment.id}><span>{formatDate(payment.date)} · {accountName(payment.accountId)}</span><b>{formatCurrency(payment.amount, data.profile.currency)}</b></div>)}</details>}
          </td>
        </tr>;
      }} />
    </section>
    {modal && <RecordModal title={`${modal.id ? "Edit" : "Add"} Udhaar`} description="Record the original amount. Partial and full repayments are tracked separately." fields={fields} initial={modal} submitLabel={modal.id ? "Save changes" : "Add record"} onClose={() => setModal(null)} onSubmit={save} />}
    {repay && <RecordModal title={`Record repayment · ${repay.person}`} description={`Remaining balance: ${formatCurrency(getUdhaarRemaining(repay), data.profile.currency)}`} fields={repayFields} initial={{ amount: "", accountId: repay.accountId || "" }} submitLabel="Save repayment" onClose={() => setRepay(null)} onSubmit={submitRepayment} />}
  </div>;
}
