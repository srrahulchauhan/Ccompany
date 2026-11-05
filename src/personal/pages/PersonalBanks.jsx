import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Banknote, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import { getAccountBalances, usePersonalAccounts } from "../PersonalAccountsContext";
import { Button, EmptyState, formatCurrency, formatDate, PageHeading, RecordModal, Table } from "../components/PersonalUI";

export default function PersonalBanks() {
  const { data, add, update, remove } = usePersonalAccounts();
  const [modal, setModal] = useState(null);
  const [movement, setMovement] = useState(null);
  const [transfer, setTransfer] = useState(false);
  const accounts = getAccountBalances(data);
  const balanceTotal = accounts.reduce((sum, account) => sum + account.currentBalance, 0);
  const operations = useMemo(() => [...data.bankOperations].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 25), [data.bankOperations]);
  const accountName = (id) => accounts.find((item) => item.id === id)?.nickname || accounts.find((item) => item.id === id)?.bankName || "—";
  const accountFields = [
    { name: "bankName", label: "Bank / wallet name", required: true },
    { name: "holderName", label: "Account holder", required: true },
    { name: "nickname", label: "Account nickname", required: true },
    { name: "type", label: "Account type", type: "select", required: true, options: ["Savings", "Current", "Cash wallet", "Other"].map((item) => ({ value: item, label: item })) },
    { name: "openingBalance", label: "Opening balance", type: "number", min: 0 },
    { name: "accountNumber", label: "Account number (optional)", placeholder: "•••• 1234" },
    { name: "ifsc", label: "IFSC (optional)" },
  ];
  const movementFields = [
    { name: "accountId", label: "Account", type: "select", required: true, options: accounts.map((item) => ({ value: item.id, label: `${item.nickname || item.bankName} · ${formatCurrency(item.currentBalance, data.profile.currency)}` })) },
    { name: "amount", label: "Amount", type: "number", min: 0.01, required: true },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "note", label: "Description", placeholder: movement?.type === "deposit" ? "Cash deposit" : "Cash withdrawal" },
  ];
  const transferFields = [
    { name: "fromAccountId", label: "From account", type: "select", required: true, options: accounts.map((item) => ({ value: item.id, label: item.nickname || item.bankName })) },
    { name: "toAccountId", label: "To account", type: "select", required: true, options: accounts.map((item) => ({ value: item.id, label: item.nickname || item.bankName })) },
    { name: "amount", label: "Transfer amount", type: "number", min: 0.01, required: true },
    { name: "date", label: "Transfer date", type: "date", required: true },
    { name: "note", label: "Note", wide: true },
  ];
  const submitAccount = (values) => {
    if (modal?.id) update("accounts", modal.id, values);
    else add("accounts", values);
    toast.success(`Account ${modal?.id ? "updated" : "added"}.`);
    setModal(null);
  };
  const submitMovement = (values) => {
    add("bankOperations", { ...values, type: movement.type });
    toast.success(movement.type === "deposit" ? "Deposit recorded." : "Withdrawal recorded.");
    setMovement(null);
  };
  const submitTransfer = (values) => {
    if (values.fromAccountId === values.toAccountId) throw new Error("Choose two different accounts.");
    const source = accounts.find((item) => item.id === values.fromAccountId);
    if (Number(values.amount) > (source?.currentBalance || 0)) throw new Error("Transfer amount exceeds the source account balance.");
    add("bankOperations", { ...values, type: "transfer" });
    toast.success("Transfer completed without affecting income or expenses.");
    setTransfer(false);
  };
  const deleteAccount = (account) => {
    if (!window.confirm(`Delete ${account.nickname || account.bankName}? Accounts with transaction history cannot be deleted.`)) return;
    try { remove("accounts", account.id); toast.success("Account deleted."); }
    catch (error) { toast.error(error.message); }
  };
  const linkedAccountIds = new Set([
    ...data.transactions.map((item) => item.accountId),
    ...data.udhaar.flatMap((item) => [item.accountId, ...(item.repayments || []).map((payment) => payment.accountId)]),
    ...data.emiPayments.map((item) => item.accountId),
    ...data.customerEntries.map((item) => item.accountId),
    ...data.bankOperations.flatMap((item) => [item.accountId, item.fromAccountId, item.toAccountId]),
  ].filter(Boolean));
  return <div className="pa-page">
    <PageHeading eyebrow="CASH & BANKING" title="Bank accounts" subtitle="Manage balances, record cash movements, and transfer between your own accounts." action={<><Button variant="soft" icon={ArrowLeftRight} onClick={() => accounts.length > 1 && setTransfer(true)} disabled={accounts.length < 2}>Transfer</Button><Button icon={Plus} onClick={() => setModal({})}>Add account</Button></>} />
    <div className="pa-bank-total"><div><span className="pa-bank-icon"><Wallet size={19} /></span><span><small>Available balance</small><b>{formatCurrency(balanceTotal, data.profile.currency)}</b><em>Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}</em></span></div><div className="pa-bank-total-note">Transfers between your own accounts never count as income or expenses.</div></div>
    <div className="pa-account-grid">{accounts.length ? accounts.map((account, index) => <article className={`pa-account-card pa-account-card-${index % 3}`} key={account.id}>
      <div className="pa-account-card-head"><span className="pa-account-bank-icon">{account.type === "Cash wallet" ? <Banknote size={19} /> : <Wallet size={19} />}</span><div><b>{account.nickname || account.bankName}</b><small>{account.bankName} · {account.type}</small></div><div className="pa-row-actions"><button title="Edit account" aria-label="Edit account" onClick={() => setModal(account)}><Pencil size={15} /></button><button title="Delete account" aria-label="Delete account" disabled={linkedAccountIds.has(account.id)} onClick={() => deleteAccount(account)}><Trash2 size={15} /></button></div></div>
      <small className="pa-account-holder">{account.holderName}</small><div className="pa-account-balance">{formatCurrency(account.currentBalance, data.profile.currency)}</div><div className="pa-account-card-foot"><span>{account.accountNumber ? `•••• ${String(account.accountNumber).slice(-4)}` : "Account number not added"}</span><span>Opening {formatCurrency(account.openingBalance, data.profile.currency)}</span></div>
      <div className="pa-account-actions"><button onClick={() => setMovement({ type: "deposit", accountId: account.id })}><ArrowDownToLine size={14} /> Deposit</button><button onClick={() => setMovement({ type: "withdrawal", accountId: account.id })}><ArrowUpFromLine size={14} /> Withdraw</button></div>
    </article>) : <div className="pa-panel pa-empty-panel"><EmptyState icon={Wallet} title="Add your first account" description="Create a bank account or cash wallet to start tracking available balances." action={<Button icon={Plus} onClick={() => setModal({})}>Add account</Button>} /></div>}</div>
    <section className="pa-panel pa-list-panel"><div className="pa-panel-heading"><div><h2>Account activity</h2><p>Deposits, withdrawals, and transfers · latest 25</p></div></div>
      <Table columns={[{ key: "activity", label: "Activity" }, { key: "account", label: "Account" }, { key: "date", label: "Date" }, { key: "description", label: "Description" }, { key: "amount", label: "Amount" }]} rows={operations} empty={<EmptyState icon={ArrowLeftRight} title="No account activity" description="Deposits, withdrawals, and transfers will appear here." />} renderRow={(item) => <tr key={item.id}><td><span className={`pa-tag ${item.type === "deposit" ? "pa-tag-green" : item.type === "withdrawal" ? "pa-tag-pink" : "pa-tag-sky"}`}>{item.type === "deposit" ? "Deposit" : item.type === "withdrawal" ? "Withdrawal" : "Transfer"}</span></td><td>{item.type === "transfer" ? `${accountName(item.fromAccountId)} → ${accountName(item.toAccountId)}` : accountName(item.accountId)}</td><td>{formatDate(item.date)}</td><td>{item.note || "—"}</td><td><b className={item.type === "deposit" ? "pa-positive-text" : "pa-amount-text"}>{item.type === "deposit" ? "+" : "−"}{formatCurrency(item.amount, data.profile.currency)}</b></td></tr>} />
    </section>
    {modal && <RecordModal title={`${modal.id ? "Edit" : "Add"} account`} description="Current balances are calculated from opening balance and linked activity." fields={accountFields} initial={modal} submitLabel={modal.id ? "Save account" : "Create account"} onClose={() => setModal(null)} onSubmit={submitAccount} />}
    {movement && accounts.length > 0 && <RecordModal title={movement.type === "deposit" ? "Record deposit" : "Record withdrawal"} fields={movementFields} initial={{ accountId: movement.accountId }} submitLabel={movement.type === "deposit" ? "Add deposit" : "Add withdrawal"} onClose={() => setMovement(null)} onSubmit={submitMovement} />}
    {transfer && <RecordModal title="Transfer between accounts" description="This moves funds between your accounts; it does not create income or an expense." fields={transferFields} initial={{ fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || "" }} submitLabel="Complete transfer" onClose={() => setTransfer(false)} onSubmit={submitTransfer} />}
  </div>;
}
