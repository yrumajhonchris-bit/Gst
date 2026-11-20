import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MailOpen,
  MapPin,
  Plus,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { formatPhp } from '../lib/ghaEngine';
import { BankAccountInfo, DeliveryAddress, GhaAppState, MailMessage, SubView } from '../types/gha';
import { SafeImage } from './GhaLogo';

interface SettingsProps {
  state: GhaAppState;
  onOpenSubView: (view: SubView) => void;
  onChangePassword: (
    kind: 'login' | 'transaction',
    oldPwd: string,
    newPwd: string,
    confirmPwd: string
  ) => { ok: boolean; message: string };
  onClearCache: () => void;
  onLogout: () => void;
}

export function SettingsView({
  state,
  onOpenSubView,
  onChangePassword,
  onClearCache,
  onLogout,
}: SettingsProps) {
  const [modalKind, setModalKind] = useState<'login' | 'transaction' | null>(null);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalKind) return;
    const res = onChangePassword(modalKind, oldPwd, newPwd, confirmPwd);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setOldPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setTimeout(() => setModalKind(null), 900);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {feedback && !modalKind && (
        <div
          role="status"
          className="rounded-xl px-4 py-3 text-sm font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
        >
          {feedback.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        <button
          type="button"
          onClick={() => onOpenSubView('bank-account')}
          className="w-full px-5 min-h-[60px] flex items-center justify-between hover:bg-slate-50 text-left"
        >
          <div className="flex items-center gap-3.5">
            <CreditCard className="w-5 h-5 text-[#1570EF]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Bank account</p>
              <p className="text-xs text-slate-500">
                {state.user.bankAccount.walletType} · {state.user.bankAccount.accountNumber}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            setModalKind('transaction');
            setFeedback(null);
          }}
          className="w-full px-5 min-h-[60px] flex items-center justify-between hover:bg-slate-50 text-left"
        >
          <div className="flex items-center gap-3.5">
            <KeyRound className="w-5 h-5 text-[#1570EF]" />
            <span className="text-sm font-semibold text-slate-900">Transaction Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            setModalKind('login');
            setFeedback(null);
          }}
          className="w-full px-5 min-h-[60px] flex items-center justify-between hover:bg-slate-50 text-left"
        >
          <div className="flex items-center gap-3.5">
            <Lock className="w-5 h-5 text-[#1570EF]" />
            <span className="text-sm font-semibold text-slate-900">Login Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => {
            onClearCache();
            setFeedback({ ok: true, text: 'Local cache refreshed while preserving your account state.' });
          }}
          className="w-full px-5 min-h-[60px] flex items-center justify-between hover:bg-slate-50 text-left"
        >
          <div className="flex items-center gap-3.5">
            <Trash2 className="w-5 h-5 text-[#1570EF]" />
            <span className="text-sm font-semibold text-slate-900">Clear Cache</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="w-full px-5 min-h-[60px] flex items-center justify-between hover:bg-red-50 text-left"
        >
          <div className="flex items-center gap-3.5">
            <LogOut className="w-5 h-5 text-red-600" />
            <span className="text-sm font-semibold text-red-600">Log Out</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Password Bottom Sheet / Modal */}
      {modalKind && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={modalKind === 'transaction' ? 'Transaction Password' : 'Login Password'}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-[#0B2545]">
                {modalKind === 'transaction' ? 'Transaction Password' : 'Login Password'}
              </h2>
              <button
                type="button"
                onClick={() => setModalKind(null)}
                aria-label="Close password modal"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                role="alert"
                className={`mb-4 rounded-xl px-3.5 py-2.5 text-sm font-medium border ${
                  feedback.ok
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="password"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                placeholder={modalKind === 'transaction' ? 'Current Transaction Password' : 'Current Login Password'}
                aria-label="Current password"
                className="w-full h-12 px-4 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
              />
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="New Password"
                aria-label="New password"
                className="w-full h-12 px-4 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
              />
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Confirm Password"
                aria-label="Confirm password"
                className="w-full h-12 px-4 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
              />
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm mt-2"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function BankAccountView({
  bankAccount,
  onSave,
  onBack,
}: {
  bankAccount: BankAccountInfo;
  onSave: (info: BankAccountInfo) => void;
  onBack: () => void;
}) {
  const [form, setForm] = useState<BankAccountInfo>(bankAccount);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="font-display font-bold text-lg text-[#0B2545]">Bank &amp; E-Wallet Account</h2>
      {saved && (
        <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 font-medium">
          Bank account details updated.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="bank-name" className="block text-xs text-slate-500 mb-1">Full Name</label>
          <input
            id="bank-name"
            type="text"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm font-medium"
          />
        </div>
        <div>
          <label htmlFor="bank-phone" className="block text-xs text-slate-500 mb-1">Mobile (+63)</label>
          <input
            id="bank-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm font-medium tabular-nums"
          />
        </div>
        <div>
          <label htmlFor="bank-wallet" className="block text-xs text-slate-500 mb-1">Wallet / Bank</label>
          <select
            id="bank-wallet"
            value={form.walletType}
            onChange={(e) => setForm({ ...form, walletType: e.target.value as BankAccountInfo['walletType'] })}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm font-medium"
          >
            <option value="GCASH Wallet Account">GCASH Wallet Account</option>
            <option value="Maya Wallet Account">Maya Wallet Account</option>
            <option value="BDO Unibank">BDO Unibank</option>
            <option value="UnionBank">UnionBank</option>
          </select>
        </div>
        <div>
          <label htmlFor="bank-num" className="block text-xs text-slate-500 mb-1">Account Number</label>
          <input
            id="bank-num"
            type="text"
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm font-medium tabular-nums"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="h-11 rounded-full bg-slate-900 text-white text-sm font-semibold"
          >
            Return
          </button>
          <button
            type="submit"
            className="h-11 rounded-full bg-[#C8922A] hover:bg-[#B5811F] text-white text-sm font-semibold"
          >
            Modify
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddressView({
  addresses,
  onAddAddress,
}: {
  addresses: DeliveryAddress[];
  onAddAddress: (addr: Omit<DeliveryAddress, 'id'>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('+63 ');
  const [provinceCity, setProvinceCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !streetAddress.trim()) return;
    onAddAddress({
      recipient: recipient.trim(),
      phone: phone.trim(),
      provinceCity: provinceCity.trim() || 'Metro Manila',
      streetAddress: streetAddress.trim(),
      postalCode: postalCode.trim() || '1200',
      isDefault: addresses.length === 0,
    });
    setRecipient('');
    setStreetAddress('');
    setProvinceCity('');
    setPostalCode('');
    setShowForm(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="w-full h-12 rounded-full bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        <span>Add Address</span>
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-display font-bold text-base text-[#0B2545]">New Shipping Address (for Rewards &amp; Sports Watch)</h3>
          <input
            type="text"
            required
            placeholder="Recipient Full Name"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
          />
          <input
            type="tel"
            required
            placeholder="Contact Phone (+63...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="City / Province"
              value={provinceCity}
              onChange={(e) => setProvinceCity(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
            />
          </div>
          <input
            type="text"
            required
            placeholder="Street / Barangay / Unit"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
          />
          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#0B2545] text-white text-sm font-semibold"
          >
            Save Address
          </button>
        </form>
      )}

      <div className="space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#1570EF] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#0B2545]">
                {addr.recipient} · <span className="font-normal text-slate-600 tabular-nums">{addr.phone}</span>
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {addr.streetAddress}, {addr.provinceCity}, {addr.postalCode}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancialRecordsView({ state }: { state: GhaAppState }) {
  const [tab, setTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [query, setQuery] = useState('');

  const filtered = state.financialRecords.filter(
    (r) => r.type === tab && (r.id.includes(query) || r.status.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-white rounded-xl border border-slate-200 px-3">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by reference ID or status..."
            aria-label="Filter financial records"
            className="w-full h-11 text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setTab('deposit')}
          className={`h-11 rounded-xl text-sm font-semibold ${
            tab === 'deposit' ? 'bg-[#1570EF] text-white' : 'text-slate-700'
          }`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => setTab('withdraw')}
          className={`h-11 rounded-xl text-sm font-semibold ${
            tab === 'withdraw' ? 'bg-[#1570EF] text-white' : 'text-slate-700'
          }`}
        >
          Withdraw
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No financial records found.</p>
        ) : (
          filtered.map((rec) => (
            <div key={rec.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    rec.type === 'deposit'
                      ? 'bg-[#C8922A] text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {rec.type === 'deposit' ? 'R' : 'W'}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-700 truncate">{rec.id}</p>
                  <p className="text-base font-display font-bold text-[#1570EF] tabular-nums">
                    {formatPhp(rec.amountPhp)}
                  </p>
                  <p className="text-xs text-slate-500">{rec.channel}</p>
                  {rec.senderReference && (
                    <p className="text-[11px] text-slate-500 truncate">Ref: {rec.senderReference}</p>
                  )}
                  {rec.ownerNote && (
                    <p className="text-[11px] text-[#0B2545] truncate">Note: {rec.ownerNote}</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-slate-500 tabular-nums">{rec.timestamp}</p>
                <p
                  className={`text-xs font-semibold mt-1 ${
                    rec.status.includes('successfully') || rec.status.includes('Successful')
                      ? 'text-emerald-700'
                      : rec.status.includes('confirmed')
                      ? 'text-amber-700'
                      : 'text-red-600'
                  }`}
                >
                  {rec.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function TransactionRecordsView({ state }: { state: GhaAppState }) {
  const [tab, setTab] = useState<'all' | 'income' | 'expenditure'>('all');
  const filtered = state.transactionRecords.filter((t) =>
    tab === 'all' ? true : t.direction === tab
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/80 rounded-2xl">
        {(['all', 'income', 'expenditure'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setTab(mode)}
            className={`h-11 rounded-xl text-sm font-semibold capitalize ${
              tab === mode ? 'bg-[#1570EF] text-white' : 'text-slate-700'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {filtered.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  tx.direction === 'income' ? 'bg-[#C8922A] text-white' : 'bg-[#0B2545] text-white'
                }`}
              >
                {tx.category[0]}
              </span>
              <div>
                <p className="text-sm font-bold text-[#0B2545]">{tx.category}</p>
                <p className="text-xs text-slate-500">{tx.note}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p
                className={`text-sm font-display font-bold tabular-nums ${
                  tx.amountPhp >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {tx.amountPhp >= 0 ? `+${formatPhp(tx.amountPhp)}` : formatPhp(tx.amountPhp)}
              </p>
              <p className="text-xs text-slate-400 tabular-nums mt-0.5">{tx.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgreementsView({ state }: { state: GhaAppState }) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#1570EF]" />
          <div>
            <h2 className="font-display font-bold text-base text-[#0B2545]">
              GST Employee Hospitality Quality Audit Agreement
            </h2>
            <p className="text-xs text-slate-500">
              Signed by {state.user.name} · Effective {state.user.effectiveDateStart} – {state.user.effectiveDateEnd}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          This agreement confirms participation in GST Hospitality Alliance Corp daily partner quality inspections, fair star rating reporting, and compliance with Philippines coordinator conduct guidelines.
        </p>
      </div>
    </div>
  );
}

export function CouponView({
  state,
  onUseCoupon,
}: {
  state: GhaAppState;
  onUseCoupon: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {state.coupons.map((cp) => (
        <div
          key={cp.id}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-amber-50 text-[#C8922A] flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display font-bold text-base text-[#0B2545]">{cp.title}</h3>
              <p className="text-xs text-slate-500">
                Code: <span className="font-mono font-semibold">{cp.code}</span> · +{cp.bonusPct}% Daily Boost · Min ₱{cp.minInvestPhp} · Exp {cp.expiresAt}
              </p>
            </div>
          </div>
          {cp.used ? (
            <span className="text-xs font-semibold text-slate-400">Used</span>
          ) : (
            <button
              type="button"
              onClick={onUseCoupon}
              className="h-10 px-4 rounded-xl bg-[#1570EF] text-white text-xs font-semibold shrink-0"
            >
              Use in Wealth
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function MailView({
  mails,
  selectedMail,
  onSelectMail,
  onBackToList,
}: {
  mails: MailMessage[];
  selectedMail: MailMessage | null;
  onSelectMail: (mail: MailMessage) => void;
  onBackToList: () => void;
}) {
  const [tab, setTab] = useState<'unread' | 'read'>('unread');

  if (selectedMail) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          type="button"
          onClick={onBackToList}
          className="text-sm font-semibold text-[#1570EF] hover:underline"
        >
          &lt; Back to Mail List
        </button>

        <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {selectedMail.bannerImage && (
            <SafeImage
              src={selectedMail.bannerImage}
              alt={selectedMail.title}
              className="w-full h-52 object-cover"
            />
          )}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 tabular-nums">{selectedMail.timestamp}</p>
              <h1 className="text-xl font-display font-bold text-[#0B2545] mt-1">
                {selectedMail.title}
              </h1>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              {selectedMail.bodyParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>

            {selectedMail.highlights && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMail.highlights.map((h) => (
                  <div key={h.label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{h.label}</span>
                    <span className="font-bold text-[#0B2545]">{h.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    );
  }

  const unreadList = mails.filter((m) => !m.read);
  const readList = mails.filter((m) => m.read);
  const shown = tab === 'unread' ? unreadList : readList;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setTab('unread')}
          className={`h-11 rounded-xl text-sm font-semibold ${
            tab === 'unread' ? 'bg-[#1570EF] text-white' : 'text-slate-700'
          }`}
        >
          Unread ({unreadList.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('read')}
          className={`h-11 rounded-xl text-sm font-semibold ${
            tab === 'read' ? 'bg-[#1570EF] text-white' : 'text-slate-700'
          }`}
        >
          Have Read ({readList.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
        {shown.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No messages in this folder.</p>
          </div>
        ) : (
          shown.map((mail) => (
            <button
              key={mail.id}
              type="button"
              onClick={() => onSelectMail(mail)}
              className="w-full p-4 flex items-start gap-3.5 hover:bg-slate-50 text-left transition-colors"
            >
              <span className="w-10 h-10 rounded-xl bg-slate-100 text-[#1570EF] flex items-center justify-center shrink-0">
                {mail.read ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-[#0B2545] truncate">
                    {mail.title}
                  </h3>
                  <span className="text-xs text-slate-400 tabular-nums shrink-0">
                    {mail.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{mail.preview}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
