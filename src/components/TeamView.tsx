import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Calendar,
  Check,
  Copy,
  HelpCircle,
  Lock,
  QrCode,
  Search,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  calculateMemberEarningsForUser,
  canUserInvite,
  formatPhp,
  getTierByCode,
  summarizeReferredMembers,
} from '../lib/ghaEngine';
import { GhaAppState, SubView } from '../types/gha';

interface TeamViewProps {
  state: GhaAppState;
  onSimulateRecruit: () => void;
  onOpenSubView: (view: SubView) => void;
}

export function TeamView({ state, onSimulateRecruit, onOpenSubView }: TeamViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'invite'>('team');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
  const [memberSearch, setMemberSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const tier = getTierByCode(state.user.level);
  const inviteUnlocked = canUserInvite(state);
  const inviteLink = `https://gst688.ph/#/reg?code=${state.user.inviteCode}`;

  const teamA = state.teamMembers.filter((m) => m.tier === 'A');
  const teamB = state.teamMembers.filter((m) => m.tier === 'B');
  const teamC = state.teamMembers.filter((m) => m.tier === 'C');

  const query = memberSearch.trim().toLowerCase();
  const filteredMembers = state.teamMembers.filter((m) => {
    const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
    const matchesQuery =
      !query ||
      m.name.toLowerCase().includes(query) ||
      m.maskedPhone.toLowerCase().includes(query) ||
      m.level.toLowerCase().includes(query) ||
      m.joinedAt.toLowerCase().includes(query);
    return matchesTier && matchesQuery;
  });
  const filteredSummary = summarizeReferredMembers(filteredMembers, state.user.level);

  const handleCopy = (text: string) => {
    if (!inviteUnlocked) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Top Segmented Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 max-w-md grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('team')}
            className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeSubTab === 'team'
                ? 'bg-white text-[#0B2545] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('invite')}
            className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              activeSubTab === 'invite'
                ? 'bg-[#1570EF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowHelp(true)}
          aria-label="Team commission help"
          className="min-w-[44px] min-h-[44px] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#0B2545]"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Deposit Gate Notice */}
      {!inviteUnlocked ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock className="w-5 h-5 text-[#C8922A] shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-amber-950">
              <strong>Invitation Locked:</strong> You must complete at least one deposit before unlocking your invitation code, referral link, and team rewards.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSubView('deposit')}
            className="h-10 px-4 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Go to Deposit</span>
          </button>
        </div>
      ) : (
        !tier.canInviteRewards && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-medium text-amber-900">
              Upgrade level from A0 to A1 or higher to unlock full team commission percentages.
            </p>
            <button
              type="button"
              onClick={() => onOpenSubView('vip-journey')}
              className="px-4 py-2 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white text-xs font-semibold whitespace-nowrap shrink-0"
            >
              Upgrade Level
            </button>
          </div>
        )
      )}

      {activeSubTab === 'team' ? (
        <div className="space-y-4">
          {/* Team Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">Total Team Size</p>
              <p className="text-2xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
                {state.teamMembers.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">Team Income</p>
              <p className="text-2xl font-display font-bold text-[#C8922A] tabular-nums mt-1">
                {formatPhp(state.earnings.teamTaskIncomePhp + state.earnings.teamInvitationIncomePhp)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-500">New Team Size</p>
              <p className="text-2xl font-display font-bold text-[#1570EF] tabular-nums mt-1">
                {state.teamMembers.length}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center justify-center">
              {inviteUnlocked ? (
                <button
                  type="button"
                  onClick={onSimulateRecruit}
                  className="w-full h-10 rounded-xl bg-[#0B2545] hover:bg-[#133C73] text-white text-xs font-semibold px-3"
                >
                  + Simulate New Recruit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenSubView('deposit')}
                  className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 inline-flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Deposit to Recruit</span>
                </button>
              )}
            </div>
          </div>

          {/* Team A, B, C Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Team A',
                subtitle: 'Direct A-level subordinates',
                members: teamA,
                taskPct: tier.teamACommissionPct,
                refPct: tier.canInviteRewards ? 8 : 0,
              },
              {
                label: 'Team B',
                subtitle: 'B-level subordinates (invited by A)',
                members: teamB,
                taskPct: tier.teamBCommissionPct || 9,
                refPct: tier.canInviteRewards ? 3 : 0,
              },
              {
                label: 'Team C',
                subtitle: 'C-level subordinates (invited by B)',
                members: teamC,
                taskPct: tier.teamCCommissionPct,
                refPct: tier.canInviteRewards ? 1 : 0,
              },
            ].map((group) => (
              <div key={group.label} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-[#0B2545]">{group.label}</h3>
                    <p className="text-xs text-slate-500">{group.subtitle}</p>
                  </div>
                  <span className="text-sm font-bold text-[#1570EF] tabular-nums">
                    {group.members.length} / {group.members.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Task Income ({group.taskPct}%)</p>
                    <p className="text-sm font-bold text-[#0B2545] tabular-nums mt-0.5">
                      {formatPhp(
                        group.members.reduce(
                          (sum, m) => sum + (m.taskEarnedPhp * group.taskPct) / 100,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500">Referral Income ({group.refPct}%)</p>
                    <p className="text-sm font-bold text-[#0B2545] tabular-nums mt-0.5">
                      {formatPhp(
                        group.members.reduce(
                          (sum, m) => sum + calculateMemberEarningsForUser(m, state.user.level).referralBonusPhp,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>

                {group.members.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {group.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">
                          {m.name} · {m.maskedPhone}
                        </span>
                        <span className="font-semibold text-[#C8922A]">{m.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Referred Members Detailed List */}
          <section
            aria-labelledby="referred-members-heading"
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2
                  id="referred-members-heading"
                  className="text-base font-display font-bold text-[#0B2545]"
                >
                  Referred Members Details ({state.teamMembers.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full roster of referred subordinates with join dates and total earnings generated for your account.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-left sm:text-right shrink-0">
                <p className="text-[11px] font-medium text-slate-500">Total Earnings Generated</p>
                <p className="text-base font-display font-bold text-[#C8922A] tabular-nums">
                  {formatPhp(filteredSummary.totalGeneratedPhp)}
                </p>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
                {(['ALL', 'A', 'B', 'C'] as const).map((tierOption) => (
                  <button
                    key={tierOption}
                    type="button"
                    onClick={() => setTierFilter(tierOption)}
                    className={`px-3 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      tierFilter === tierOption
                        ? 'bg-[#0B2545] text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tierOption === 'ALL' ? 'All Tiers' : `Tier ${tierOption}`}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 rounded-xl px-3 h-10 w-full sm:w-64 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white transition-colors">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search name, phone, date..."
                  aria-label="Search referred members"
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-[#0B2545]">
                  {state.teamMembers.length === 0
                    ? 'No referred members yet'
                    : 'No referred members match your filter'}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {state.teamMembers.length === 0
                    ? inviteUnlocked
                      ? 'Share your GST invitation link or simulate a recruit above to see each member’s join date and generated earnings.'
                      : 'Complete your first deposit to unlock your referral link and begin tracking referred members.'
                    : 'Try clearing your search term or selecting All Tiers.'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop & Tablet Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                        <th className="py-2.5 pr-4">Member</th>
                        <th className="py-2.5 pr-4">Tier &amp; Rank</th>
                        <th className="py-2.5 pr-4">Join Date</th>
                        <th className="py-2.5 pr-4 text-right">Member Task Volume</th>
                        <th className="py-2.5 pr-4 text-right">Referral Bonus</th>
                        <th className="py-2.5 pr-4 text-right">Task Commission</th>
                        <th className="py-2.5 text-right">Total Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm tabular-nums">
                      {filteredMembers.map((member) => {
                        const breakdown = calculateMemberEarningsForUser(member, state.user.level);
                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80">
                            <td className="py-3 pr-4">
                              <p className="font-semibold text-[#0B2545]">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.maskedPhone}</p>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B2545]">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                  Tier {member.tier}
                                </span>
                                <span className="text-[#C8922A]">{member.level}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-xs font-medium text-slate-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{member.joinedAt}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-right text-slate-700">
                              {formatPhp(member.taskEarnedPhp)}
                            </td>
                            <td className="py-3 pr-4 text-right text-slate-700">
                              {formatPhp(breakdown.referralBonusPhp)}
                            </td>
                            <td className="py-3 pr-4 text-right text-slate-700">
                              {formatPhp(breakdown.taskCommissionPhp)}{' '}
                              <span className="text-xs text-slate-400">
                                ({breakdown.taskCommissionPct}%)
                              </span>
                            </td>
                            <td className="py-3 text-right font-bold text-emerald-700">
                              {formatPhp(breakdown.totalGeneratedPhp)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 bg-slate-50 text-xs font-semibold text-[#0B2545] tabular-nums">
                        <td className="py-2.5 pr-4" colSpan={3}>
                          Showing {filteredSummary.totalMembers} referred member
                          {filteredSummary.totalMembers === 1 ? '' : 's'}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          {formatPhp(filteredSummary.totalTaskVolumePhp)}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-slate-500" colSpan={2}>
                          Combined Earnings Generated
                        </td>
                        <td className="py-2.5 text-right text-sm font-bold text-[#C8922A]">
                          {formatPhp(filteredSummary.totalGeneratedPhp)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filteredMembers.map((member) => {
                    const breakdown = calculateMemberEarningsForUser(member, state.user.level);
                    return (
                      <div
                        key={member.id}
                        className="rounded-xl border border-slate-200 p-3.5 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[#0B2545]">{member.name}</p>
                            <p className="text-xs text-slate-500 tabular-nums">{member.maskedPhone}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-[#0B2545]">
                              Tier {member.tier} · {member.level}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1 tabular-nums inline-flex items-center gap-1 justify-end w-full">
                              <Calendar className="w-3 h-3" />
                              <span>Joined {member.joinedAt}</span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs tabular-nums">
                          <div>
                            <p className="text-slate-500">Task Vol.</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {formatPhp(member.taskEarnedPhp)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Bonus + Comm.</p>
                            <p className="font-semibold text-slate-800 mt-0.5">
                              {formatPhp(breakdown.referralBonusPhp)} + {formatPhp(breakdown.taskCommissionPhp)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-500">Generated</p>
                            <p className="font-bold text-emerald-700 mt-0.5">
                              {formatPhp(breakdown.totalGeneratedPhp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* Subordinate Rules Explanation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm text-slate-600 space-y-2">
            <p>People who join through your invitation link are your A-level subordinates.</p>
            <p>People who join through the invitation link of your A-level subordinates are your B-level subordinates.</p>
            <p>People who join through the invitation link of your B-level subordinates are your C-level subordinates.</p>
            <p className="text-slate-800 font-medium">
              Any deposited regular employee has the right to recruit people who need jobs to join GST. The more people you recruit, the more recruitment rewards you get.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* QR & Invite Code Card (Locked until deposit) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center">
            {!inviteUnlocked ? (
              <div className="py-6 space-y-4 w-full">
                <div className="w-20 h-20 rounded-2xl bg-amber-50 text-[#C8922A] flex items-center justify-center mx-auto">
                  <Lock className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#0B2545]">
                    Deposit Required to Invite
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Make your first deposit (minimum PHP 100) to activate your personal GST invitation code and earn referral rewards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenSubView('deposit')}
                  className="w-full h-11 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Deposit Now to Unlock</span>
                </button>
              </div>
            ) : (
              <>
                <div className="w-40 h-40 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                  <QrCode className="w-28 h-28 text-[#0B2545]" />
                </div>
                <p className="text-xs text-slate-500">Exclusive Invitation Code</p>
                <p className="text-2xl font-mono font-bold tracking-wider text-[#0B2545] mt-1">
                  {state.user.inviteCode}
                </p>
                <p className="text-xs text-slate-500 mt-2 break-all">{inviteLink}</p>
                <div className="mt-4 flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => handleCopy(state.user.inviteCode)}
                    className="flex-1 h-11 rounded-xl bg-[#0B2545] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(inviteLink)}
                    className="flex-1 h-11 rounded-xl bg-[#1570EF] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 4-Step Invitation Guide */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-[#0B2545]">
              How Recruitment Rewards Work
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">1. Activate account with a deposit:</p>
                <p>Complete your initial deposit to unlock your exclusive recruitment link and invitation code.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">2. Share your link or invitation code:</p>
                <p>Copy your exclusive recruitment link or invitation code to invite family or friends who need a hospitality coordination job.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">3. Get rewards:</p>
                <p>
                  When someone signs up using your link, they become your A-level subordinate. Invite A1 = 128 PHP, A2 = 288 PHP, B1 = 688 PHP + Surprise Cards &amp; Golden Egg Smashes!
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="font-semibold text-[#C8922A]">4. Warm Tips:</p>
                <p>
                  Your level must be higher than or equal to your subordinates&apos; level to receive rewards from their daily tasks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Team Commission Rules"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg text-[#0B2545]">Team Commission Guide</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close team rules"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 mb-5">
              <li>• Deposit first to unlock your invitation code and link</li>
              <li>• Invite A1 hire: 128 PHP + 1 Surprise Card</li>
              <li>• Invite A2 hire: 288 PHP + 2 Surprise Cards</li>
              <li>• Invite B1 hire: 688 PHP + 3 Surprise Cards</li>
              <li>• Invite 5 members: Unlock FREE GST Sports Watch!</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full h-11 rounded-xl bg-[#0B2545] text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
