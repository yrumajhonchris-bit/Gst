import React from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Download,
  Egg,
  FileText,
  Globe,
  LogOut,
  Mail,
  MapPin,
  Receipt,
  Settings,
  Sparkles,
  Ticket,
  UserPlus,
  Wallet,
} from 'lucide-react';
import { formatPhp } from '../lib/ghaEngine';
import { t } from '../lib/i18n';
import { GhaAppState, NavTab, SubView } from '../types/gha';
import { SafeImage } from './GhaLogo';

interface MineViewProps {
  state: GhaAppState;
  onOpenSubView: (view: SubView) => void;
  onNavigateTab: (tab: NavTab) => void;
  onToggleLanguage: () => void;
  onLogout: () => void;
}

export function MineView({
  state,
  onOpenSubView,
  onNavigateTab,
  onToggleLanguage,
  onLogout,
}: MineViewProps) {
  const unreadMailCount = state.mails.filter((m) => !m.read).length;

  const menuItems: Array<{
    label: string;
    icon: React.ReactNode;
    meta?: string;
    action: () => void;
  }> = [
    {
      label: t(state.language, 'settings'),
      icon: <Settings className="w-5 h-5 text-[#1570EF]" />,
      action: () => onOpenSubView('settings'),
    },
    {
      label: t(state.language, 'address'),
      icon: <MapPin className="w-5 h-5 text-[#1570EF]" />,
      meta: `${state.addresses.length} saved`,
      action: () => onOpenSubView('address'),
    },
    {
      label: t(state.language, 'financialRecords'),
      icon: <Wallet className="w-5 h-5 text-[#1570EF]" />,
      action: () => onOpenSubView('financial-records'),
    },
    {
      label: t(state.language, 'transactionRecords'),
      icon: <Receipt className="w-5 h-5 text-[#1570EF]" />,
      action: () => onOpenSubView('transaction-records'),
    },
    {
      label: t(state.language, 'agreements'),
      icon: <FileText className="w-5 h-5 text-[#1570EF]" />,
      action: () => onOpenSubView('agreements'),
    },
    {
      label: t(state.language, 'surpriseCard'),
      icon: <Sparkles className="w-5 h-5 text-[#C8922A]" />,
      meta: `${state.inventory.surpriseCards} available`,
      action: () => onOpenSubView('surprise-card'),
    },
    {
      label: t(state.language, 'goldenEgg'),
      icon: <Egg className="w-5 h-5 text-[#C8922A]" />,
      meta: `${state.inventory.goldenEggs} available`,
      action: () => onOpenSubView('golden-egg'),
    },
    {
      label: t(state.language, 'coupon'),
      icon: <Ticket className="w-5 h-5 text-[#1570EF]" />,
      meta: `${state.coupons.filter((c) => !c.used).length} active`,
      action: () => onOpenSubView('coupon'),
    },
    {
      label: t(state.language, 'message'),
      icon: <Mail className="w-5 h-5 text-[#1570EF]" />,
      meta: unreadMailCount > 0 ? `${unreadMailCount} unread` : 'All read',
      action: () => onOpenSubView('mail'),
    },
    {
      label: t(state.language, 'invite'),
      icon: <UserPlus className="w-5 h-5 text-[#1570EF]" />,
      meta: state.hasDeposited ? state.user.inviteCode : 'Deposit to unlock',
      action: () => onNavigateTab('team'),
    },
    {
      label: t(state.language, 'download'),
      icon: <Download className="w-5 h-5 text-[#1570EF]" />,
      meta: 'v2.6',
      action: () => onOpenSubView('employee-manual'),
    },
    {
      label: t(state.language, 'language'),
      icon: <Globe className="w-5 h-5 text-[#1570EF]" />,
      meta: state.language === 'en' ? 'English' : 'Filipino',
      action: onToggleLanguage,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Profile & Wallets Header */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SafeImage
              src={state.user.avatar}
              alt={state.user.name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-[#0B2545] text-sm">{state.user.level}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">+63 {state.user.phone}</span>
                {state.user.phoneVerified && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-semibold">Phone Verified</span>
                  </>
                )}
              </div>
              <h1 className="text-lg font-display font-bold text-[#0B2545] mt-0.5">
                {state.user.name}
              </h1>
              <p className="text-xs text-slate-500">Position: {state.user.position}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenSubView('deposit')}
              className="h-11 px-4 rounded-xl bg-[#1570EF] hover:bg-[#125EC9] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{t(state.language, 'deposit')}</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenSubView('withdraw')}
              className="h-11 px-4 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>{t(state.language, 'withdraw')}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Income Wallet (PHP)</p>
            <p className="text-2xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
              {formatPhp(state.wallets.incomePhp)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Personal Wallet (PHP)</p>
            <p className="text-2xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
              {formatPhp(state.wallets.personalPhp)}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#C8922A] text-white px-4 py-2.5 text-xs font-semibold text-center tabular-nums">
          Effective Date: {state.user.effectiveDateStart} – {state.user.effectiveDateEnd}
        </div>
      </section>

      {/* EARNINGS Grid */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-display font-bold text-[#0B2545] tracking-wide mb-3">
          ★ EARNINGS ★
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
          {[
            { label: 'Yesterday', value: formatPhp(state.earnings.yesterdayPhp) },
            { label: 'Today', value: formatPhp(state.earnings.todayPhp) },
            { label: 'This Week', value: formatPhp(state.earnings.thisWeekPhp) },
            { label: 'This Month', value: formatPhp(state.earnings.thisMonthPhp) },
            { label: 'Task Income of Team', value: formatPhp(state.earnings.teamTaskIncomePhp) },
            { label: 'Invitation Income of Team', value: formatPhp(state.earnings.teamInvitationIncomePhp) },
            { label: 'Total Income', value: formatPhp(state.earnings.totalIncomePhp), highlight: true },
            { label: 'Security Deposit', value: formatPhp(state.wallets.securityDepositPhp) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-slate-50 border border-slate-200 p-3.5"
            >
              <p className="text-xs text-slate-500">{item.label}</p>
              <p
                className={`text-base font-display font-bold mt-1 ${
                  item.highlight ? 'text-[#C8922A]' : 'text-[#0B2545]'
                }`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Account Menu Rows */}
      <section className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {menuItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="w-full px-5 min-h-[56px] flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3.5">
              <span className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {item.icon}
              </span>
              <span className="text-sm font-semibold text-slate-800">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.meta && <span className="text-xs text-slate-500">{item.meta}</span>}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={onLogout}
          className="w-full px-5 min-h-[56px] flex items-center justify-between gap-3 hover:bg-red-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </span>
            <span className="text-sm font-semibold text-red-600">{t(state.language, 'logOut')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </section>
    </div>
  );
}
