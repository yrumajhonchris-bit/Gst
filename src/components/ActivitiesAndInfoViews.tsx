import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Crown,
  Egg,
  Gift,
  MessageCircle,
  Send,
  Sparkles,
  Watch,
  X,
} from 'lucide-react';
import { ASSETS, MEMBERSHIP_TIERS } from '../data/ghaSeed';
import { formatPhp, isSportsWatchEligible } from '../lib/ghaEngine';
import { GhaAppState, MembershipCode } from '../types/gha';
import { SafeImage } from './GhaLogo';

export function SurpriseCardView({
  state,
  onDrawCard,
}: {
  state: GhaAppState;
  onDrawCard: (slot: number) => { ok: boolean; message: string; rewardLabel?: string };
}) {
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleFlip = (slot: number) => {
    if (revealed[slot]) return;
    const res = onDrawCard(slot);
    setFeedback(res.message);
    if (res.ok && res.rewardLabel) {
      setRevealed((prev) => ({ ...prev, [slot]: res.rewardLabel! }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#B91C1C] to-[#7F1D1D] text-white p-6">
        <p className="text-xs font-medium text-red-100">Recruitment &amp; Milestone Activity</p>
        <h2 className="text-2xl font-display font-bold mt-1">GST Surprise Card Draw</h2>
        <p className="text-sm text-red-100 mt-1 tabular-nums">
          Cards Available: <strong>{state.inventory.surpriseCards}</strong> · Flip any card to reveal instant PHP rewards.
        </p>
      </div>

      {feedback && (
        <div role="status" className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-900">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((slot) => {
          const prize = revealed[slot];
          return (
            <button
              key={slot}
              type="button"
              onClick={() => handleFlip(slot)}
              className={`h-48 rounded-2xl border p-5 flex flex-col items-center justify-center text-center transition-all ${
                prize
                  ? 'bg-amber-50 border-[#C8922A] text-[#0B2545]'
                  : 'bg-white border-slate-200 hover:border-[#B91C1C] hover:-translate-y-0.5'
              }`}
            >
              <Sparkles className={`w-10 h-10 mb-3 ${prize ? 'text-[#C8922A]' : 'text-[#B91C1C]'}`} />
              <p className="font-display font-bold text-base">
                {prize ? prize : `Surprise Card #${slot + 1}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {prize ? 'Credited to Income Wallet' : 'Tap to reveal reward'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GoldenEggView({
  state,
  onSmashEgg,
}: {
  state: GhaAppState;
  onSmashEgg: (idx: number) => { ok: boolean; message: string; rewardAmount?: number };
}) {
  const [cracked, setCracked] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCrack = (idx: number) => {
    if (cracked[idx]) return;
    const res = onSmashEgg(idx);
    setFeedback(res.message);
    if (res.ok && res.rewardAmount) {
      setCracked((prev) => ({ ...prev, [idx]: res.rewardAmount! }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#1E3A8A] text-white p-6">
        <p className="text-xs font-medium text-[#E6B84C]">Onboarding Rewards Event</p>
        <h2 className="text-2xl font-display font-bold mt-1">Golden Egg Smash</h2>
        <p className="text-sm text-blue-100 mt-1 tabular-nums">
          Golden Eggs Ready: <strong>{state.inventory.goldenEggs}</strong> · Win 58 to 288 PHP per smash!
        </p>
      </div>

      {feedback && (
        <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-800">
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((idx) => {
          const prize = cracked[idx];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCrack(idx)}
              className={`h-48 rounded-2xl border p-5 flex flex-col items-center justify-center text-center transition-all ${
                prize
                  ? 'bg-emerald-50 border-emerald-300 text-[#0B2545]'
                  : 'bg-white border-slate-200 hover:border-[#C8922A] hover:-translate-y-0.5'
              }`}
            >
              <Egg className={`w-12 h-12 mb-3 ${prize ? 'text-emerald-600' : 'text-[#C8922A]'}`} />
              <p className="font-display font-bold text-base">
                {prize ? `+${formatPhp(prize)}` : `Golden Egg #${idx + 1}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {prize ? 'Cracked & Credited!' : 'Tap to smash'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CashGiftView({
  state,
  giftCodes,
  onRedeemCode,
  onClaimDailyCheckIn,
}: {
  state: GhaAppState;
  giftCodes?: Record<string, number>;
  onRedeemCode: (code: string) => { ok: boolean; message: string };
  onClaimDailyCheckIn: () => { ok: boolean; message: string };
}) {
  const [code, setCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onRedeemCode(code);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) setCode('');
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="rounded-2xl bg-gradient-to-r from-[#D99B26] to-[#B5811F] text-white p-6">
        <h2 className="text-2xl font-display font-bold">Cash Gift &amp; Daily Check-In</h2>
        <p className="text-sm text-amber-100 mt-1">
          Redeem official hiring manager gift codes or claim your daily attendance bonus.
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-display font-bold text-base text-[#0B2545]">Daily Attendance Gift</p>
          <p className="text-xs text-slate-500">Claim PHP 18.00 once per day</p>
        </div>
        <button
          type="button"
          disabled={state.inventory.dailyCheckInClaimed}
          onClick={() => {
            const res = onClaimDailyCheckIn();
            setFeedback({ ok: res.ok, text: res.message });
          }}
          className={`h-11 px-5 rounded-xl text-xs font-semibold ${
            state.inventory.dailyCheckInClaimed
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-[#0B2545] hover:bg-[#133C73] text-white'
          }`}
        >
          {state.inventory.dailyCheckInClaimed ? 'Claimed Today' : 'Claim ₱18.00'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <label htmlFor="gift-code" className="block text-sm font-semibold text-[#0B2545] mb-1.5">
            Enter Cash Gift Code
          </label>
          <input
            id="gift-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Try GST2026, GSTVIP, or PHILIPPINES"
            className="w-full h-12 px-4 rounded-xl bg-slate-100 text-sm uppercase font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#C8922A]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(giftCodes ?? { GST2026: 68, GSTVIP: 128, PHILIPPINES: 88 }).map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setCode(sample)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-mono font-semibold text-slate-700"
            >
              {sample}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
        >
          <Gift className="w-4 h-4" />
          <span>Redeem Cash Gift</span>
        </button>
      </form>
    </div>
  );
}

export function SportsWatchView({
  state,
  onClaimWatch,
  onUpgradeToB1,
}: {
  state: GhaAppState;
  onClaimWatch: (color: 'Rose Gold' | 'Matte Black') => { ok: boolean; message: string };
  onUpgradeToB1: () => void;
}) {
  const [watchColor, setWatchColor] = useState<'Rose Gold' | 'Matte Black'>('Matte Black');
  const [feedback, setFeedback] = useState<string | null>(null);
  const eligible = isSportsWatchEligible(state);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <SafeImage
          src={ASSETS.sportsWatch}
          alt="GST Employee Health Benefit Smart Sports Watch"
          className="w-full h-56 object-cover"
        />
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#1570EF]">Employee Health &amp; Wellness Program</p>
            <h2 className="text-xl font-display font-bold text-[#0B2545] mt-1">
              Get a FREE GST Sports Watch (500 Available)
            </h2>
            <p className="text-sm text-slate-600 mt-1.5">
              Eligible colleagues: Newly joined or promoted to <strong>B1</strong> rank, OR invited <strong>5 new members</strong> to join.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div>
              <p className="text-slate-500">Current Rank</p>
              <p className="font-bold text-[#0B2545] text-sm mt-0.5">{state.user.level}</p>
            </div>
            <div>
              <p className="text-slate-500">Invited Team Members</p>
              <p className="font-bold text-[#0B2545] text-sm mt-0.5 tabular-nums">
                {state.teamMembers.length} / 5
              </p>
            </div>
          </div>

          {feedback && (
            <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800">
              {feedback}
            </div>
          )}

          {state.inventory.sportsWatchClaimed ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">
                Your {state.inventory.sportsWatchColor} Sports Watch order is confirmed for {state.addresses[0]?.provinceCity ?? 'your default address'}!
              </p>
            </div>
          ) : eligible ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(['Rose Gold', 'Matte Black'] as const).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setWatchColor(color)}
                    className={`h-11 rounded-xl border text-sm font-semibold ${
                      watchColor === color
                        ? 'border-[#1570EF] bg-[#1570EF]/10 text-[#0B2545]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = onClaimWatch(watchColor);
                  setFeedback(res.message);
                }}
                className="w-full h-12 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
              >
                <Watch className="w-4 h-4" />
                <span>Claim Free Sports Watch</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onUpgradeToB1}
              className="w-full h-12 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white font-semibold text-sm"
            >
              View VIP Journey to Unlock B1 Rank
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VipJourneyView({
  state,
  onUpgradeTier,
}: {
  state: GhaAppState;
  onUpgradeTier: (code: MembershipCode) => { ok: boolean; message: string };
}) {
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#133C73] text-white p-6">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-[#E6B84C]" />
          <div>
            <h2 className="text-xl font-display font-bold">VIP Journey &amp; Career Advancement</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Current Rank: {state.user.level} · Security Deposit: {formatPhp(state.wallets.securityDepositPhp)} · Personal Wallet: {formatPhp(state.wallets.personalPhp)}
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MEMBERSHIP_TIERS.map((tier) => {
          const isCurrent = state.user.level === tier.code;
          const currentIdx = MEMBERSHIP_TIERS.findIndex((t) => t.code === state.user.level);
          const thisIdx = MEMBERSHIP_TIERS.findIndex((t) => t.code === tier.code);
          const unlocked = thisIdx <= currentIdx;

          return (
            <div
              key={tier.code}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between ${
                isCurrent ? 'border-[#C8922A] ring-1 ring-[#C8922A]' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-lg font-display font-extrabold"
                    style={{ color: tier.badgeColor }}
                  >
                    {tier.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {isCurrent ? 'Current Level' : unlocked ? 'Unlocked' : 'Available'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-base text-[#0B2545] mt-1">
                  {tier.title}
                </h3>

                <div className="mt-4 space-y-2 text-xs text-slate-600 tabular-nums border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span>Security Deposit</span>
                    <span className="font-bold text-[#0B2545]">{formatPhp(tier.securityDepositPhp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Audits</span>
                    <span className="font-bold text-[#0B2545]">{tier.dailyTasks} tasks/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payout Per Audit</span>
                    <span className="font-bold text-[#C8922A]">{formatPhp(tier.perTaskPhp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team Commission (A/B/C)</span>
                    <span className="font-bold text-[#1570EF]">
                      {tier.teamACommissionPct}% / {tier.teamBCommissionPct}% / {tier.teamCCommissionPct}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={unlocked}
                onClick={() => {
                  const res = onUpgradeTier(tier.code);
                  setFeedback({ ok: res.ok, text: res.message });
                }}
                className={`mt-4 w-full h-11 rounded-xl text-xs font-semibold transition-colors ${
                  unlocked
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0B2545] hover:bg-[#133C73] text-white'
                }`}
              >
                {isCurrent ? 'Active Rank' : unlocked ? 'Completed' : `Upgrade to ${tier.code}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InfoPagesView({
  page,
}: {
  page: 'about-us' | 'news' | 'employee-manual' | 'campaigns';
}) {
  if (page === 'campaigns') {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <p className="text-xs font-semibold text-[#1570EF]">Event Period: Nov 16 – Nov 22, 2026</p>
          <h2 className="text-xl font-display font-bold text-[#0B2545]">
            1. GST Recruitment Rewards Campaign
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5 tabular-nums">
              <p className="font-bold text-[#0B2545]">Recruitment Rewards · Cash</p>
              <p>Invite A1 to join = <strong>128 PHP</strong></p>
              <p>Invite A2 to join = <strong>288 PHP</strong></p>
              <p>Invite B1 to join = <strong>688 PHP</strong></p>
              <p>Invite B2 to join = <strong>1,588 PHP</strong></p>
              <p>Invite B3 to join = <strong>3,188 PHP</strong></p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5 tabular-nums">
              <p className="font-bold text-[#0B2545]">Onboarding Rewards · Fund</p>
              <p>Intern joins A1 = <strong>98 PHP</strong></p>
              <p>Intern joins A2 = <strong>188 PHP</strong></p>
              <p>Intern joins B1 = <strong>338 PHP</strong></p>
              <p>Intern joins B2 = <strong>588 PHP</strong></p>
              <p>Intern joins B3 = <strong>1,088 PHP</strong></p>
            </div>
          </div>
          <p className="text-sm font-semibold text-[#C8922A]">
            Cumulative Invitation Reward: Invite 3 A1 members = Surprise Card × 1
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-xl font-display font-bold text-[#0B2545]">
            2. GST Fund Benefit Campaign
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="font-bold text-[#0B2545]">Lightspeed Venture Partners</p>
              <p className="text-xs text-slate-600 mt-1">Term: 40 Days · Min: 200 PHP · Daily Interest: 5.36%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="font-bold text-[#0B2545]">Union Square Ventures</p>
              <p className="text-xs text-slate-600 mt-1">Term: 90 Days · Min: 200 PHP · Daily Interest: 5.81%</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Extra Purchase Rewards: Invest 100–4,999 (+5% cash bonus) · Invest 5,000–9,999 (+7%) · Invest 10,000+ (+9%).
          </p>
        </div>
      </div>
    );
  }

  if (page === 'about-us') {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <SafeImage src={ASSETS.heroTeam} alt="GST Team" className="w-full h-56 object-cover" />
        <div className="p-6 space-y-3">
          <h2 className="text-xl font-display font-bold text-[#0B2545]">
            GST Hospitality Alliance Corp
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            GST is more than a company—it is a family rooted in the Philippines. We connect boutique luxury resorts across Europe, Asia, and the Americas with dedicated Filipino quality analysts who audit listing standards, hospitality ambience, and guest satisfaction.
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Our platform empowers coordinators from A0 interns to C3 directors to earn steady daily income, build collaborative teams, and participate in employee wealth &amp; wellness initiatives.
          </p>
        </div>
      </div>
    );
  }

  if (page === 'news') {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[
          {
            date: 'Nov 16, 2026',
            title: 'GST Recruitment & Fund Benefit Campaign Live in the Philippines',
            body: 'Members can now earn up to 3,188 PHP per qualified B3 invitation plus 5%–9% instant cash bonuses on Lightspeed and Union Square fund allocations.',
          },
          {
            date: 'Oct 02, 2026',
            title: '500 Sports Watches Procured for Employee Health Initiative',
            body: 'B1 coordinators and team builders with 5+ recruits can register their shipping address to receive a complimentary Rose Gold or Matte Black sports watch.',
          },
        ].map((item) => (
          <article key={item.title} className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">{item.date}</p>
            <h3 className="font-display font-bold text-base text-[#0B2545] mt-1">{item.title}</h3>
            <p className="text-sm text-slate-600 mt-1.5">{item.body}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <Award className="w-6 h-6 text-[#C8922A]" />
        <h2 className="text-xl font-display font-bold text-[#0B2545]">GST Employee Manual</h2>
      </div>
      <div className="space-y-3 text-sm text-slate-600">
        <p><strong>1. Daily Tasks:</strong> Complete all assigned hotel quality audits in the Task tab by rating 1–5 stars and submitting observations.</p>
        <p><strong>2. Wallets &amp; Withdrawals:</strong> Task rewards credit to your Income Wallet (10% withdrawal fee). Personal Wallet deposits &amp; withdrawals have 0% fee.</p>
        <p><strong>3. Team Parity Rule:</strong> Your rank must be equal to or higher than your subordinates to collect daily task commissions from Team A, B, and C.</p>
        <p><strong>4. Customer Service:</strong> Use the green GST Online Service button anytime for hiring manager assistance or payout checks.</p>
      </div>
    </div>
  );
}

export function CustomerServiceDrawer({
  state,
  isOpen,
  onClose,
  onSendMessage,
}: {
  state: GhaAppState;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
}) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  const quickPrompts = [
    'Register Sports Watch address',
    'Confirm my GCash deposit',
    'How to upgrade to B1?',
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-end sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="GST Online Customer Service"
    >
      <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-[560px] rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-[#0B2545] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="font-display font-bold text-sm">GST Online Customer Service</h3>
              <p className="text-xs text-slate-300">Hiring Manager &amp; Payroll Desk</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer service"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {state.chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-[#1570EF] text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1 tabular-nums">
                {msg.timestamp}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-white border-t border-slate-200 space-y-2">
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter message for hiring manager..."
              aria-label="Customer service message"
              className="flex-1 h-11 px-3.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
            />
            <button
              type="submit"
              aria-label="Send message"
              className="w-11 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
