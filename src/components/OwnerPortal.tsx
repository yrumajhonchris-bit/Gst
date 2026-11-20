import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  Egg,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Link2,
  Lock,
  LogOut,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { MEMBERSHIP_TIERS, createFreshAccountState } from '../data/ghaSeed';
import { formatPhp, isValidPhPhone, normalizePhPhone } from '../lib/ghaEngine';
import {
  ensureStoreDefaults,
  getSystemMetrics,
  loginOwnerAccount,
  ownerAdjustMemberWallet,
  ownerApproveDepositRecord,
  ownerApproveWithdrawalRecord,
  ownerDeleteDepositChannel,
  ownerDeleteTransactionRecord,
  ownerGrantPracticeDraws,
  ownerIssueVerificationCode,
  ownerRejectDepositRecord,
  ownerRejectWithdrawalRecord,
  ownerReplyToMemberChat,
  ownerRevokeVerificationCode,
  ownerSetMemberBankAccount,
  ownerSetMemberRank,
  ownerToggleDepositChannel,
  ownerToggleFeatureFlag,
  ownerToggleInviteUnlock,
  ownerUpdateTransactionRules,
  ownerUpsertDepositChannel,
  setupOwnerAccount,
  updateOwnerProfile,
} from '../lib/ownerEngine';
import {
  AccountsStore,
  BankAccountInfo,
  DepositChannel,
  MembershipCode,
  SystemFeatureFlags,
} from '../types/gha';
import { GhaLogo } from './GhaLogo';

interface OwnerPortalProps {
  store: AccountsStore;
  onUpdateStore: (next: AccountsStore) => void;
  onExitOwnerPortal: () => void;
}

type OwnerTab = 'accounts' | 'channels' | 'transactions' | 'features' | 'security';

const FEATURE_LABELS: Array<{ key: keyof SystemFeatureFlags; label: string; desc: string }> = [
  { key: 'depositsEnabled', label: 'Deposits', desc: 'Allow member deposits via GCash/Maya channels' },
  { key: 'withdrawalsEnabled', label: 'Withdrawals', desc: 'Allow withdrawal requests to e-wallets/banks' },
  { key: 'tasksEnabled', label: 'Daily Hospitality Audits', desc: 'Daily hotel audit tasks & PHP payouts' },
  { key: 'wealthEnabled', label: 'Wealth & Funds', desc: '40/90/150-day employee wealth funds' },
  { key: 'teamInviteEnabled', label: 'Team & Invitations', desc: 'Invite codes, tier rebates & referral roster' },
  { key: 'surpriseCardEnabled', label: 'Surprise Card Draw', desc: 'Flip-card recruitment reward activity' },
  { key: 'goldenEggEnabled', label: 'Golden Egg Smash', desc: 'Onboarding Golden Egg prize activity' },
  { key: 'cashGiftEnabled', label: 'Cash Gift & Check-In', desc: 'Gift code redemptions & daily PHP 18 check-in' },
  { key: 'sportsWatchEnabled', label: 'Sports Watch Benefit', desc: 'B1 / 5-invite free smartwatch reward claim' },
  { key: 'vipUpgradeEnabled', label: 'VIP Rank Upgrades', desc: 'A0 to B3 promotion & security deposit upgrades' },
  { key: 'customerServiceEnabled', label: 'Online Customer Service', desc: 'Live GST hiring manager & owner support replies' },
];

