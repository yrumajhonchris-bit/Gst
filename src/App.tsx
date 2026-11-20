import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckSquare,
  Globe,
  Home,
  Mail,
  MessageCircle,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { createFreshAccountState } from './data/ghaSeed';
import {
  advanceInvestmentDay,
  completeHotelTask,
  drawSurpriseCard,
  formatNowTimestamp,
  formatPhp,
  generateTxId,
  investInFund,
  isValidPhPhone,
  normalizePhPhone,
  processDeposit,
  processWithdrawal,
  redeemCashGiftCode,
  resetDailyTasks,
  smashGoldenEgg,
  upgradeMembershipTier,
} from './lib/ghaEngine';
import { t } from './lib/i18n';
import {
  AccountsStore,
  BankAccountInfo,
  DeliveryAddress,
  DepositChannel,
  GhaAppState,
  HotelTask,
  MailMessage,
  MembershipCode,
  NavTab,
  SubView,
  SystemFeatureFlags,
} from './types/gha';
import {
  AddressView,
  AgreementsView,
  BankAccountView,
  CouponView,
  FinancialRecordsView,
  MailView,
  SettingsView,
  TransactionRecordsView,
} from './components/AccountSubViews';
import {
  CashGiftView,
  CustomerServiceDrawer,
  GoldenEggView,
  InfoPagesView,
  SportsWatchView,
  SurpriseCardView,
  VipJourneyView,
} from './components/ActivitiesAndInfoViews';
import { AuthView } from './components/AuthView';
import { GhaLogo } from './components/GhaLogo';
import { HomeView } from './components/HomeView';
import { MineView } from './components/MineView';
import { OwnerPortal } from './components/OwnerPortal';
import { TaskDetailsView, TaskView } from './components/TaskView';
import { TeamView } from './components/TeamView';
import { DepositView, WithdrawView } from './components/WalletModals';
import { WealthView } from './components/WealthView';
import {
  ensureStoreDefaults,
  requestMemberVerificationCode,
  verifyMemberOtpCode,
} from './lib/ownerEngine';

const STORAGE_KEY = 'gst_accounts_store_v2';

function checkIsOwnerRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return hash.startsWith('#/owner') || params.get('owner') === '1' || params.get('mode') === 'owner';
}

function loadInitialStore(): AccountsStore {
  try {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart') === '1';
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AccountsStore;
      if (parsed && parsed.accounts && typeof parsed.accounts === 'object') {
        const base = ensureStoreDefaults(parsed);
        if (autostart && base.activePhone && base.accounts[base.activePhone]) {
          return {
            ...base,
            activePhone: base.activePhone,
            accounts: {
              ...base.accounts,
              [base.activePhone]: {
                ...base.accounts[base.activePhone],
                isAuthenticated: true,
              },
            },
          };
        }
        return base;
      }
    }
    return ensureStoreDefaults({ activePhone: null, accounts: {} });
  } catch {
    return ensureStoreDefaults({ activePhone: null, accounts: {} });
  }
}

const SUBVIEW_TITLES: Record<SubView, string> = {
  none: '',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  'task-details': 'Task Details',
  settings: 'Settings',
  'bank-account': 'Bank Account',
  address: 'Address',
  'financial-records': 'Financial Records',
  'transaction-records': 'Transaction Records',
  agreements: 'My Agreements',
  mail: 'Mail & Notices',
  'mail-detail': 'Mail Details',
  'surprise-card': 'Surprise Card',
  'golden-egg': 'Golden Egg Smash',
  'cash-gift': 'Cash Gift',
  coupon: 'Fund Coupons',
  'vip-journey': 'VIP Journey',
  'about-us': 'About Us',
  news: 'GST News',
  'employee-manual': 'Employee Manual',
  'sports-watch': 'Sports Watch Benefit',
  campaigns: 'Active Campaigns',
};

