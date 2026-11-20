import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BookOpen,
  Briefcase,
  ChevronRight,
  Crown,
  Egg,
  Gift,
  Megaphone,
  Newspaper,
  PiggyBank,
  Sparkles,
  TrendingUp,
  UserPlus,
  Watch,
} from 'lucide-react';
import { ANNOUNCEMENTS, ASSETS } from '../data/ghaSeed';
import { formatPhp, getTaskProgress, isSportsWatchEligible } from '../lib/ghaEngine';
import { t } from '../lib/i18n';
import { GhaAppState, NavTab, SubView } from '../types/gha';
import { SafeImage } from './GhaLogo';

interface HomeViewProps {
  state: GhaAppState;
  announcements?: string[];
  onNavigateTab: (tab: NavTab) => void;
  onOpenSubView: (view: SubView) => void;
}

export function HomeView({ state, announcements, onNavigateTab, onOpenSubView }: HomeViewProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const progress = getTaskProgress(state);
  const watchEligible = isSportsWatchEligible(state);

  const slides = [
    {
      kicker: 'Career Growth · Personal Office Application',
      title: 'Level Up With Your Effort',
      subtitle: 'Unlock higher daily hospitality audit quotas & exclusive B1–C3 management rewards.',
      image: ASSETS.heroTeam,
      actionLabel: 'Explore VIP Journey',
      onAction: () => onOpenSubView('vip-journey'),
    },
    {
      kicker: 'Our Vision · GST Family Philippines',
      title: 'GST, Together for a Prosperous Future',
      subtitle: 'Rooted in the Philippines · Building a platform full of warmth and shared opportunities.',
      image: ASSETS.grandPark,
      actionLabel: 'View Active Campaigns',
      onAction: () => onOpenSubView('campaigns'),
    },
    {
      kicker: 'Employee Health Benefit Initiative',
      title: 'Claim Your Free GST Sports Watch',
      subtitle: '500 Rose Gold & Matte Black smartwatches reserved for B1 coordinators & active team builders.',
      image: ASSETS.sportsWatch,
      actionLabel: 'Check Eligibility',
      onAction: () => onOpenSubView('sports-watch'),
    },
  ];

  const activeSlide = slides[slideIdx];

  return (
    <div className="space-y-5">
      {/* Hero Banner Carousel */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#0B2545] shadow-xs">
        <SafeImage
          src={activeSlide.image}
          alt={activeSlide.title}
          className="w-full h-52 sm:h-64 lg:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/95 via-[#0B2545]/60 to-transparent flex flex-col justify-end p-5 sm:p-7 text-white">
          <p className="text-xs font-medium text-[#E6B84C]">{activeSlide.kicker}</p>
          <h1 className="text-xl sm:text-3xl font-display font-bold mt-1 text-balance leading-snug max-w-xl">
            {activeSlide.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1.5 max-w-xl line-clamp-2">
            {activeSlide.subtitle}
          </p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={activeSlide.onAction}
              className="px-4 py-2 rounded-lg bg-[#C8922A] hover:bg-[#B5811F] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              {activeSlide.actionLabel}
            </button>
            <div className="flex items-center gap-1.5">
              {slides.map((s, idx) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  aria-label={`Show banner ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    idx === slideIdx ? 'w-6 bg-[#E6B84C]' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Quick Action Buttons (Deposit, Withdraw, Invite, Wealth) */}
      <section className="grid grid-cols-4 gap-2 sm:gap-4 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200">
        <button
          type="button"
          onClick={() => onOpenSubView('deposit')}
          className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[68px]"
        >
          <span className="w-11 h-11 rounded-2xl bg-[#1570EF]/10 text-[#1570EF] flex items-center justify-center">
            <ArrowDownToLine className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            {t(state.language, 'deposit')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpenSubView('withdraw')}
          className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[68px]"
        >
          <span className="w-11 h-11 rounded-2xl bg-[#1570EF]/10 text-[#1570EF] flex items-center justify-center">
            <ArrowUpFromLine className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            {t(state.language, 'withdraw')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('team')}
          className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[68px]"
        >
          <span className="w-11 h-11 rounded-2xl bg-[#1570EF]/10 text-[#1570EF] flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            {t(state.language, 'invite')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('wealth')}
          className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[68px]"
        >
          <span className="w-11 h-11 rounded-2xl bg-[#1570EF]/10 text-[#1570EF] flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </span>
          <span className="text-xs font-semibold text-slate-800 whitespace-nowrap">
            {t(state.language, 'wealth')}
          </span>
        </button>
      </section>

      {/* INCOME Banner + Announcement Ticker */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <button
          type="button"
          onClick={() => onNavigateTab('task')}
          className="lg:col-span-5 text-left rounded-2xl bg-gradient-to-r from-[#0B2545] via-[#133C73] to-[#1570EF] text-white p-5 flex items-center justify-between gap-4 hover:brightness-105 transition-all"
        >
          <div>
            <p className="text-xs font-semibold text-[#E6B84C] tracking-wide">INCOME OVERVIEW</p>
            <p className="text-2xl font-display font-bold tabular-nums mt-1">
              {formatPhp(state.wallets.incomePhp)}
            </p>
            <p className="text-xs text-slate-200 mt-1">
              Daily Audits: {progress.completedCount}/{progress.totalCount} completed ({progress.percent}%)
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <PiggyBank className="w-8 h-8 text-[#E6B84C]" />
          </div>
        </button>

        <div className="lg:col-span-7 flex flex-col justify-between gap-3">
          {/* Announcement Marquee */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center gap-3 overflow-hidden">
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-[#C8922A] flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4" />
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee text-sm text-slate-700 font-medium">
                {(announcements && announcements.length > 0 ? announcements : ANNOUNCEMENTS)
                  .concat(announcements && announcements.length > 0 ? announcements : ANNOUNCEMENTS)
                  .map((msg, idx) => (
                    <span key={`${idx}-${msg.slice(0, 12)}`} className="mr-12">
                      {msg}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Campaign Quick Strip */}
          <button
            type="button"
            onClick={() => onOpenSubView('campaigns')}
            className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-center justify-between hover:border-[#C8922A] transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#C8922A]/10 text-[#C8922A] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Active Event Posters · Recruitment &amp; Fund Benefits
                </p>
                <p className="text-xs text-slate-500">
                  Nov 16 – Nov 22 Campaign · Up to 3,188 PHP invite rewards &amp; 9% fund bonus
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </section>

      {/* Interactive Activities Grid (Cash Gift, Surprise Card, Golden Egg Smash, Sports Watch) */}
      <section aria-labelledby="activities-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="activities-heading" className="text-base font-display font-bold text-[#0B2545]">
            Member Activities &amp; Rewards
          </h2>
          <button
            type="button"
            onClick={() => onOpenSubView('campaigns')}
            className="text-xs font-semibold text-[#1570EF] hover:underline"
          >
            All Campaigns &gt;&gt;
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => onOpenSubView('cash-gift')}
            className="rounded-2xl bg-gradient-to-br from-[#D99B26] to-[#B5811F] text-white p-4 text-left flex items-center justify-between gap-2 hover:brightness-105 transition-all min-h-[84px]"
          >
            <div>
              <p className="text-sm font-display font-bold">{t(state.language, 'cashGift')}</p>
              <p className="text-xs text-amber-100 mt-0.5">Redeem code &amp; daily</p>
            </div>
            <Gift className="w-7 h-7 text-amber-100 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenSubView('surprise-card')}
            className="rounded-2xl bg-gradient-to-br from-[#B91C1C] to-[#7F1D1D] text-white p-4 text-left flex items-center justify-between gap-2 hover:brightness-105 transition-all min-h-[84px]"
          >
            <div>
              <p className="text-sm font-display font-bold">{t(state.language, 'surpriseCard')}</p>
              <p className="text-xs text-red-100 mt-0.5 tabular-nums">
                {state.inventory.surpriseCards} card{state.inventory.surpriseCards === 1 ? '' : 's'} left
              </p>
            </div>
            <Sparkles className="w-7 h-7 text-red-100 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenSubView('golden-egg')}
            className="rounded-2xl bg-gradient-to-br from-[#0B2545] to-[#1E3A8A] text-white p-4 text-left flex items-center justify-between gap-2 hover:brightness-110 transition-all min-h-[84px]"
          >
            <div>
              <p className="text-sm font-display font-bold">{t(state.language, 'goldenEgg')}</p>
              <p className="text-xs text-blue-100 mt-0.5 tabular-nums">
                {state.inventory.goldenEggs} egg{state.inventory.goldenEggs === 1 ? '' : 's'} ready
              </p>
            </div>
            <Egg className="w-7 h-7 text-[#E6B84C] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenSubView('sports-watch')}
            className="rounded-2xl bg-white border border-slate-200 text-slate-900 p-4 text-left flex items-center justify-between gap-2 hover:border-[#1570EF] transition-colors min-h-[84px]"
          >
            <div>
              <p className="text-sm font-display font-bold text-[#0B2545]">Free Sports Watch</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {state.inventory.sportsWatchClaimed
                  ? 'Claimed'
                  : watchEligible
                  ? 'Eligible · Claim now'
                  : 'B1 or 5 invites'}
              </p>
            </div>
            <Watch className="w-7 h-7 text-[#1570EF] shrink-0" />
          </button>
        </div>
      </section>

      {/* About Us, News & Employee Manual */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => onOpenSubView('about-us')}
          className="rounded-2xl bg-[#0B2545] text-white p-4 flex items-center justify-between hover:bg-[#133C73] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-[#E6B84C] shrink-0" />
            <div>
              <p className="text-xs text-slate-300">Corporate Profile</p>
              <p className="text-base font-display font-bold">{t(state.language, 'aboutUs')} &gt;&gt;</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        <button
          type="button"
          onClick={() => onOpenSubView('news')}
          className="rounded-2xl bg-[#133C73] text-white p-4 flex items-center justify-between hover:bg-[#1570EF] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-[#E6B84C] shrink-0" />
            <div>
              <p className="text-xs text-slate-300">Latest Updates</p>
              <p className="text-base font-display font-bold">{t(state.language, 'news')} &gt;&gt;</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>

        <button
          type="button"
          onClick={() => onOpenSubView('employee-manual')}
          className="rounded-2xl bg-white border border-slate-200 text-[#0B2545] p-4 flex items-center justify-between hover:border-[#1570EF] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-[#1570EF] shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Rules &amp; Compensation</p>
              <p className="text-base font-display font-bold">
                {t(state.language, 'employeeManual')} &gt;&gt;
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </section>

      {/* Membership Level & VIP Journey */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-amber-50 text-[#C8922A] flex items-center justify-center shrink-0">
              <Crown className="w-6 h-6" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500">
                {t(state.language, 'membershipLevel')}
              </p>
              <h3 className="text-lg font-display font-bold text-[#0B2545]">
                Current level: {state.user.level} · {state.user.position}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenSubView('vip-journey')}
            className="h-11 px-5 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
          >
            {t(state.language, 'vipJourney')} &gt;&gt;
          </button>
        </div>
      </section>
    </div>
  );
}