export function OwnerPortal({ store, onUpdateStore, onExitOwnerPortal }: OwnerPortalProps) {
  const normalizedStore = ensureStoreDefaults(store);
  const owner = normalizedStore.owner!;
  const config = normalizedStore.systemConfig!;

  // Owner auth form state
  const [ownerIdInput, setOwnerIdInput] = useState(owner.ownerId || 'gst_owner');
  const [ownerNameInput, setOwnerNameInput] = useState('GST System Owner');
  const [ownerPwdInput, setOwnerPwdInput] = useState('');
  const [ownerConfirmInput, setOwnerConfirmInput] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Console state
  const [activeTab, setActiveTab] = useState<OwnerTab>('accounts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [consoleFeedback, setConsoleFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Member management state
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<'personal' | 'income'>('personal');
  const [adjustAmount, setAdjustAmount] = useState('500');
  const [adjustNote, setAdjustNote] = useState('Owner system credit');
  const [confirmDeletePhone, setConfirmDeletePhone] = useState<string | null>(null);

  // Member payout account editor
  const [editBankWallet, setEditBankWallet] = useState<BankAccountInfo['walletType']>('GCASH Wallet Account');
  const [editBankNumber, setEditBankNumber] = useState('');

  // Create member form
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberPassword, setNewMemberPassword] = useState('');
  const [newMemberDeposit, setNewMemberDeposit] = useState('0');

  // Deposit Channels (GCash & Maya) form
  const [editingChannelId, setEditingChannelId] = useState<string | undefined>(undefined);
  const [chProvider, setChProvider] = useState<'GCash' | 'Maya'>('GCash');
  const [chName, setChName] = useState('');
  const [chAccountName, setChAccountName] = useState('');
  const [chAccountNumber, setChAccountNumber] = useState('');
  const [chPaymentUrl, setChPaymentUrl] = useState('');
  const [chInstructions, setChInstructions] = useState('');
  const [chMinPhp, setChMinPhp] = useState('100');
  const [chMaxPhp, setChMaxPhp] = useState('50000');

  // Transactions tab filters & note
  const [txSubView, setTxSubView] = useState<'orders' | 'activity'>('orders');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'pending' | 'deposit' | 'withdraw'>('all');
  const [txSearch, setTxSearch] = useState('');
  const [ownerActionNote, setOwnerActionNote] = useState('');

  // Transaction rules form
  const [ruleMinDep, setRuleMinDep] = useState(String(config.minDepositPhp));
  const [ruleMaxDep, setRuleMaxDep] = useState(String(config.maxDepositPhp));
  const [ruleMinWdr, setRuleMinWdr] = useState(String(config.minWithdrawPhp));
  const [ruleIncFee, setRuleIncFee] = useState(String(config.incomeWithdrawFeePct));
  const [rulePersFee, setRulePersFee] = useState(String(config.personalWithdrawFeePct));

  // System config forms
  const [newGiftCode, setNewGiftCode] = useState('');
  const [newGiftPhp, setNewGiftPhp] = useState('100');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [chatPhone, setChatPhone] = useState<string>('');
  const [chatReply, setChatReply] = useState('');

  // Owner security form
  const [editOwnerId, setEditOwnerId] = useState(owner.ownerId);
  const [editOwnerName, setEditOwnerName] = useState(owner.name);
  const [editOwnerNewPwd, setEditOwnerNewPwd] = useState('');

  // Phone verification (OTP) issuance form
  const [otpPhoneInput, setOtpPhoneInput] = useState('');
  const [otpCustomCodeInput, setOtpCustomCodeInput] = useState('');
  const [otpNoteInput, setOtpNoteInput] = useState('');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const ownerPortalUrl = `${originUrl}/#/owner`;
  const memberPortalUrl = `${originUrl}/`;

  const copyLink = (key: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = setupOwnerAccount(
      normalizedStore,
      ownerIdInput,
      ownerNameInput,
      ownerPwdInput,
      ownerConfirmInput
    );
    setAuthFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      onUpdateStore(res.store);
      setEditOwnerId(res.store.owner!.ownerId);
      setEditOwnerName(res.store.owner!.name);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = loginOwnerAccount(normalizedStore, ownerIdInput, ownerPwdInput);
    setAuthFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      onUpdateStore(res.store);
      setEditOwnerId(res.store.owner!.ownerId);
      setEditOwnerName(res.store.owner!.name);
    }
  };

  const handleOwnerLogout = () => {
    onUpdateStore({
      ...normalizedStore,
      ownerAuthenticated: false,
    });
    setOwnerPwdInput('');
    setAuthFeedback(null);
  };

  if (!normalizedStore.ownerAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
        <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GhaLogo size="sm" />
            <span className="px-2.5 py-1 rounded-lg bg-[#0B2545] text-[#E6B84C] text-xs font-semibold">
              Owner Portal
            </span>
          </div>
          <button
            type="button"
            onClick={onExitOwnerPortal}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1570EF] hover:underline min-h-[44px] px-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Member Portal</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0B2545] text-[#E6B84C] flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-[#0B2545]">
                  {owner.configured ? 'Owner Account Sign In' : 'Initialize Owner Account'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {owner.configured
                    ? 'Separated GST administrative link (#/owner) for full transaction, channel & feature control.'
                    : 'Set up your separate Owner Account credentials to manage all GST transactions, GCash/Maya channels, and features.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 truncate font-mono">{ownerPortalUrl}</span>
              <button
                type="button"
                onClick={() => copyLink('auth-url', ownerPortalUrl)}
                className="text-[#1570EF] font-semibold inline-flex items-center gap-1 shrink-0"
              >
                {copiedKey === 'auth-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'auth-url' ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>

            {authFeedback && (
              <div
                role="alert"
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                  authFeedback.ok
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {authFeedback.text}
              </div>
            )}

            <form
              onSubmit={owner.configured ? handleLoginSubmit : handleSetupSubmit}
              className="space-y-4"
            >
              <div>
                <label htmlFor="owner-id" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Owner ID / Username
                </label>
                <input
                  id="owner-id"
                  type="text"
                  value={ownerIdInput}
                  onChange={(e) => setOwnerIdInput(e.target.value)}
                  placeholder="e.g. gst_owner"
                  className="w-full h-12 px-4 rounded-2xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
                />
              </div>

              {!owner.configured && (
                <div>
                  <label htmlFor="owner-name" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Owner Display Name
                  </label>
                  <input
                    id="owner-name"
                    type="text"
                    value={ownerNameInput}
                    onChange={(e) => setOwnerNameInput(e.target.value)}
                    placeholder="GST System Owner"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
                  />
                </div>
              )}

              <div>
                <label htmlFor="owner-pwd" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Owner Password
                </label>
                <div className="flex items-center bg-slate-100 rounded-2xl px-3.5 h-12 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white">
                  <KeyRound className="w-4 h-4 text-[#1570EF] mr-2.5 shrink-0" />
                  <input
                    id="owner-pwd"
                    type={showPwd ? 'text' : 'password'}
                    value={ownerPwdInput}
                    onChange={(e) => setOwnerPwdInput(e.target.value)}
                    placeholder="Enter owner password (min 6 chars)"
                    className="w-full bg-transparent text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-500"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!owner.configured && (
                <div>
                  <label htmlFor="owner-confirm" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Confirm Owner Password
                  </label>
                  <input
                    id="owner-confirm"
                    type="password"
                    value={ownerConfirmInput}
                    onChange={(e) => setOwnerConfirmInput(e.target.value)}
                    placeholder="Re-enter owner password"
                    className="w-full h-12 px-4 rounded-2xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full h-12 rounded-full bg-[#0B2545] hover:bg-[#133C73] text-white font-semibold text-sm transition-colors"
              >
                {owner.configured ? 'Sign In to Owner Console' : 'Create Owner Account'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const metrics = getSystemMetrics(normalizedStore);
  const allMembers = Object.values(normalizedStore.accounts);
  const searchLower = memberSearch.trim().toLowerCase();
  const filteredMembers = allMembers.filter(
    (acct) =>
      !searchLower ||
      acct.user.phone.includes(searchLower) ||
      acct.user.name.toLowerCase().includes(searchLower) ||
      acct.user.level.toLowerCase().includes(searchLower) ||
      acct.user.inviteCode.toLowerCase().includes(searchLower)
  );

  const activeMember =
    (selectedPhone && normalizedStore.accounts[selectedPhone]) || filteredMembers[0] || null;

  const txQuery = txSearch.trim().toLowerCase();
  const allLedgerRows = allMembers.flatMap((acct) =>
    acct.financialRecords.map((rec) => ({
      ...rec,
      memberPhone: acct.user.phone,
      memberName: acct.user.name,
    }))
  );
  const filteredLedgerRows = allLedgerRows.filter((row) => {
    const matchFilter =
      ledgerFilter === 'all'
        ? true
        : ledgerFilter === 'pending'
        ? row.status === 'Deposit to be confirmed' || row.status === 'Withdrawal to be confirmed'
        : row.type === ledgerFilter;
    const matchSearch =
      !txQuery ||
      row.memberPhone.includes(txQuery) ||
      row.memberName.toLowerCase().includes(txQuery) ||
      row.id.toLowerCase().includes(txQuery) ||
      row.channel.toLowerCase().includes(txQuery) ||
      (row.senderReference ?? '').toLowerCase().includes(txQuery);
    return matchFilter && matchSearch;
  });

  const allActivityRows = allMembers.flatMap((acct) =>
    acct.transactionRecords.map((tx) => ({
      ...tx,
      memberPhone: acct.user.phone,
      memberName: acct.user.name,
    }))
  );
  const filteredActivityRows = allActivityRows.filter(
    (row) =>
      !txQuery ||
      row.memberPhone.includes(txQuery) ||
      row.memberName.toLowerCase().includes(txQuery) ||
      row.category.toLowerCase().includes(txQuery) ||
      row.note.toLowerCase().includes(txQuery)
  );

  const activeChatMember =
    (chatPhone && normalizedStore.accounts[chatPhone]) || allMembers[0] || null;

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhPhone(newMemberPhone)) {
      setConsoleFeedback({
        ok: false,
        text: 'Enter a valid 10-digit +63 mobile number starting with 9.',
      });
      return;
    }
    const cleanPhone = normalizePhPhone(newMemberPhone);
    if (normalizedStore.accounts[cleanPhone]) {
      setConsoleFeedback({ ok: false, text: `+63 ${cleanPhone} already exists.` });
      return;
    }
    if (newMemberPassword.length < 6) {
      setConsoleFeedback({ ok: false, text: 'Member password must be at least 6 characters.' });
      return;
    }
    const nextAcct = createFreshAccountState(cleanPhone, newMemberPassword);
    nextAcct.isAuthenticated = false;
    let nextStore: AccountsStore = {
      ...normalizedStore,
      accounts: {
        ...normalizedStore.accounts,
        [cleanPhone]: nextAcct,
      },
    };
    const initDeposit = Number(newMemberDeposit);
    if (Number.isFinite(initDeposit) && initDeposit > 0) {
      const funded = ownerAdjustMemberWallet(
        nextStore,
        cleanPhone,
        'personal',
        initDeposit,
        'Owner onboarding deposit'
      );
      if (funded.ok) nextStore = funded.store;
    }
    onUpdateStore(nextStore);
    setSelectedPhone(cleanPhone);
    setNewMemberPhone('');
    setNewMemberPassword('');
    setNewMemberDeposit('0');
    setShowCreateMember(false);
    setConsoleFeedback({
      ok: true,
      text: `Created verified member +63 ${cleanPhone}${initDeposit > 0 ? ` with ${formatPhp(initDeposit)}` : ''}.`,
    });
  };

  const resetChannelForm = () => {
    setEditingChannelId(undefined);
    setChProvider('GCash');
    setChName('');
    setChAccountName('');
    setChAccountNumber('');
    setChPaymentUrl('');
    setChInstructions('');
    setChMinPhp(String(config.minDepositPhp));
    setChMaxPhp(String(config.maxDepositPhp));
  };

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = ownerUpsertDepositChannel(normalizedStore, {
      id: editingChannelId,
      channelName: chName,
      provider: chProvider,
      accountName: chAccountName,
      accountNumber: chAccountNumber,
      paymentUrl: chPaymentUrl,
      instructions: chInstructions,
      minPhp: Number(chMinPhp),
      maxPhp: Number(chMaxPhp),
    });
    setConsoleFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      onUpdateStore(res.store);
      resetChannelForm();
    }
  };

  const loadChannelForEdit = (ch: DepositChannel) => {
    setEditingChannelId(ch.id);
    setChProvider(ch.provider);
    setChName(ch.channelName);
    setChAccountName(ch.accountName);
    setChAccountNumber(ch.accountNumber);
    setChPaymentUrl(ch.paymentUrl ?? '');
    setChInstructions(ch.instructions ?? '');
    setChMinPhp(String(ch.minPhp));
    setChMaxPhp(String(ch.maxPhp));
  };

  const pendingTotal = metrics.pendingDeposits + metrics.pendingWithdrawals;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900">
      {/* Top Owner Bar */}
      <header className="sticky top-0 z-30 bg-[#0B2545] text-white border-b border-slate-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[#C8922A] text-white flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-base sm:text-lg">
                  GST Owner Management Console
                </h1>
                {config.practiceMode && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                    Practice Enabled
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Signed in as {owner.name} (@{owner.ownerId})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyLink('top-owner-url', ownerPortalUrl)}
              className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              {copiedKey === 'top-owner-url' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'top-owner-url' ? 'Owner Link Copied' : 'Copy Owner Link'}</span>
            </button>

            <button
              type="button"
              onClick={onExitOwnerPortal}
              className="h-9 px-3 rounded-xl bg-[#1570EF] hover:bg-[#125EC9] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Member Portal</span>
            </button>

            <button
              type="button"
              onClick={handleOwnerLogout}
              className="h-9 px-3 rounded-xl bg-red-600/90 hover:bg-red-700 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* System KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-6 gap-3 tabular-nums">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Registered Phones</p>
            <p className="text-2xl font-display font-bold text-[#0B2545] mt-1">
              {metrics.totalAccounts}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Invite Unlocked</p>
            <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
              {metrics.depositedAccounts} / {metrics.totalAccounts}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Pending Dep / Wdr</p>
            <p className="text-2xl font-display font-bold text-amber-700 mt-1">
              {metrics.pendingDeposits} / {metrics.pendingWithdrawals}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Active Channels</p>
            <p className="text-2xl font-display font-bold text-[#1570EF] mt-1">
              {metrics.activeChannels}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Personal Wallets</p>
            <p className="text-lg font-display font-bold text-[#0B2545] mt-1">
              {formatPhp(metrics.totalPersonalPhp)}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Income Wallets</p>
            <p className="text-lg font-display font-bold text-[#C8922A] mt-1">
              {formatPhp(metrics.totalIncomePhp)}
            </p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 bg-white rounded-2xl border border-slate-200 p-2">
          {(
            [
              {
                id: 'accounts',
                label: `Accounts & Practice${metrics.pendingOtps > 0 ? ` (${metrics.pendingOtps} OTP)` : ''}`,
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: 'channels',
                label: `GCash & Maya Channels (${config.depositChannels.length})`,
                icon: <Smartphone className="w-4 h-4" />,
              },
              {
                id: 'transactions',
                label: `All Transactions${pendingTotal > 0 ? ` (${pendingTotal} pending)` : ''}`,
                icon: <Wallet className="w-4 h-4" />,
              },
              { id: 'features', label: 'GST Features & Rules', icon: <Sliders className="w-4 h-4" /> },
              { id: 'security', label: 'Owner Account & Link', icon: <Shield className="w-4 h-4" /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setConsoleFeedback(null);
              }}
              className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0B2545] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {consoleFeedback && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 text-sm font-medium border ${
              consoleFeedback.ok
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {consoleFeedback.text}
          </div>
        )}

        {/* TAB 1: ACCOUNTS & PRACTICE + OWNER OTP DESK */}
        {activeTab === 'accounts' && (
          <div className="space-y-5">
            {/* Phone Verification Codes (Owner-Issued OTP Desk) */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#1570EF]/10 text-[#1570EF] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display font-bold text-base text-[#0B2545]">
                        Phone Verification Codes (OTP)
                      </h2>
                      {metrics.pendingOtps > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                          {metrics.pendingOtps} Waiting for Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Members cannot self-generate verification codes. Issue a 6-digit code directly to any +63 number or approve requests below.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = ownerIssueVerificationCode(
                    normalizedStore,
                    otpPhoneInput,
                    otpCustomCodeInput,
                    otpNoteInput
                  );
                  setConsoleFeedback({ ok: res.ok, text: res.message });
                  if (res.ok) {
                    onUpdateStore(res.store);
                    setOtpPhoneInput('');
                    setOtpCustomCodeInput('');
                    setOtpNoteInput('');
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 rounded-xl border border-slate-200 p-3.5"
              >
                <div className="sm:col-span-4 flex items-center bg-white rounded-xl border border-slate-200 px-3 h-10">
                  <span className="text-xs font-bold text-slate-600 mr-1.5">+63</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={otpPhoneInput}
                    onChange={(e) => setOtpPhoneInput(e.target.value)}
                    placeholder="9175551234"
                    aria-label="Member phone for verification code"
                    className="w-full bg-transparent text-xs font-semibold tabular-nums focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCustomCodeInput}
                    onChange={(e) => setOtpCustomCodeInput(e.target.value)}
                    placeholder="6-digit code (blank = auto)"
                    aria-label="Custom 6-digit verification code"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-mono tabular-nums focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={otpNoteInput}
                    onChange={(e) => setOtpNoteInput(e.target.value)}
                    placeholder="Note (optional)"
                    aria-label="Verification code note"
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-10 px-3 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-xs font-semibold whitespace-nowrap"
                  >
                    Issue Code to Number
                  </button>
                </div>
              </form>

              {(() => {
                const otpEntries = Object.values(normalizedStore.pendingVerifications ?? {}).sort(
                  (a, b) => {
                    if (a.status !== b.status) return a.status === 'requested' ? -1 : 1;
                    return b.requestedAt.localeCompare(a.requestedAt);
                  }
                );
                if (otpEntries.length === 0) {
                  return (
                    <p className="text-xs text-slate-500 py-2">
                      No pending phone verification requests right now. Enter any +63 number above to pre-issue a 6-digit code, or wait for members to tap Request Code on registration.
                    </p>
                  );
                }
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {otpEntries.map((entry) => (
                      <div
                        key={entry.phone}
                        className={`rounded-xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                          entry.status === 'requested'
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-emerald-200 bg-emerald-50/40'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#0B2545] tabular-nums">
                              +63 {entry.phone}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                entry.status === 'requested'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {entry.status === 'requested' ? 'Waiting for Owner' : 'Code Issued'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Requested: {entry.requestedAt}
                            {entry.issuedAt ? ` · Issued: ${entry.issuedAt}` : ''}
                            {entry.note ? ` · ${entry.note}` : ''}
                          </p>
                          {entry.status === 'issued' && entry.code && (
                            <div className="pt-1 flex items-center gap-2">
                              <span className="text-xs text-slate-600">Verification Code:</span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-white border border-emerald-300 font-mono font-bold text-sm text-[#0B2545] tracking-widest tabular-nums">
                                {entry.code}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {entry.status === 'requested' ? (
                            <button
                              type="button"
                              onClick={() => {
                                const res = ownerIssueVerificationCode(
                                  normalizedStore,
                                  entry.phone,
                                  otpCustomCodeInput.trim() || undefined,
                                  otpNoteInput.trim() || undefined
                                );
                                onUpdateStore(res.store);
                                setConsoleFeedback({ ok: res.ok, text: res.message });
                              }}
                              className="h-9 px-3 rounded-lg bg-[#1570EF] hover:bg-[#125EC9] text-white text-xs font-semibold"
                            >
                              Generate &amp; Issue Code
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => copyLink(`otp-${entry.phone}`, entry.code)}
                              className="h-9 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[#0B2545] text-xs font-semibold inline-flex items-center gap-1"
                            >
                              {copiedKey === `otp-${entry.phone}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedKey === `otp-${entry.phone}` ? 'Copied' : 'Copy Code'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const res = ownerRevokeVerificationCode(normalizedStore, entry.phone);
                              onUpdateStore(res.store);
                              setConsoleFeedback({ ok: res.ok, text: res.message });
                            }}
                            aria-label={`Revoke verification for ${entry.phone}`}
                            className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-red-600 hover:bg-red-50 text-xs font-semibold"
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-bold text-base text-[#0B2545]">
                  Member Accounts ({allMembers.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateMember((v) => !v)}
                  className="h-9 px-3 rounded-xl bg-[#1570EF] hover:bg-[#125EC9] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Member</span>
                </button>
              </div>

              {showCreateMember && (
                <form
                  onSubmit={handleCreateMember}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2.5"
                >
                  <p className="text-xs font-bold text-[#0B2545]">Create Verified Member Account</p>
                  <input
                    type="tel"
                    placeholder="+63 10-digit mobile (e.g. 9175551234)"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      placeholder="Password (min 6)"
                      value={newMemberPassword}
                      onChange={(e) => setNewMemberPassword(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Initial PHP (optional)"
                      value={newMemberDeposit}
                      onChange={(e) => setNewMemberDeposit(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs tabular-nums"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 h-9 rounded-lg bg-[#0B2545] text-white text-xs font-semibold"
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateMember(false)}
                      className="h-9 px-3 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="flex items-center bg-slate-100 rounded-xl px-3 h-10">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search phone, name, rank, code..."
                  aria-label="Search member accounts"
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              </div>

              {filteredMembers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  No member accounts registered yet. Users can register on the Member Portal or you can click <strong>New Member</strong> above.
                </div>
              ) : (
                <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                  {filteredMembers.map((acct) => {
                    const isSelected = activeMember?.user.phone === acct.user.phone;
                    return (
                      <button
                        key={acct.user.phone}
                        type="button"
                        onClick={() => {
                          setSelectedPhone(acct.user.phone);
                          setEditBankWallet(acct.user.bankAccount.walletType);
                          setEditBankNumber(acct.user.bankAccount.accountNumber);
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-colors ${
                          isSelected
                            ? 'border-[#1570EF] bg-[#1570EF]/5'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[#0B2545]">{acct.user.name}</p>
                            <p className="text-xs text-slate-500 tabular-nums">
                              +63 {acct.user.phone} · {acct.user.level}
                            </p>
                          </div>
                          <div className="text-right tabular-nums">
                            <p className="text-xs font-bold text-[#0B2545]">
                              {formatPhp(acct.wallets.personalPhp + acct.wallets.incomePhp)}
                            </p>
                            <p
                              className={`text-[11px] font-semibold ${
                                acct.hasDeposited ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {acct.hasDeposited ? 'Invite Unlocked' : 'Invite Locked'}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Right Control Panel for Selected Member */}
            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
              {!activeMember ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Select or create a verified member account on the left to manage wallets, rank, payout info, invite permissions, and practice activities.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#1570EF]">{activeMember.user.level}</span>
                        <span>·</span>
                        <span className="tabular-nums font-semibold">+63 {activeMember.user.phone}</span>
                        <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      </div>
                      <h3 className="text-lg font-display font-bold text-[#0B2545] mt-1">
                        {activeMember.user.name} ({activeMember.user.inviteCode})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Position: {activeMember.user.position} · Team: {activeMember.teamMembers.length} · Cards: {activeMember.inventory.surpriseCards} · Eggs: {activeMember.inventory.goldenEggs}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = ownerToggleInviteUnlock(
                            normalizedStore,
                            activeMember.user.phone,
                            !activeMember.hasDeposited
                          );
                          onUpdateStore(res.store);
                          setConsoleFeedback({ ok: res.ok, text: res.message });
                        }}
                        className={`h-9 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 ${
                          activeMember.hasDeposited
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {activeMember.hasDeposited ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {activeMember.hasDeposited ? 'Invite Unlocked' : 'Invite Locked'}
                        </span>
                      </button>

                      {confirmDeletePhone === activeMember.user.phone ? (
                        <button
                          type="button"
                          onClick={() => {
                            const nextAccounts = { ...normalizedStore.accounts };
                            delete nextAccounts[activeMember.user.phone];
                            onUpdateStore({
                              ...normalizedStore,
                              activePhone:
                                normalizedStore.activePhone === activeMember.user.phone
                                  ? null
                                  : normalizedStore.activePhone,
                              accounts: nextAccounts,
                            });
                            setConfirmDeletePhone(null);
                            setSelectedPhone(null);
                            setConsoleFeedback({
                              ok: true,
                              text: `Deleted account +63 ${activeMember.user.phone}.`,
                            });
                          }}
                          className="h-9 px-3 rounded-xl bg-red-600 text-white text-xs font-semibold"
                        >
                          Confirm Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeletePhone(activeMember.user.phone)}
                          aria-label="Delete member account"
                          className="h-9 w-9 rounded-xl border border-slate-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Balances */}
                  <div className="grid grid-cols-3 gap-3 tabular-nums">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Personal Wallet</p>
                      <p className="text-base font-display font-bold text-[#0B2545] mt-0.5">
                        {formatPhp(activeMember.wallets.personalPhp)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Income Wallet</p>
                      <p className="text-base font-display font-bold text-[#C8922A] mt-0.5">
                        {formatPhp(activeMember.wallets.incomePhp)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Security Deposit</p>
                      <p className="text-base font-display font-bold text-[#1570EF] mt-0.5">
                        {formatPhp(activeMember.wallets.securityDepositPhp)}
                      </p>
                    </div>
                  </div>

                  {/* Adjust Wallet */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <p className="text-xs font-bold text-[#0B2545] uppercase tracking-wide">
                      Adjust Member Balance
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <select
                        value={walletType}
                        onChange={(e) => setWalletType(e.target.value as 'personal' | 'income')}
                        aria-label="Select wallet to adjust"
                        className="h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold"
                      >
                        <option value="personal">Personal Wallet (Unlocks Invite)</option>
                        <option value="income">Income Wallet</option>
                      </select>
                      <input
                        type="number"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        placeholder="Amount PHP"
                        aria-label="Adjustment amount PHP"
                        className="h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                      />
                      <input
                        type="text"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        placeholder="Adjustment note"
                        aria-label="Adjustment note"
                        className="h-10 px-3 rounded-xl bg-slate-100 text-xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = ownerAdjustMemberWallet(
                            normalizedStore,
                            activeMember.user.phone,
                            walletType,
                            Math.abs(Number(adjustAmount) || 0),
                            adjustNote
                          );
                          onUpdateStore(res.store);
                          setConsoleFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Credit (+PHP)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = ownerAdjustMemberWallet(
                            normalizedStore,
                            activeMember.user.phone,
                            walletType,
                            -Math.abs(Number(adjustAmount) || 0),
                            adjustNote
                          );
                          onUpdateStore(res.store);
                          setConsoleFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="h-9 px-4 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-xs font-semibold"
                      >
                        Deduct (-PHP)
                      </button>
                    </div>
                  </div>

                  {/* Rank & Practice Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                      <p className="text-xs font-bold text-[#0B2545] flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#C8922A]" />
                        <span>Set Member Rank</span>
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {MEMBERSHIP_TIERS.map((tier) => (
                          <button
                            key={tier.code}
                            type="button"
                            onClick={() => {
                              const res = ownerSetMemberRank(
                                normalizedStore,
                                activeMember.user.phone,
                                tier.code as MembershipCode
                              );
                              onUpdateStore(res.store);
                              setConsoleFeedback({ ok: res.ok, text: res.message });
                            }}
                            className={`h-9 rounded-lg text-xs font-semibold border transition-colors ${
                              activeMember.user.level === tier.code
                                ? 'bg-[#0B2545] text-white border-[#0B2545]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {tier.code}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                      <p className="text-xs font-bold text-[#0B2545] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#1570EF]" />
                        <span>Practice &amp; Activity Controls</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const res = ownerGrantPracticeDraws(
                              normalizedStore,
                              activeMember.user.phone,
                              1,
                              0,
                              false
                            );
                            onUpdateStore(res.store);
                            setConsoleFeedback({ ok: res.ok, text: res.message });
                          }}
                          className="h-9 px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-semibold inline-flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>+1 Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = ownerGrantPracticeDraws(
                              normalizedStore,
                              activeMember.user.phone,
                              0,
                              1,
                              false
                            );
                            onUpdateStore(res.store);
                            setConsoleFeedback({ ok: res.ok, text: res.message });
                          }}
                          className="h-9 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold inline-flex items-center justify-center gap-1"
                        >
                          <Egg className="w-3.5 h-3.5" />
                          <span>+1 Egg</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = ownerGrantPracticeDraws(
                              normalizedStore,
                              activeMember.user.phone,
                              0,
                              0,
                              true
                            );
                            onUpdateStore(res.store);
                            setConsoleFeedback({ ok: res.ok, text: res.message });
                          }}
                          className="col-span-2 h-9 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B2545] text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset Daily Practice Tasks (5 Audits)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Member Payout E-Wallet Account Control */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                    <p className="text-xs font-bold text-[#0B2545]">
                      Member Withdrawal Receiving Account ({activeMember.user.bankAccount.walletType})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={editBankWallet}
                        onChange={(e) =>
                          setEditBankWallet(e.target.value as BankAccountInfo['walletType'])
                        }
                        aria-label="Member withdrawal wallet type"
                        className="h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold"
                      >
                        <option value="GCASH Wallet Account">GCASH Wallet Account</option>
                        <option value="Maya Wallet Account">Maya Wallet Account</option>
                        <option value="BDO Unibank">BDO Unibank</option>
                        <option value="UnionBank">UnionBank</option>
                      </select>
                      <input
                        type="text"
                        value={editBankNumber}
                        onChange={(e) => setEditBankNumber(e.target.value)}
                        placeholder={activeMember.user.bankAccount.accountNumber}
                        aria-label="Member withdrawal account number"
                        className="h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const num = editBankNumber.trim() || activeMember.user.bankAccount.accountNumber;
                          const res = ownerSetMemberBankAccount(
                            normalizedStore,
                            activeMember.user.phone,
                            {
                              ...activeMember.user.bankAccount,
                              walletType: editBankWallet,
                              accountNumber: num,
                            }
                          );
                          onUpdateStore(res.store);
                          setConsoleFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="h-10 px-4 rounded-xl bg-[#0B2545] text-white text-xs font-semibold"
                      >
                        Update Payout Account
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
          </div>
        )}

        {/* TAB 2: GCASH & MAYA DEPOSIT CHANNELS */}
        {activeTab === 'channels' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <h2 className="font-display font-bold text-base text-[#0B2545]">
                  {editingChannelId ? 'Edit GCash / Maya Channel' : 'Add GCash or Maya Receiving Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the official GCash &amp; Maya accounts shown to members on the Deposit screen.
                </p>
              </div>

              <form onSubmit={handleChannelSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {(['GCash', 'Maya'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setChProvider(prov)}
                      className={`h-11 rounded-xl border text-sm font-bold transition-colors ${
                        chProvider === prov
                          ? prov === 'GCash'
                            ? 'bg-[#1570EF] text-white border-[#1570EF]'
                            : 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {prov} Account
                    </button>
                  ))}
                </div>

                <div>
                  <label htmlFor="ch-name" className="block text-xs font-medium text-slate-600 mb-1">
                    Deposit Channel Label
                  </label>
                  <input
                    id="ch-name"
                    type="text"
                    value={chName}
                    onChange={(e) => setChName(e.target.value)}
                    placeholder={`e.g. GST Channel 1 · ${chProvider}`}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
                  />
                </div>

                <div>
                  <label htmlFor="ch-acct-name" className="block text-xs font-medium text-slate-600 mb-1">
                    {chProvider} Account Holder Name
                  </label>
                  <input
                    id="ch-acct-name"
                    type="text"
                    value={chAccountName}
                    onChange={(e) => setChAccountName(e.target.value)}
                    placeholder="Full registered name on GCash / Maya"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
                  />
                </div>

                <div>
                  <label htmlFor="ch-acct-num" className="block text-xs font-medium text-slate-600 mb-1">
                    {chProvider} Mobile / Account Number
                  </label>
                  <input
                    id="ch-acct-num"
                    type="text"
                    value={chAccountNumber}
                    onChange={(e) => setChAccountNumber(e.target.value)}
                    placeholder="e.g. 09171234567"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm font-mono tabular-nums focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="ch-min" className="block text-xs font-medium text-slate-600 mb-1">
                      Min PHP
                    </label>
                    <input
                      id="ch-min"
                      type="number"
                      min={1}
                      value={chMinPhp}
                      onChange={(e) => setChMinPhp(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="ch-max" className="block text-xs font-medium text-slate-600 mb-1">
                      Max PHP
                    </label>
                    <input
                      id="ch-max"
                      type="number"
                      min={10}
                      value={chMaxPhp}
                      onChange={(e) => setChMaxPhp(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ch-payment-url" className="block text-xs font-medium text-slate-600 mb-1">
                    {chProvider} Deep / Payment Link URL (optional)
                  </label>
                  <input
                    id="ch-payment-url"
                    type="text"
                    value={chPaymentUrl}
                    onChange={(e) => setChPaymentUrl(e.target.value)}
                    placeholder="Auto-generated if blank (or paste custom link)"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-100 text-xs"
                  />
                </div>

                <div>
                  <label htmlFor="ch-note" className="block text-xs font-medium text-slate-600 mb-1">
                    Payment Instructions (optional)
                  </label>
                  <input
                    id="ch-note"
                    type="text"
                    value={chInstructions}
                    onChange={(e) => setChInstructions(e.target.value)}
                    placeholder="e.g. Send exact amount & enter 13-digit Ref No."
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-100 text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{editingChannelId ? 'Save Channel Changes' : `Add ${chProvider} Channel`}</span>
                  </button>
                  {editingChannelId && (
                    <button
                      type="button"
                      onClick={resetChannelForm}
                      className="h-11 px-4 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-base text-[#0B2545]">
                    Configured GCash &amp; Maya Channels ({config.depositChannels.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Members only see Enabled channels on their Deposit screen.
                  </p>
                </div>
              </div>

              {config.depositChannels.length === 0 ? (
                <div className="py-14 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl">
                  <CreditCard className="w-9 h-9 text-slate-400 mx-auto" />
                  <p className="text-sm font-semibold text-[#0B2545]">
                    No GCash or Maya Channels Added Yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Use the form on the left to add your GCash and Maya receiving accounts. They will go live immediately for member deposits.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.depositChannels.map((ch) => (
                    <div
                      key={ch.id}
                      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        ch.enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-75'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              ch.provider === 'GCash'
                                ? 'bg-blue-100 text-[#1570EF]'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {ch.provider}
                          </span>
                          <span className="text-sm font-bold text-[#0B2545]">{ch.channelName}</span>
                          <span
                            className={`text-[11px] font-semibold ${
                              ch.enabled ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {ch.enabled ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 tabular-nums">
                          {ch.accountName} · <span className="font-mono">{ch.accountNumber}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          Limits: {formatPhp(ch.minPhp)} – {formatPhp(ch.maxPhp)}
                          {ch.instructions ? ` · ${ch.instructions}` : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const res = ownerToggleDepositChannel(
                              normalizedStore,
                              ch.id,
                              !ch.enabled
                            );
                            onUpdateStore(res.store);
                            setConsoleFeedback({ ok: res.ok, text: res.message });
                          }}
                          className={`h-9 px-3 rounded-lg text-xs font-semibold ${
                            ch.enabled
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {ch.enabled ? 'Pause' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadChannelForEdit(ch)}
                          aria-label={`Edit ${ch.channelName}`}
                          className="h-9 w-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = ownerDeleteDepositChannel(normalizedStore, ch.id);
                            onUpdateStore(res.store);
                            setConsoleFeedback({ ok: res.ok, text: res.message });
                          }}
                          aria-label={`Delete ${ch.channelName}`}
                          className="h-9 w-9 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 3: ALL TRANSACTIONS (DEPOSITS, WITHDRAWALS & FULL SYSTEM LEDGER) */}
        {activeTab === 'transactions' && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-base text-[#0B2545]">
                  All GST Transactions &amp; Payout Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Approve or reject Deposits &amp; Withdrawals (with automatic refund on rejected withdrawals), or audit every system transaction.
                </p>
              </div>
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxSubView('orders')}
                  className={`px-3 h-9 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                    txSubView === 'orders' ? 'bg-[#0B2545] text-white' : 'text-slate-600'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Deposits &amp; Withdrawals ({allLedgerRows.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxSubView('activity')}
                  className={`px-3 h-9 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                    txSubView === 'activity' ? 'bg-[#0B2545] text-white' : 'text-slate-600'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>All Wallet Activity ({allActivityRows.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 flex items-center bg-slate-100 rounded-xl px-3 h-10">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  placeholder="Search member phone, reference ID, channel, category..."
                  aria-label="Search transactions"
                  className="w-full bg-transparent text-xs focus:outline-none"
                />
              </div>
              <div className="md:col-span-4">
                <input
                  type="text"
                  value={ownerActionNote}
                  onChange={(e) => setOwnerActionNote(e.target.value)}
                  placeholder="Optional Owner review note (applied on Approve/Reject)"
                  aria-label="Owner transaction note"
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs"
                />
              </div>
              {txSubView === 'orders' && (
                <div className="md:col-span-3 flex gap-1 p-1 bg-slate-100 rounded-xl">
                  {(['all', 'pending', 'deposit', 'withdraw'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setLedgerFilter(mode)}
                      className={`flex-1 h-8 rounded-lg text-[11px] font-semibold capitalize ${
                        ledgerFilter === mode ? 'bg-[#1570EF] text-white' : 'text-slate-600'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {txSubView === 'orders' ? (
              filteredLedgerRows.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No matching deposit or withdrawal orders found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-2 pr-4">Member</th>
                        <th className="py-2 pr-4">Ref / Channel &amp; Acct</th>
                        <th className="py-2 pr-4 text-right">Amount / Fee</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 text-right">Owner Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLedgerRows.map((row) => {
                        const isPendingDeposit =
                          row.type === 'deposit' && row.status === 'Deposit to be confirmed';
                        const isPendingWithdraw =
                          row.type === 'withdraw' && row.status === 'Withdrawal to be confirmed';
                        return (
                          <tr key={`${row.memberPhone}-${row.id}`}>
                            <td className="py-3 pr-4">
                              <p className="font-semibold text-[#0B2545]">{row.memberName}</p>
                              <p className="text-xs text-slate-500">+63 {row.memberPhone}</p>
                            </td>
                            <td className="py-3 pr-4 text-xs">
                              <p className="font-mono text-slate-700">{row.id}</p>
                              <p className="font-semibold text-[#1570EF] uppercase">
                                {row.type} · <span className="normal-case text-slate-700">{row.channel}</span>
                              </p>
                              {row.channelAccountNumber && (
                                <p className="text-[11px] text-slate-500">
                                  To: {row.channelAccountName} ({row.channelAccountNumber})
                                </p>
                              )}
                              {row.senderReference && (
                                <p className="text-[11px] text-slate-600">Sender Ref: {row.senderReference}</p>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-right">
                              <p className="font-bold text-[#0B2545]">{formatPhp(row.amountPhp)}</p>
                              {row.feePhp > 0 && (
                                <p className="text-[11px] text-slate-500">
                                  Fee: {formatPhp(row.feePhp)} · Net: {formatPhp(row.amountPhp - row.feePhp)}
                                </p>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-xs">
                              <span
                                className={`font-semibold ${
                                  row.status.includes('successfully') || row.status.includes('Successful')
                                    ? 'text-emerald-700'
                                    : row.status.includes('confirmed')
                                    ? 'text-amber-700'
                                    : 'text-red-600'
                                }`}
                              >
                                {row.status}
                              </span>
                              <p className="text-[11px] text-slate-400">{row.timestamp}</p>
                            </td>
                            <td className="py-3 text-right">
                              {isPendingDeposit ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = ownerApproveDepositRecord(
                                        normalizedStore,
                                        row.memberPhone,
                                        row.id,
                                        ownerActionNote
                                      );
                                      onUpdateStore(res.store);
                                      setConsoleFeedback({ ok: res.ok, text: res.message });
                                    }}
                                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = ownerRejectDepositRecord(
                                        normalizedStore,
                                        row.memberPhone,
                                        row.id,
                                        ownerActionNote
                                      );
                                      onUpdateStore(res.store);
                                      setConsoleFeedback({ ok: res.ok, text: res.message });
                                    }}
                                    className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                  >
                                    Close
                                  </button>
                                </div>
                              ) : isPendingWithdraw ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = ownerApproveWithdrawalRecord(
                                        normalizedStore,
                                        row.memberPhone,
                                        row.id,
                                        ownerActionNote
                                      );
                                      onUpdateStore(res.store);
                                      setConsoleFeedback({ ok: res.ok, text: res.message });
                                    }}
                                    className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                  >
                                    Approve Payout
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = ownerRejectWithdrawalRecord(
                                        normalizedStore,
                                        row.memberPhone,
                                        row.id,
                                        ownerActionNote
                                      );
                                      onUpdateStore(res.store);
                                      setConsoleFeedback({ ok: res.ok, text: res.message });
                                    }}
                                    className="h-8 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                                  >
                                    Reject &amp; Refund
                                  </button>
                                </div>
                              ) : row.status.includes('closed') || row.status.includes('rejected') ? (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-semibold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Closed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Settled
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredActivityRows.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No wallet transactions recorded across accounts yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500">
                      <th className="py-2 pr-4">Member</th>
                      <th className="py-2 pr-4">Category &amp; Note</th>
                      <th className="py-2 pr-4">Timestamp</th>
                      <th className="py-2 pr-4 text-right">Amount</th>
                      <th className="py-2 text-right">Owner Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActivityRows.map((tx) => (
                      <tr key={`${tx.memberPhone}-${tx.id}`}>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-[#0B2545]">{tx.memberName}</p>
                          <p className="text-xs text-slate-500">+63 {tx.memberPhone}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs">
                          <p className="font-semibold text-[#0B2545]">{tx.category}</p>
                          <p className="text-slate-500">{tx.note}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">{tx.timestamp}</td>
                        <td
                          className={`py-3 pr-4 text-right font-bold ${
                            tx.direction === 'income' ? 'text-emerald-700' : 'text-[#0B2545]'
                          }`}
                        >
                          {tx.amountPhp >= 0 ? `+${formatPhp(tx.amountPhp)}` : formatPhp(tx.amountPhp)}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const res = ownerDeleteTransactionRecord(
                                normalizedStore,
                                tx.memberPhone,
                                tx.id
                              );
                              onUpdateStore(res.store);
                              setConsoleFeedback({ ok: res.ok, text: res.message });
                            }}
                            aria-label={`Remove transaction ${tx.id}`}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 4: ALL GST FEATURES, TRANSACTION RULES & SUPPORT */}
        {activeTab === 'features' && (
          <div className="space-y-5">
            {/* Transaction Workflow & Fee Rules */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-base text-[#0B2545]">
                    Deposit &amp; Withdrawal Approval Rules, Limits &amp; Fees
                  </h2>
                  <p className="text-xs text-slate-500">
                    Control whether deposits and withdrawals require manual Owner approval or settle automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStore({
                      ...normalizedStore,
                      systemConfig: {
                        ...config,
                        practiceMode: !config.practiceMode,
                      },
                    });
                    setConsoleFeedback({
                      ok: true,
                      text: `Practice Mode ${!config.practiceMode ? 'enabled' : 'disabled'}.`,
                    });
                  }}
                  className={`h-9 px-3.5 rounded-xl text-xs font-semibold ${
                    config.practiceMode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {config.practiceMode ? 'Practice Mode: ON' : 'Practice Mode: OFF'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0B2545]">Deposit Processing Mode</p>
                    <p className="text-xs text-slate-500">
                      {config.depositApprovalMode === 'manual'
                        ? 'Manual: Owner approves every GCash/Maya deposit'
                        : 'Auto: Deposits credit immediately upon submit'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = config.depositApprovalMode === 'manual' ? 'auto' : 'manual';
                      const res = ownerUpdateTransactionRules(normalizedStore, {
                        depositApprovalMode: nextMode,
                      });
                      onUpdateStore(res.store);
                      setConsoleFeedback({
                        ok: true,
                        text: `Deposit mode set to ${nextMode === 'manual' ? 'Manual Owner Approval' : 'Auto-Credit'}.`,
                      });
                    }}
                    className={`h-9 px-3.5 rounded-lg text-xs font-semibold shrink-0 ${
                      config.depositApprovalMode === 'manual'
                        ? 'bg-[#0B2545] text-white'
                        : 'bg-[#1570EF] text-white'
                    }`}
                  >
                    {config.depositApprovalMode === 'manual' ? 'Manual Review' : 'Auto Credit'}
                  </button>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0B2545]">Withdrawal Processing Mode</p>
                    <p className="text-xs text-slate-500">
                      {config.withdrawApprovalMode === 'manual'
                        ? 'Manual: Owner approves or rejects/refunds payouts'
                        : 'Auto: Withdrawals settle immediately'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = config.withdrawApprovalMode === 'manual' ? 'auto' : 'manual';
                      const res = ownerUpdateTransactionRules(normalizedStore, {
                        withdrawApprovalMode: nextMode,
                      });
                      onUpdateStore(res.store);
                      setConsoleFeedback({
                        ok: true,
                        text: `Withdrawal mode set to ${nextMode === 'manual' ? 'Manual Owner Payout' : 'Auto Settle'}.`,
                      });
                    }}
                    className={`h-9 px-3.5 rounded-lg text-xs font-semibold shrink-0 ${
                      config.withdrawApprovalMode === 'manual'
                        ? 'bg-[#0B2545] text-white'
                        : 'bg-[#1570EF] text-white'
                    }`}
                  >
                    {config.withdrawApprovalMode === 'manual' ? 'Manual Payout' : 'Auto Settle'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label htmlFor="rule-min-dep" className="block text-[11px] text-slate-500 mb-1">
                    Min Deposit (PHP)
                  </label>
                  <input
                    id="rule-min-dep"
                    type="number"
                    min={1}
                    value={ruleMinDep}
                    onChange={(e) => setRuleMinDep(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="rule-max-dep" className="block text-[11px] text-slate-500 mb-1">
                    Max Deposit (PHP)
                  </label>
                  <input
                    id="rule-max-dep"
                    type="number"
                    min={10}
                    value={ruleMaxDep}
                    onChange={(e) => setRuleMaxDep(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="rule-min-wdr" className="block text-[11px] text-slate-500 mb-1">
                    Min Withdraw (PHP)
                  </label>
                  <input
                    id="rule-min-wdr"
                    type="number"
                    min={1}
                    value={ruleMinWdr}
                    onChange={(e) => setRuleMinWdr(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="rule-inc-fee" className="block text-[11px] text-slate-500 mb-1">
                    Income Fee (%)
                  </label>
                  <input
                    id="rule-inc-fee"
                    type="number"
                    min={0}
                    max={50}
                    value={ruleIncFee}
                    onChange={(e) => setRuleIncFee(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="rule-pers-fee" className="block text-[11px] text-slate-500 mb-1">
                    Personal Fee (%)
                  </label>
                  <input
                    id="rule-pers-fee"
                    type="number"
                    min={0}
                    max={50}
                    value={rulePersFee}
                    onChange={(e) => setRulePersFee(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = ownerUpdateTransactionRules(normalizedStore, {
                    minDepositPhp: Number(ruleMinDep),
                    maxDepositPhp: Number(ruleMaxDep),
                    minWithdrawPhp: Number(ruleMinWdr),
                    incomeWithdrawFeePct: Number(ruleIncFee),
                    personalWithdrawFeePct: Number(rulePersFee),
                  });
                  onUpdateStore(res.store);
                  setConsoleFeedback({ ok: res.ok, text: res.message });
                }}
                className="h-10 px-5 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white text-xs font-semibold"
              >
                Save Transaction Limits &amp; Fees
              </button>
            </section>

            {/* All GST Feature Switches */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <h2 className="font-display font-bold text-base text-[#0B2545]">
                  GST Feature Availability Controls
                </h2>
                <p className="text-xs text-slate-500">
                  Enable or pause any GST module across all member accounts in real time.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FEATURE_LABELS.map((item) => {
                  const active = config.features[item.key];
                  return (
                    <div
                      key={item.key}
                      className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B2545]">{item.label}</p>
                        <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = ownerToggleFeatureFlag(normalizedStore, item.key, !active);
                          onUpdateStore(res.store);
                          setConsoleFeedback({
                            ok: true,
                            text: `${item.label} ${!active ? 'Enabled' : 'Paused'}.`,
                          });
                        }}
                        className={`h-8 px-3 rounded-lg text-[11px] font-semibold shrink-0 ${
                          active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {active ? 'Enabled' : 'Paused'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Gift Codes */}
              <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div>
                  <h2 className="font-display font-bold text-base text-[#0B2545]">
                    Cash Gift Codes
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage active gift codes redeemable by members.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGiftCode}
                    onChange={(e) => setNewGiftCode(e.target.value)}
                    placeholder="Code (e.g. GST500)"
                    className="flex-1 h-10 px-3 rounded-xl bg-slate-100 text-xs uppercase font-semibold"
                  />
                  <input
                    type="number"
                    min={1}
                    value={newGiftPhp}
                    onChange={(e) => setNewGiftPhp(e.target.value)}
                    placeholder="PHP"
                    className="w-24 h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const clean = newGiftCode.trim().toUpperCase();
                      const amt = Number(newGiftPhp);
                      if (!clean || !Number.isFinite(amt) || amt <= 0) return;
                      onUpdateStore({
                        ...normalizedStore,
                        systemConfig: {
                          ...config,
                          giftCodes: { ...config.giftCodes, [clean]: amt },
                        },
                      });
                      setNewGiftCode('');
                      setConsoleFeedback({ ok: true, text: `Added Cash Gift code ${clean} (${formatPhp(amt)}).` });
                    }}
                    className="h-10 px-4 rounded-xl bg-[#C8922A] text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {Object.entries(config.giftCodes).map(([code, amt]) => (
                    <div key={code} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#0B2545]">{code}</span>
                        <span className="ml-2 text-emerald-700 font-semibold tabular-nums">
                          {formatPhp(amt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextCodes = { ...config.giftCodes };
                          delete nextCodes[code];
                          onUpdateStore({
                            ...normalizedStore,
                            systemConfig: { ...config, giftCodes: nextCodes },
                          });
                        }}
                        aria-label={`Remove gift code ${code}`}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Announcements */}
              <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div>
                  <h2 className="font-display font-bold text-base text-[#0B2545] flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#C8922A]" />
                    <span>Live System Announcements</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ticker notices displayed across every member&apos;s Home screen.
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAnnouncement}
                    onChange={(e) => setNewAnnouncement(e.target.value)}
                    placeholder="Enter new announcement banner text..."
                    className="flex-1 h-10 px-3 rounded-xl bg-slate-100 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAnnouncement.trim()) return;
                      onUpdateStore({
                        ...normalizedStore,
                        systemConfig: {
                          ...config,
                          announcements: [newAnnouncement.trim(), ...config.announcements],
                        },
                      });
                      setNewAnnouncement('');
                      setConsoleFeedback({ ok: true, text: 'Published new announcement.' });
                    }}
                    className="h-10 px-4 rounded-xl bg-[#0B2545] text-white text-xs font-semibold"
                  >
                    Publish
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {config.announcements.map((msg, idx) => (
                    <div
                      key={`${idx}-${msg.slice(0, 10)}`}
                      className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 flex items-start justify-between gap-2 text-xs text-slate-700"
                    >
                      <span>{msg}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateStore({
                            ...normalizedStore,
                            systemConfig: {
                              ...config,
                              announcements: config.announcements.filter((_, i) => i !== idx),
                            },
                          });
                        }}
                        className="text-red-600 font-semibold shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Support Reply Desk */}
              <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display font-bold text-base text-[#0B2545] flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-emerald-600" />
                      <span>Member Support Reply Desk</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Inspect and reply directly to any member&apos;s GST Online Customer Service chat.
                    </p>
                  </div>
                  {allMembers.length > 0 && (
                    <select
                      value={activeChatMember?.user.phone ?? ''}
                      onChange={(e) => setChatPhone(e.target.value)}
                      aria-label="Select member chat"
                      className="h-10 px-3 rounded-xl bg-slate-100 text-xs font-semibold"
                    >
                      {allMembers.map((acct) => (
                        <option key={acct.user.phone} value={acct.user.phone}>
                          +63 {acct.user.phone} · {acct.user.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {!activeChatMember ? (
                  <p className="text-xs text-slate-500">No registered members yet.</p>
                ) : (
                  <>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 max-h-52 overflow-y-auto">
                      {activeChatMember.chatHistory.map((m) => (
                        <div
                          key={m.id}
                          className={`text-xs p-2.5 rounded-xl max-w-xl ${
                            m.sender === 'user'
                              ? 'bg-white border border-slate-200 text-slate-800'
                              : 'bg-[#0B2545] text-white ml-auto'
                          }`}
                        >
                          <p>{m.text}</p>
                          <p className="text-[10px] opacity-70 mt-1 tabular-nums">{m.timestamp}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatReply}
                        onChange={(e) => setChatReply(e.target.value)}
                        placeholder={`Reply to +63 ${activeChatMember.user.phone}...`}
                        className="flex-1 h-10 px-3.5 rounded-xl bg-slate-100 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = ownerReplyToMemberChat(
                            normalizedStore,
                            activeChatMember.user.phone,
                            chatReply
                          );
                          if (res.ok) {
                            onUpdateStore(res.store);
                            setChatReply('');
                          }
                          setConsoleFeedback({ ok: res.ok, text: res.message });
                        }}
                        className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        )}

        {/* TAB 5: OWNER ACCOUNT & SEPARATE LINK */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-display font-bold text-base text-[#0B2545]">
                Separated Portal Links
              </h2>
              <p className="text-xs text-slate-500">
                Use the dedicated Owner Portal link below to manage the system separately from the member portal.
              </p>

              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5">
                  <p className="text-xs font-semibold text-[#0B2545]">Owner Management Link</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-[#1570EF] break-all">{ownerPortalUrl}</code>
                    <button
                      type="button"
                      onClick={() => copyLink('sec-owner', ownerPortalUrl)}
                      className="h-8 px-3 rounded-lg bg-[#0B2545] text-white text-xs font-semibold shrink-0"
                    >
                      {copiedKey === 'sec-owner' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-1.5">
                  <p className="text-xs font-semibold text-[#0B2545]">Member Sign-In Link</p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-xs text-slate-700 break-all">{memberPortalUrl}</code>
                    <button
                      type="button"
                      onClick={() => copyLink('sec-member', memberPortalUrl)}
                      className="h-8 px-3 rounded-lg bg-[#1570EF] text-white text-xs font-semibold shrink-0"
                    >
                      {copiedKey === 'sec-member' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-display font-bold text-base text-[#0B2545]">
                Update Owner Account Credentials
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = updateOwnerProfile(
                    normalizedStore,
                    editOwnerId,
                    editOwnerName,
                    editOwnerNewPwd.trim() || undefined
                  );
                  if (res.ok) {
                    onUpdateStore(res.store);
                    setEditOwnerNewPwd('');
                  }
                  setConsoleFeedback({ ok: res.ok, text: res.message });
                }}
                className="space-y-3"
              >
                <div>
                  <label htmlFor="edit-owner-id" className="block text-xs text-slate-500 mb-1">
                    Owner ID
                  </label>
                  <input
                    id="edit-owner-id"
                    type="text"
                    value={editOwnerId}
                    onChange={(e) => setEditOwnerId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-owner-name" className="block text-xs text-slate-500 mb-1">
                    Owner Display Name
                  </label>
                  <input
                    id="edit-owner-name"
                    type="text"
                    value={editOwnerName}
                    onChange={(e) => setEditOwnerName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-owner-pwd" className="block text-xs text-slate-500 mb-1">
                    New Owner Password (optional)
                  </label>
                  <input
                    id="edit-owner-pwd"
                    type="password"
                    value={editOwnerNewPwd}
                    onChange={(e) => setEditOwnerNewPwd(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white text-sm font-semibold"
                >
                  Save Owner Credentials
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