export default function App() {
  const [store, setStore] = useState<AccountsStore>(() => loadInitialStore());
  const [isOwnerRoute, setIsOwnerRoute] = useState<boolean>(() => checkIsOwnerRoute());
  const [authLanguage, setAuthLanguage] = useState<'en' | 'tl'>('en');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [subView, setSubView] = useState<SubView>('none');
  const [selectedTask, setSelectedTask] = useState<HotelTask | null>(null);
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const activeAccount =
    store.activePhone && store.accounts[store.activePhone]
      ? store.accounts[store.activePhone]
      : null;

  useEffect(() => {
    const onHashChange = () => setIsOwnerRoute(checkIsOwnerRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignore quota errors
    }
  }, [store]);

  const openOwnerPortal = () => {
    window.location.hash = '#/owner';
    setIsOwnerRoute(true);
  };

  const exitOwnerPortal = () => {
    if (window.location.hash.toLowerCase().startsWith('#/owner')) {
      window.location.hash = '';
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('owner');
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.pathname + url.search);
    setIsOwnerRoute(false);
  };

  const setState = (updater: GhaAppState | ((prev: GhaAppState) => GhaAppState)) => {
    setStore((prevStore) => {
      if (!prevStore.activePhone || !prevStore.accounts[prevStore.activePhone]) {
        return prevStore;
      }
      const current = prevStore.accounts[prevStore.activePhone];
      const next = typeof updater === 'function' ? updater(current) : updater;
      return {
        ...prevStore,
        accounts: {
          ...prevStore.accounts,
          [prevStore.activePhone]: next,
        },
      };
    });
  };

  const toggleLanguage = () => {
    if (!activeAccount || !activeAccount.isAuthenticated) {
      setAuthLanguage((prev) => (prev === 'en' ? 'tl' : 'en'));
      return;
    }
    setState((prev) => ({
      ...prev,
      language: prev.language === 'en' ? 'tl' : 'en',
    }));
  };

  const handleLogin = (phone: string, password: string) => {
    if (!isValidPhPhone(phone)) {
      return { ok: false, message: 'Please enter a valid 10-digit +63 phone number.' };
    }
    if (!password) {
      return { ok: false, message: 'Please enter your password.' };
    }
    const cleanPhone = normalizePhPhone(phone);
    const found = store.accounts[cleanPhone];
    if (!found) {
      return {
        ok: false,
        message: `No verified GST account found for +63 ${cleanPhone}. Please register first.`,
      };
    }
    if (password !== found.user.loginPassword) {
      return { ok: false, message: 'Incorrect password.' };
    }
    setStore((prev) => ({
      ...prev,
      activePhone: cleanPhone,
      accounts: {
        ...prev.accounts,
        [cleanPhone]: { ...prev.accounts[cleanPhone], isAuthenticated: true },
      },
    }));
    setActiveTab('home');
    setSubView('none');
    return { ok: true, message: 'Login successful!' };
  };

  const handleRequestVerificationCode = (phone: string) => {
    const res = requestMemberVerificationCode(store, phone);
    if (res.ok) {
      setStore(res.store);
    }
    return { ok: res.ok, message: res.message };
  };

  const handleVerifyOtpCode = (phone: string, otp: string) => {
    return verifyMemberOtpCode(store, phone, otp);
  };

  const handleRegister = (
    phone: string,
    password: string,
    confirmPassword: string,
    inviteCode: string,
    otpVerified: boolean,
    otpCode: string
  ) => {
    if (!isValidPhPhone(phone)) {
      return { ok: false, message: 'Please enter a valid 10-digit +63 mobile number starting with 9.' };
    }
    const cleanPhone = normalizePhPhone(phone);
    const otpCheck = otpVerified ? { ok: true, message: '' } : verifyMemberOtpCode(store, cleanPhone, otpCode);
    if (!otpCheck.ok) {
      return {
        ok: false,
        message:
          otpCheck.message ||
          'Please request and verify the 6-digit code issued by the GST System Owner first.',
      };
    }
    if (store.accounts[cleanPhone]) {
      return {
        ok: false,
        message: `Phone +63 ${cleanPhone} is already registered. Please sign in instead.`,
      };
    }
    if (password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters.' };
    }
    if (password !== confirmPassword) {
      return { ok: false, message: 'Passwords do not match.' };
    }
    const freshAccount = createFreshAccountState(
      cleanPhone,
      password,
      inviteCode.trim().toUpperCase() || undefined
    );
    freshAccount.language = authLanguage;
    setStore((prev) => {
      const nextPending = { ...(prev.pendingVerifications ?? {}) };
      delete nextPending[cleanPhone];
      return {
        ...prev,
        activePhone: cleanPhone,
        pendingVerifications: nextPending,
        accounts: {
          ...prev.accounts,
          [cleanPhone]: freshAccount,
        },
      };
    });
    setActiveTab('home');
    setSubView('none');
    return { ok: true, message: 'Phone verified and GST account created!' };
  };

  const handleLogout = () => {
    setStore((prev) => {
      if (!prev.activePhone || !prev.accounts[prev.activePhone]) {
        return { ...prev, activePhone: null };
      }
      return {
        ...prev,
        activePhone: null,
        accounts: {
          ...prev.accounts,
          [prev.activePhone]: {
            ...prev.accounts[prev.activePhone],
            isAuthenticated: false,
          },
        },
      };
    });
    setSubView('none');
    setSelectedTask(null);
    setSelectedMail(null);
  };

  const handleNavigateTab = (tab: NavTab) => {
    setActiveTab(tab);
    setSubView('none');
    setSelectedTask(null);
    setSelectedMail(null);
  };

  const handleOpenSubView = (view: SubView) => {
    setSubView(view);
  };

  const handleBackSubView = () => {
    if (subView === 'bank-account') {
      setSubView('settings');
      return;
    }
    if (subView === 'mail-detail') {
      setSelectedMail(null);
      setSubView('mail');
      return;
    }
    setSubView('none');
    setSelectedTask(null);
  };

  const handleSendChatMessage = (text: string) => {
    const now = formatNowTimestamp().slice(0, 5);
    const csEnabled = store.systemConfig?.features?.customerServiceEnabled ?? true;
    const lower = text.toLowerCase();
    let reply = !csEnabled
      ? 'GST Live Customer Service replies are currently paused by the System Owner. Your message has been logged for Owner review.'
      : 'Thank you for contacting GST Online Customer Service. Your Hiring Manager & System Owner have received your message and will verify your request shortly.';
    if (csEnabled) {
      if (lower.includes('watch') || lower.includes('address')) {
        reply =
          'To receive your GST Sports Watch, reach Rank B1 or invite 5 members, then save your Philippine shipping address in Mine -> Address or Sports Watch Rewards.';
      } else if (lower.includes('deposit') || lower.includes('gcash') || lower.includes('maya')) {
        reply =
          'Send your deposit to the active GCash or Maya account listed under Deposit, submit your reference number, and the GST Owner will confirm it promptly. A completed deposit unlocks your invitation code.';
      } else if (lower.includes('b1') || lower.includes('upgrade')) {
        reply =
          'You can upgrade from A0 to A1, A2, or B1 anytime under Home -> VIP Journey using your Personal Wallet balance, earning up to 438 PHP KPI Sprint promotion bonus!';
      }
    }

    setState((prev) => ({
      ...prev,
      chatHistory: [
        ...prev.chatHistory,
        { id: generateTxId('u'), sender: 'user', text, timestamp: now },
        { id: generateTxId('a'), sender: 'agent', text: reply, timestamp: now },
      ],
    }));
  };

  if (isOwnerRoute) {
    return (
      <OwnerPortal
        store={store}
        onUpdateStore={setStore}
        onExitOwnerPortal={exitOwnerPortal}
      />
    );
  }

  if (!activeAccount || !activeAccount.isAuthenticated) {
    return (
      <AuthView
        language={authLanguage}
        onToggleLanguage={toggleLanguage}
        onLogin={handleLogin}
        onRequestVerificationCode={handleRequestVerificationCode}
        onVerifyOtpCode={handleVerifyOtpCode}
        onRegister={handleRegister}
        onOpenOwnerPortal={openOwnerPortal}
      />
    );
  }

  const state = activeAccount;

  const unreadCount = state.mails.filter((m) => !m.read).length;

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: t(state.language, 'home'), icon: <Home className="w-5 h-5" /> },
    { id: 'wealth', label: t(state.language, 'wealth'), icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'team', label: t(state.language, 'team'), icon: <Users className="w-5 h-5" /> },
    { id: 'task', label: t(state.language, 'task'), icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'mine', label: t(state.language, 'mine'), icon: <User className="w-5 h-5" /> },
  ];

  const sysCfg = ensureStoreDefaults(store).systemConfig!;
  const feat: SystemFeatureFlags = sysCfg.features;

  const featurePausedBanner = (title: string) => (
    <div className="max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 p-6 text-center space-y-2">
      <p className="font-display font-bold text-lg text-[#0B2545]">{title} Paused</p>
      <p className="text-sm text-slate-600">
        This GST feature is currently paused by the System Owner. Please check back later or contact GST Customer Service.
      </p>
    </div>
  );

  const renderSubView = () => {
    switch (subView) {
      case 'deposit':
        return (
          <DepositView
            state={state}
            channels={sysCfg.depositChannels}
            depositsEnabled={feat.depositsEnabled}
            depositApprovalMode={sysCfg.depositApprovalMode}
            minDepositPhp={sysCfg.minDepositPhp}
            maxDepositPhp={sysCfg.maxDepositPhp}
            onDeposit={(amt, channel: DepositChannel, senderRef: string) => {
              if (!feat.depositsEnabled) {
                return { ok: false, message: 'Deposits are currently paused by the GST Owner.' };
              }
              const res = processDeposit(state, amt, channel.channelName, channel.provider, {
                approvalMode: sysCfg.depositApprovalMode,
                minPhp: Math.max(sysCfg.minDepositPhp, channel.minPhp || sysCfg.minDepositPhp),
                maxPhp: Math.min(sysCfg.maxDepositPhp, channel.maxPhp || sysCfg.maxDepositPhp),
                channelId: channel.id,
                channelAccountName: channel.accountName,
                channelAccountNumber: channel.accountNumber,
                senderReference: senderRef,
              });
              if (res.ok) setState(res.state);
              return res;
            }}
            onOpenRecords={() => setSubView('financial-records')}
          />
        );
      case 'withdraw':
        return (
          <WithdrawView
            state={state}
            withdrawalsEnabled={feat.withdrawalsEnabled}
            withdrawApprovalMode={sysCfg.withdrawApprovalMode}
            minWithdrawPhp={sysCfg.minWithdrawPhp}
            incomeFeePct={sysCfg.incomeWithdrawFeePct}
            personalFeePct={sysCfg.personalWithdrawFeePct}
            onWithdraw={(amt, wType, pin) => {
              if (!feat.withdrawalsEnabled) {
                return { ok: false, message: 'Withdrawals are currently paused by the GST Owner.' };
              }
              const feePct =
                wType === 'income' ? sysCfg.incomeWithdrawFeePct : sysCfg.personalWithdrawFeePct;
              const res = processWithdrawal(state, amt, wType, pin, {
                approvalMode: sysCfg.withdrawApprovalMode,
                minPhp: sysCfg.minWithdrawPhp,
                feePct,
              });
              if (res.ok) setState(res.state);
              return res;
            }}
          />
        );
      case 'task-details':
        if (!feat.tasksEnabled) return featurePausedBanner('Hospitality Tasks');
        return selectedTask ? (
          <TaskDetailsView
            task={state.tasks.find((item) => item.id === selectedTask.id) ?? selectedTask}
            onBack={() => setSubView('none')}
            onSubmitReview={(taskId, rating, note) => {
              const res = completeHotelTask(state, taskId, rating, note);
              if (res.ok) setState(res.state);
              return res;
            }}
          />
        ) : null;
      case 'settings':
        return (
          <SettingsView
            state={state}
            onOpenSubView={handleOpenSubView}
            onChangePassword={(kind, oldPwd, newPwd, confirmPwd) => {
              const current =
                kind === 'transaction' ? state.user.transactionPassword : state.user.loginPassword;
              if (oldPwd !== current) {
                return { ok: false, message: 'Current password is incorrect.' };
              }
              if (newPwd.length < 6) {
                return { ok: false, message: 'New password must be at least 6 characters.' };
              }
              if (newPwd !== confirmPwd) {
                return { ok: false, message: 'Confirmation password does not match.' };
              }
              setState((prev) => ({
                ...prev,
                user: {
                  ...prev.user,
                  transactionPassword:
                    kind === 'transaction' ? newPwd : prev.user.transactionPassword,
                  loginPassword: kind === 'login' ? newPwd : prev.user.loginPassword,
                },
              }));
              return { ok: true, message: 'Password updated successfully!' };
            }}
            onClearCache={() => {}}
            onLogout={handleLogout}
          />
        );
      case 'bank-account':
        return (
          <BankAccountView
            bankAccount={state.user.bankAccount}
            onSave={(info: BankAccountInfo) =>
              setState((prev) => ({ ...prev, user: { ...prev.user, bankAccount: info } }))
            }
            onBack={() => setSubView('settings')}
          />
        );
      case 'address':
        return (
          <AddressView
            addresses={state.addresses}
            onAddAddress={(addr: Omit<DeliveryAddress, 'id'>) =>
              setState((prev) => ({
                ...prev,
                addresses: [{ ...addr, id: generateTxId('addr') }, ...prev.addresses],
              }))
            }
          />
        );
      case 'financial-records':
        return <FinancialRecordsView state={state} />;
      case 'transaction-records':
        return <TransactionRecordsView state={state} />;
      case 'agreements':
        return <AgreementsView state={state} />;
      case 'coupon':
        return (
          <CouponView
            state={state}
            onUseCoupon={() => {
              setActiveTab('wealth');
              setSubView('none');
            }}
          />
        );
      case 'mail':
      case 'mail-detail':
        return (
          <MailView
            mails={state.mails}
            selectedMail={subView === 'mail-detail' ? selectedMail : null}
            onSelectMail={(mail) => {
              setSelectedMail(mail);
              setSubView('mail-detail');
              setState((prev) => ({
                ...prev,
                mails: prev.mails.map((m) => (m.id === mail.id ? { ...m, read: true } : m)),
              }));
            }}
            onBackToList={() => {
              setSelectedMail(null);
              setSubView('mail');
            }}
          />
        );
      case 'surprise-card':
        if (!feat.surpriseCardEnabled) return featurePausedBanner('Surprise Card Draw');
        return (
          <SurpriseCardView
            state={state}
            onDrawCard={(slot) => {
              const res = drawSurpriseCard(state, slot);
              if (res.ok) setState(res.state);
              return res;
            }}
          />
        );
      case 'golden-egg':
        if (!feat.goldenEggEnabled) return featurePausedBanner('Golden Egg Smash');
        return (
          <GoldenEggView
            state={state}
            onSmashEgg={(idx) => {
              const res = smashGoldenEgg(state, idx);
              if (res.ok) setState(res.state);
              return res;
            }}
          />
        );
      case 'cash-gift':
        if (!feat.cashGiftEnabled) return featurePausedBanner('Cash Gift & Check-In');
        return (
          <CashGiftView
            state={state}
            giftCodes={sysCfg.giftCodes}
            onRedeemCode={(code) => {
              const res = redeemCashGiftCode(state, code, sysCfg.giftCodes);
              if (res.ok) setState(res.state);
              return res;
            }}
            onClaimDailyCheckIn={() => {
              if (state.inventory.dailyCheckInClaimed) {
                return { ok: false, message: 'Daily gift already claimed.' };
              }
              const timestamp = formatNowTimestamp();
              setState((prev) => ({
                ...prev,
                inventory: { ...prev.inventory, dailyCheckInClaimed: true },
                wallets: { ...prev.wallets, incomePhp: prev.wallets.incomePhp + 18 },
                earnings: {
                  ...prev.earnings,
                  todayPhp: prev.earnings.todayPhp + 18,
                  thisWeekPhp: prev.earnings.thisWeekPhp + 18,
                  thisMonthPhp: prev.earnings.thisMonthPhp + 18,
                  totalIncomePhp: prev.earnings.totalIncomePhp + 18,
                },
                transactionRecords: [
                  {
                    id: generateTxId('tx'),
                    direction: 'income',
                    category: 'Daily Cash Gift',
                    amountPhp: 18,
                    timestamp,
                    note: 'Daily attendance bonus',
                  },
                  ...prev.transactionRecords,
                ],
              }));
              return { ok: true, message: 'Daily Cash Gift of PHP 18.00 credited!' };
            }}
          />
        );
      case 'sports-watch':
        if (!feat.sportsWatchEnabled) return featurePausedBanner('Sports Watch Benefit');
        return (
          <SportsWatchView
            state={state}
            onClaimWatch={(color) => {
              setState((prev) => ({
                ...prev,
                inventory: {
                  ...prev.inventory,
                  sportsWatchClaimed: true,
                  sportsWatchColor: color,
                },
              }));
              return {
                ok: true,
                message: `${color} GST Sports Watch claimed! Shipping details registered.`,
              };
            }}
            onUpgradeToB1={() => setSubView('vip-journey')}
          />
        );
      case 'vip-journey':
        if (!feat.vipUpgradeEnabled) return featurePausedBanner('VIP Rank Upgrades');
        return (
          <VipJourneyView
            state={state}
            onUpgradeTier={(code: MembershipCode) => {
              const res = upgradeMembershipTier(state, code);
              if (res.ok) setState(res.state);
              return res;
            }}
          />
        );
      case 'about-us':
      case 'news':
      case 'employee-manual':
      case 'campaigns':
        return <InfoPagesView page={subView} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <GhaLogo size="sm" onClick={openOwnerPortal} />
        </div>

        <nav className="flex-1 p-4 space-y-1.5" aria-label="Primary Sidebar Navigation">
          {navItems.map((item) => {
            const active = activeTab === item.id && subView === 'none';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigateTab(item.id)}
                className={`w-full h-11 px-4 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#0B2545] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <p className="text-xs text-slate-500">Income · Personal</p>
            <p className="text-sm font-display font-bold text-[#0B2545] tabular-nums mt-0.5">
              {formatPhp(state.wallets.incomePhp)}
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              {formatPhp(state.wallets.personalPhp)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t(state.language, 'customerService')}</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Compact Sticky Top Bar (52px height to respect <=15% mobile sticky cap) */}
        <header className="sticky top-0 z-30 h-[52px] bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {subView !== 'none' ? (
              <button
                type="button"
                onClick={handleBackSubView}
                aria-label="Go back"
                className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-xl text-[#0B2545] hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="lg:hidden">
                <GhaLogo size="sm" onClick={openOwnerPortal} />
              </div>
            )}
            <span className="font-display font-bold text-base text-[#0B2545] truncate">
              {subView !== 'none'
                ? SUBVIEW_TITLES[subView]
                : navItems.find((n) => n.id === activeTab)?.label ?? 'GST'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenSubView('mail')}
              aria-label={`Open messages (${unreadCount} unread)`}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl flex items-center gap-1.5 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              <Mail className="w-4 h-4 text-[#1570EF]" />
              {unreadCount > 0 && <span className="tabular-nums text-[#C8922A]">{unreadCount}</span>}
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl flex items-center gap-1.5 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              <Globe className="w-4 h-4 text-[#1570EF]" />
              <span>{state.language === 'en' ? 'EN' : 'TL'}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-24 lg:pb-10">
          {subView !== 'none' ? (
            renderSubView()
          ) : activeTab === 'home' ? (
            <HomeView
              state={state}
              announcements={store.systemConfig?.announcements}
              onNavigateTab={handleNavigateTab}
              onOpenSubView={handleOpenSubView}
            />
          ) : activeTab === 'wealth' ? (
            !feat.wealthEnabled ? (
              featurePausedBanner('GST Wealth & Funds')
            ) : (
              <WealthView
                state={state}
                onInvest={(fundId, amt, wallet, couponId) => {
                  const res = investInFund(state, fundId, amt, wallet, couponId);
                  if (res.ok) setState(res.state);
                  return res;
                }}
                onAdvanceDay={(invId) => {
                  const res = advanceInvestmentDay(state, invId);
                  if (res.ok) setState(res.state);
                  return res;
                }}
              />
            )
          ) : activeTab === 'team' ? (
            !feat.teamInviteEnabled ? (
              featurePausedBanner('Team & Invitation Program')
            ) : (
              <TeamView
                state={state}
                onOpenSubView={handleOpenSubView}
                onSimulateRecruit={() => {
                  const idx = state.teamMembers.length + 1;
                  const timestamp = formatNowTimestamp();
                  setState((prev) => ({
                    ...prev,
                    teamMembers: [
                      ...prev.teamMembers,
                      {
                        id: generateTxId('tm'),
                        maskedPhone: `+63 917****${100 + idx}`,
                        name: `Coordinator #${idx}`,
                        tier: 'A',
                        level: 'A1',
                        joinedAt: timestamp.split(' ')[1] ?? timestamp,
                        taskEarnedPhp: 90,
                        referralBonusPhp: 128,
                      },
                    ],
                    inventory: {
                      ...prev.inventory,
                      surpriseCards: prev.inventory.surpriseCards + 1,
                      goldenEggs: prev.inventory.goldenEggs + 1,
                    },
                    wallets: {
                      ...prev.wallets,
                      incomePhp: prev.wallets.incomePhp + 128,
                    },
                    earnings: {
                      ...prev.earnings,
                      teamInvitationIncomePhp: prev.earnings.teamInvitationIncomePhp + 128,
                      todayPhp: prev.earnings.todayPhp + 128,
                      thisWeekPhp: prev.earnings.thisWeekPhp + 128,
                      thisMonthPhp: prev.earnings.thisMonthPhp + 128,
                      totalIncomePhp: prev.earnings.totalIncomePhp + 128,
                    },
                    transactionRecords: [
                      {
                        id: generateTxId('tx'),
                        direction: 'income',
                        category: 'Recruitment Reward',
                        amountPhp: 128,
                        timestamp,
                        note: 'New A1 hire joined via invitation code',
                      },
                      ...prev.transactionRecords,
                    ],
                  }));
                }}
              />
            )
          ) : activeTab === 'task' ? (
            !feat.tasksEnabled ? (
              featurePausedBanner('Daily Hospitality Audits')
            ) : (
              <TaskView
                state={state}
                onOpenTaskDetails={(task) => {
                  setSelectedTask(task);
                  setSubView('task-details');
                }}
                onResetBatch={() => setState((prev) => resetDailyTasks(prev))}
              />
            )
          ) : (
            <MineView
              state={state}
              onOpenSubView={handleOpenSubView}
              onNavigateTab={handleNavigateTab}
              onToggleLanguage={toggleLanguage}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Customer Service Button (matches green chat icon in videos) */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        aria-label="Open GST Online Customer Service"
        className="lg:hidden fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg flex items-center justify-center border-2 border-white"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Mobile Bottom 5-Tab Navigation Bar (60px height) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[60px] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center"
      >
        {navItems.map((item) => {
          const active = activeTab === item.id && subView === 'none';
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigateTab(item.id)}
              className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                active ? 'text-[#1570EF]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Online Customer Service Drawer */}
      <CustomerServiceDrawer
        state={state}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
}
