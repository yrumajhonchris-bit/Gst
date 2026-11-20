import React, { useState } from 'react';
import { Calendar, CheckCircle2, Coins, FastForward, ShieldCheck, TrendingUp, X } from 'lucide-react';
import { WEALTH_FUNDS } from '../data/ghaSeed';
import { calculateDailyInterest, calculateFundPurchaseBonus, formatPhp } from '../lib/ghaEngine';
import { GhaAppState, WealthFund } from '../types/gha';

interface WealthViewProps {
  state: GhaAppState;
  onInvest: (
    fundId: string,
    amountPhp: number,
    walletSource: 'personal' | 'income',
    couponId?: string
  ) => { ok: boolean; message: string };
  onAdvanceDay: (investmentId: string) => { ok: boolean; message: string };
}

export function WealthView({ state, onInvest, onAdvanceDay }: WealthViewProps) {
  const [selectedFund, setSelectedFund] = useState<WealthFund | null>(null);
  const [amountInput, setAmountInput] = useState('500');
  const [walletSource, setWalletSource] = useState<'personal' | 'income'>('personal');
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const unusedCoupons = state.coupons.filter((c) => !c.used);

  const handleOpenInvest = (fund: WealthFund) => {
    setSelectedFund(fund);
    setAmountInput(String(Math.max(fund.minAmountPhp, 500)));
    setSelectedCouponId(unusedCoupons[0]?.id ?? '');
    setFeedback(null);
  };

  const handleConfirmInvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFund) return;
    const num = Number(amountInput);
    const res = onInvest(selectedFund.id, num, walletSource, selectedCouponId || undefined);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTimeout(() => setSelectedFund(null), 900);
    }
  };

  const totalInvested = state.investments
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.principalPhp, 0);

  const totalAccrued = state.investments.reduce((sum, i) => sum + i.accruedInterestPhp, 0);

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#133C73] text-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#E6B84C]">GST Employee Wealth Plans</p>
            <h1 className="text-2xl font-display font-bold mt-1">Partner Venture &amp; Growth Funds</h1>
            <p className="text-sm text-slate-300 mt-1">
              Allocate funds for steady daily yield plus instant 5%–9% campaign cash bonuses.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-300">Active Principal</p>
              <p className="text-lg font-display font-bold tabular-nums mt-0.5">
                {formatPhp(totalInvested)}
              </p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-300">Accrued Yield</p>
              <p className="text-lg font-display font-bold text-[#E6B84C] tabular-nums mt-0.5">
                {formatPhp(totalAccrued)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {feedback && !selectedFund && (
        <div
          role="status"
          className={`rounded-xl px-4 py-3 text-sm font-medium border ${
            feedback.ok
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Fund Cards */}
      <section aria-labelledby="funds-heading">
        <h2 id="funds-heading" className="text-base font-display font-bold text-[#0B2545] mb-3">
          Available Investment Programs
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {WEALTH_FUNDS.map((fund) => (
            <article
              key={fund.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500">{fund.partnerTag}</p>
                <h3 className="text-lg font-display font-bold text-[#0B2545] mt-1">{fund.name}</h3>

                <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500">Daily Rate</p>
                    <p className="text-lg font-display font-bold text-[#C8922A] tabular-nums">
                      {fund.dailyRatePct}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Term</p>
                    <p className="text-lg font-display font-bold text-[#0B2545] tabular-nums">
                      {fund.termDays}d
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Min</p>
                    <p className="text-lg font-display font-bold text-[#0B2545] tabular-nums">
                      ₱{fund.minAmountPhp}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1570EF] shrink-0" />
                    <span>{fund.repaymentMethod}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Window: {fund.campaignWindow}</span>
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs text-slate-700 mb-4">
                  <p className="font-semibold text-[#0B2545]">Extra Purchase Cash Rewards</p>
                  {fund.bonusTiers.map((tier) => (
                    <p key={tier.label}>{tier.label}</p>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenInvest(fund)}
                className="w-full h-11 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white text-sm font-semibold transition-colors"
              >
                Invest Now
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Rocket Internet Return Schedule Reference Table (from Video 3) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 overflow-x-auto">
        <h3 className="text-base font-display font-bold text-[#0B2545] mb-1">
          Rocket Internet Fund Interest &amp; Cash Rewards Table
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          150-day term · 2.58% daily interest rate · Instant purchase cashback tiers
        </p>
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="py-2 pr-4 font-semibold">Investment</th>
              <th className="py-2 pr-4 font-semibold">Daily Interest (2.58%)</th>
              <th className="py-2 pr-4 font-semibold">150-Day Interest</th>
              <th className="py-2 pr-4 font-semibold">Purchase Bonus</th>
              <th className="py-2 font-semibold text-right">Total After Maturity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {[500, 5000, 10000, 50000].map((amt) => {
              const daily = calculateDailyInterest(amt, 2.58);
              const totalInt = Math.round(daily * 150 * 100) / 100;
              const bonus = calculateFundPurchaseBonus(WEALTH_FUNDS[2], amt);
              const total = amt + totalInt + bonus;
              return (
                <tr key={amt} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4 font-semibold text-[#0B2545]">{formatPhp(amt)}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{formatPhp(daily)}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{formatPhp(totalInt)}</td>
                  <td className="py-2.5 pr-4 text-emerald-700 font-medium">{formatPhp(bonus)}</td>
                  <td className="py-2.5 text-right font-bold text-[#C8922A]">{formatPhp(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Active Investments */}
      <section aria-labelledby="positions-heading" className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 id="positions-heading" className="text-base font-display font-bold text-[#0B2545] mb-3">
          My Active Fund Allocations ({state.investments.length})
        </h2>
        {state.investments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>You have no active fund allocations yet. Select a fund above to earn daily returns.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.investments.map((pos) => (
              <div
                key={pos.id}
                className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{pos.startedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-[#1570EF]">
                      Day {pos.daysElapsed}/{pos.termDays}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={pos.status === 'matured' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {pos.status === 'matured' ? 'Matured' : 'Active'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[#0B2545] mt-1">{pos.fundName}</h3>
                  <p className="text-xs text-slate-600 tabular-nums mt-0.5">
                    Principal: {formatPhp(pos.principalPhp)} · Daily Rate: {pos.dailyRatePct}% · Accrued Yield:{' '}
                    <span className="font-semibold text-emerald-700">{formatPhp(pos.accruedInterestPhp)}</span>
                  </p>
                </div>

                {pos.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const res = onAdvanceDay(pos.id);
                      setFeedback({ ok: res.ok, text: res.message });
                    }}
                    className="h-10 px-4 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Simulate +1 Day Yield</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settled to Income Wallet</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invest Modal */}
      {selectedFund && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Invest in ${selectedFund.name}`}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-500">Allocate Capital</p>
                <h3 className="font-display font-bold text-lg text-[#0B2545]">
                  {selectedFund.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFund(null)}
                aria-label="Close investment modal"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
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

            <form onSubmit={handleConfirmInvest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Source Wallet
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWalletSource('personal')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      walletSource === 'personal'
                        ? 'border-[#1570EF] bg-[#1570EF]/5'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs text-slate-500">Personal Wallet</p>
                    <p className="text-sm font-bold text-[#0B2545] tabular-nums">
                      {formatPhp(state.wallets.personalPhp)}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletSource('income')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      walletSource === 'income'
                        ? 'border-[#1570EF] bg-[#1570EF]/5'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs text-slate-500">Income Wallet</p>
                    <p className="text-sm font-bold text-[#0B2545] tabular-nums">
                      {formatPhp(state.wallets.incomePhp)}
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="invest-amount" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Amount (Min {formatPhp(selectedFund.minAmountPhp)})
                </label>
                <input
                  id="invest-amount"
                  type="number"
                  min={selectedFund.minAmountPhp}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-semibold tabular-nums focus:outline-none focus:border-[#1570EF]"
                />
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[200, 500, 1800, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountInput(String(preset))}
                      className="py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 tabular-nums"
                    >
                      ₱{preset}
                    </button>
                  ))}
                </div>
              </div>

              {unusedCoupons.length > 0 && (
                <div>
                  <label htmlFor="invest-coupon" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Apply Fund Voucher
                  </label>
                  <select
                    id="invest-coupon"
                    value={selectedCouponId}
                    onChange={(e) => setSelectedCouponId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="">No voucher</option>
                    {unusedCoupons.map((cp) => (
                      <option key={cp.id} value={cp.id}>
                        {cp.title} (+{cp.bonusPct}% daily · Min ₱{cp.minInvestPhp})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1 tabular-nums">
                <div className="flex justify-between">
                  <span>Estimated Daily Interest</span>
                  <span className="font-semibold text-[#0B2545]">
                    {formatPhp(calculateDailyInterest(Number(amountInput) || 0, selectedFund.dailyRatePct))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Instant Purchase Bonus</span>
                  <span className="font-semibold text-emerald-700">
                    +{formatPhp(calculateFundPurchaseBonus(selectedFund, Number(amountInput) || 0))}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Confirm Investment</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
