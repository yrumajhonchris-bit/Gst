import { INITIAL_TASKS, MEMBERSHIP_TIERS, WEALTH_FUNDS } from '../data/ghaSeed';
import {
  ActiveInvestment,
  GhaAppState,
  MembershipCode,
  MembershipTier,
  TeamSubordinate,
  WealthFund,
} from '../types/gha';

export interface ActionResult {
  ok: boolean;
  message: string;
  state: GhaAppState;
  rewardAmount?: number;
  rewardLabel?: string;
}

export function normalizePhPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length >= 12) {
    return digits.slice(2, 12);
  }
  if (digits.startsWith('0') && digits.length >= 11) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

export function isValidPhPhone(raw: string): boolean {
  const normalized = normalizePhPhone(raw);
  return /^9\d{9}$/.test(normalized);
}

export function canUserInvite(state: GhaAppState): boolean {
  return Boolean(state.hasDeposited);
}

export function formatPhp(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `PHP ${safe.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNowTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(
    now.getDate()
  )}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

export function generateTxId(prefix = '2026'): string {
  const rand = Math.floor(1000000000 + Math.random() * 8999999999);
  return `${prefix}${rand}`;
}

export function getTierByCode(code: MembershipCode): MembershipTier {
  return MEMBERSHIP_TIERS.find((t) => t.code === code) ?? MEMBERSHIP_TIERS[0];
}

export function calculateWithdrawalFee(
  amountPhp: number,
  walletType: 'personal' | 'income',
  customFeePct?: number
): { grossPhp: number; feePhp: number; netPhp: number } {
  if (!Number.isFinite(amountPhp) || amountPhp <= 0) {
    return { grossPhp: 0, feePhp: 0, netPhp: 0 };
  }
  const defaultPct = walletType === 'income' ? 10 : 0;
  const pct = customFeePct !== undefined && Number.isFinite(customFeePct) ? Math.max(0, customFeePct) : defaultPct;
  const feeRate = pct / 100;
  const feePhp = Math.round(amountPhp * feeRate * 100) / 100;
  const netPhp = Math.round((amountPhp - feePhp) * 100) / 100;
  return { grossPhp: amountPhp, feePhp, netPhp };
}

export function calculateFundPurchaseBonus(fund: WealthFund, principalPhp: number): number {
  const matched = fund.bonusTiers.find(
    (tier) =>
      principalPhp >= tier.minAmount &&
      (tier.maxAmount === null || principalPhp <= tier.maxAmount)
  );
  if (!matched) return 0;
  return Math.round(principalPhp * (matched.bonusPct / 100) * 100) / 100;
}

export function calculateDailyInterest(
  principalPhp: number,
  dailyRatePct: number
): number {
  return Math.round(principalPhp * (dailyRatePct / 100) * 100) / 100;
}

export function getTaskProgress(state: GhaAppState): {
  completedCount: number;
  totalCount: number;
  percent: number;
} {
  const totalCount = state.tasks.length;
  const completedCount = state.tasks.filter((task) => task.status === 'completed').length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  return { completedCount, totalCount, percent };
}

export interface DepositOptions {
  approvalMode?: 'manual' | 'auto';
  minPhp?: number;
  maxPhp?: number;
  channelId?: string;
  channelAccountName?: string;
  channelAccountNumber?: string;
  senderReference?: string;
}

export function processDeposit(
  state: GhaAppState,
  amountPhp: number,
  channelName: string,
  gateway: 'paymaya' | 'paygcash' | 'GCash' | 'Maya',
  options?: DepositOptions
): ActionResult {
  const minPhp = options?.minPhp ?? 10;
  const maxPhp = options?.maxPhp ?? 250000;
  if (!Number.isFinite(amountPhp) || amountPhp < minPhp || amountPhp > maxPhp) {
    return {
      ok: false,
      message: `Deposit amount must be between ${formatPhp(minPhp)} and ${formatPhp(maxPhp)}.`,
      state,
    };
  }

  const approvalMode = options?.approvalMode ?? 'auto';
  const isManual = approvalMode === 'manual';
  const timestamp = formatNowTimestamp();
  const txId = generateTxId('202611');
  const gwLabel = gateway.toUpperCase();
  const refNote = options?.senderReference?.trim()
    ? ` · Ref: ${options.senderReference.trim()}`
    : '';
  const acctNote = options?.channelAccountNumber
    ? ` -> ${options.channelAccountNumber}`
    : '';

  const nextState: GhaAppState = {
    ...state,
    hasDeposited: isManual ? state.hasDeposited : true,
    wallets: {
      ...state.wallets,
      personalPhp: isManual
        ? state.wallets.personalPhp
        : Math.round((state.wallets.personalPhp + amountPhp) * 100) / 100,
    },
    financialRecords: [
      {
        id: txId,
        type: 'deposit',
        amountPhp,
        feePhp: 0,
        channel: `${channelName} (${gateway})`,
        timestamp,
        status: isManual ? 'Deposit to be confirmed' : 'Deposit successfully',
        walletType: 'personal',
        channelId: options?.channelId,
        channelAccountName: options?.channelAccountName,
        channelAccountNumber: options?.channelAccountNumber,
        senderReference: options?.senderReference?.trim() || undefined,
      },
      ...state.financialRecords,
    ],
    transactionRecords: isManual
      ? state.transactionRecords
      : [
          {
            id: generateTxId('tx'),
            direction: 'income',
            category: 'Personal Deposit',
            amountPhp,
            timestamp,
            note: `${channelName} via ${gwLabel}${acctNote}${refNote}`,
          },
          ...state.transactionRecords,
        ],
  };

  return {
    ok: true,
    message: isManual
      ? `Deposit order ${formatPhp(amountPhp)} submitted via ${gwLabel}${acctNote}. Waiting for Owner confirmation.`
      : `${formatPhp(amountPhp)} deposited to Personal Wallet via ${gwLabel}.`,
    state: nextState,
  };
}

export interface WithdrawalOptions {
  approvalMode?: 'manual' | 'auto';
  minPhp?: number;
  feePct?: number;
}

export function processWithdrawal(
  state: GhaAppState,
  amountPhp: number,
  walletType: 'personal' | 'income',
  txPassword: string,
  options?: WithdrawalOptions
): ActionResult {
  const minPhp = options?.minPhp ?? 100;
  if (!Number.isFinite(amountPhp) || amountPhp < minPhp) {
    return {
      ok: false,
      message: `Minimum withdrawal amount is ${formatPhp(minPhp)}.`,
      state,
    };
  }

  if (txPassword.trim() !== state.user.transactionPassword) {
    return {
      ok: false,
      message: 'Invalid transaction password. (Default PIN: 123456 unless updated in Settings)',
      state,
    };
  }

  const available =
    walletType === 'income' ? state.wallets.incomePhp : state.wallets.personalPhp;
  if (amountPhp > available) {
    return {
      ok: false,
      message: `Insufficient balance in ${
        walletType === 'income' ? 'Income Wallet' : 'Personal Wallet'
      }.`,
      state,
    };
  }

  const { feePhp, netPhp } = calculateWithdrawalFee(amountPhp, walletType, options?.feePct);
  const timestamp = formatNowTimestamp();
  const isManual = (options?.approvalMode ?? 'auto') === 'manual';

  const nextState: GhaAppState = {
    ...state,
    wallets: {
      ...state.wallets,
      incomePhp:
        walletType === 'income'
          ? Math.round((state.wallets.incomePhp - amountPhp) * 100) / 100
          : state.wallets.incomePhp,
      personalPhp:
        walletType === 'personal'
          ? Math.round((state.wallets.personalPhp - amountPhp) * 100) / 100
          : state.wallets.personalPhp,
    },
    financialRecords: [
      {
        id: generateTxId('1790'),
        type: 'withdraw',
        amountPhp,
        feePhp,
        channel: `${state.user.bankAccount.walletType} (${state.user.bankAccount.accountNumber})`,
        timestamp,
        status: isManual ? 'Withdrawal to be confirmed' : 'Successful withdrawals',
        walletType,
      },
      ...state.financialRecords,
    ],
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'expenditure',
        category: walletType === 'income' ? 'Income withdraw' : 'Personal withdraw',
        amountPhp: -amountPhp,
        timestamp,
        note: `${isManual ? 'Pending Owner payout · ' : ''}Net ${formatPhp(netPhp)} to ${state.user.bankAccount.accountNumber}`,
      },
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: isManual
      ? `Withdrawal request submitted (${formatPhp(netPhp)} net, Fee: ${formatPhp(feePhp)}) — awaiting Owner approval.`
      : `Withdrawal submitted! Net ${formatPhp(netPhp)} (Fee: ${formatPhp(feePhp)}) queued to ${state.user.bankAccount.walletType}.`,
    state: nextState,
  };
}

export function completeHotelTask(
  state: GhaAppState,
  taskId: string,
  rating: number,
  reviewNote: string
): ActionResult {
  if (rating < 1 || rating > 5) {
    return {
      ok: false,
      message: 'Please select a star rating between 1 and 5.',
      state,
    };
  }

  const target = state.tasks.find((task) => task.id === taskId);
  if (!target) {
    return { ok: false, message: 'Task not found.', state };
  }
  if (target.status === 'completed') {
    return { ok: false, message: 'This hotel audit is already completed.', state };
  }

  const tier = getTierByCode(state.user.level);
  const rewardPhp = Math.max(target.rewardPhp, tier.perTaskPhp);
  const timestamp = formatNowTimestamp();

  const updatedTasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          status: 'completed' as const,
          rating,
          reviewNote: reviewNote.trim() || 'Verified hospitality quality standards.',
          completedAt: timestamp,
          rewardPhp,
        }
      : task
  );

  const nextState: GhaAppState = {
    ...state,
    tasks: updatedTasks,
    wallets: {
      ...state.wallets,
      incomePhp: Math.round((state.wallets.incomePhp + rewardPhp) * 100) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + rewardPhp) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + rewardPhp) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + rewardPhp) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + rewardPhp) * 100) / 100,
    },
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'income',
        category: 'Task Income',
        amountPhp: rewardPhp,
        timestamp,
        note: `${target.hotelName} (${rating}★ audit)`,
      },
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Audit submitted! ${formatPhp(rewardPhp)} credited to Income Wallet.`,
    state: nextState,
    rewardAmount: rewardPhp,
  };
}

export function resetDailyTasks(state: GhaAppState): GhaAppState {
  const tier = getTierByCode(state.user.level);
  return {
    ...state,
    tasks: INITIAL_TASKS.map((task) => ({
      ...task,
      rewardPhp: tier.perTaskPhp,
      status: 'ongoing',
      rating: undefined,
      reviewNote: undefined,
      completedAt: undefined,
    })),
  };
}

export function investInFund(
  state: GhaAppState,
  fundId: string,
  amountPhp: number,
  walletSource: 'personal' | 'income',
  couponId?: string
): ActionResult {
  const fund = WEALTH_FUNDS.find((f) => f.id === fundId);
  if (!fund) {
    return { ok: false, message: 'Selected wealth fund was not found.', state };
  }
  if (!Number.isFinite(amountPhp) || amountPhp < fund.minAmountPhp) {
    return {
      ok: false,
      message: `Minimum investment for ${fund.name} is ${formatPhp(fund.minAmountPhp)}.`,
      state,
    };
  }

  const available =
    walletSource === 'personal' ? state.wallets.personalPhp : state.wallets.incomePhp;
  if (amountPhp > available) {
    return {
      ok: false,
      message: `Insufficient balance in ${
        walletSource === 'personal' ? 'Personal Wallet' : 'Income Wallet'
      }.`,
      state,
    };
  }

  let couponRateBoost = 0;
  let updatedCoupons = state.coupons;
  if (couponId) {
    const coupon = state.coupons.find((c) => c.id === couponId && !c.used);
    if (coupon && amountPhp >= coupon.minInvestPhp) {
      couponRateBoost = coupon.bonusPct;
      updatedCoupons = state.coupons.map((c) =>
        c.id === couponId ? { ...c, used: true } : c
      );
    }
  }

  const bonusPhp = calculateFundPurchaseBonus(fund, amountPhp);
  const effectiveDailyRate = Math.round((fund.dailyRatePct + couponRateBoost) * 100) / 100;
  const timestamp = formatNowTimestamp();

  const newPosition: ActiveInvestment = {
    id: generateTxId('inv'),
    fundId: fund.id,
    fundName: fund.name,
    principalPhp: amountPhp,
    dailyRatePct: effectiveDailyRate,
    termDays: fund.termDays,
    daysElapsed: 0,
    accruedInterestPhp: 0,
    purchaseBonusPhp: bonusPhp,
    startedAt: timestamp,
    status: 'active',
  };

  const newTx = [
    {
      id: generateTxId('tx'),
      direction: 'expenditure' as const,
      category: 'Wealth Allocation',
      amountPhp: -amountPhp,
      timestamp,
      note: `${fund.name} (${fund.termDays}d @ ${effectiveDailyRate}%/day)`,
    },
    ...(bonusPhp > 0
      ? [
          {
            id: generateTxId('txb'),
            direction: 'income' as const,
            category: 'Fund Purchase Bonus',
            amountPhp: bonusPhp,
            timestamp,
            note: `Campaign cash bonus on ${fund.name}`,
          },
        ]
      : []),
  ];

  const nextState: GhaAppState = {
    ...state,
    coupons: updatedCoupons,
    investments: [newPosition, ...state.investments],
    wallets: {
      ...state.wallets,
      personalPhp:
        walletSource === 'personal'
          ? Math.round((state.wallets.personalPhp - amountPhp) * 100) / 100
          : state.wallets.personalPhp,
      incomePhp:
        Math.round(
          ((walletSource === 'income'
            ? state.wallets.incomePhp - amountPhp
            : state.wallets.incomePhp) +
            bonusPhp) *
            100
        ) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + bonusPhp) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + bonusPhp) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + bonusPhp) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + bonusPhp) * 100) / 100,
    },
    transactionRecords: [...newTx, ...state.transactionRecords],
  };

  return {
    ok: true,
    message:
      bonusPhp > 0
        ? `Invested ${formatPhp(amountPhp)} in ${fund.name}! Instant ${formatPhp(bonusPhp)} bonus credited.`
        : `Invested ${formatPhp(amountPhp)} in ${fund.name}.`,
    state: nextState,
  };
}

export function advanceInvestmentDay(
  state: GhaAppState,
  investmentId: string
): ActionResult {
  const pos = state.investments.find((i) => i.id === investmentId);
  if (!pos || pos.status === 'matured') {
    return { ok: false, message: 'Investment already matured.', state };
  }

  const dailyYield = calculateDailyInterest(pos.principalPhp, pos.dailyRatePct);
  const nextDays = pos.daysElapsed + 1;
  const matured = nextDays >= pos.termDays;
  const nextAccrued = Math.round((pos.accruedInterestPhp + dailyYield) * 100) / 100;
  const timestamp = formatNowTimestamp();

  const updatedInvestments = state.investments.map((i) =>
    i.id === investmentId
      ? {
          ...i,
          daysElapsed: nextDays,
          accruedInterestPhp: nextAccrued,
          status: matured ? ('matured' as const) : ('active' as const),
        }
      : i
  );

  const payout = matured ? pos.principalPhp + nextAccrued : dailyYield;

  const nextState: GhaAppState = {
    ...state,
    investments: updatedInvestments,
    wallets: {
      ...state.wallets,
      incomePhp: Math.round((state.wallets.incomePhp + payout) * 100) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + dailyYield) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + dailyYield) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + dailyYield) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + dailyYield) * 100) / 100,
    },
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'income',
        category: matured ? 'Fund Maturity Payout' : 'Fund Daily Yield',
        amountPhp: payout,
        timestamp,
        note: `${pos.fundName} (Day ${nextDays}/${pos.termDays})`,
      },
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: matured
      ? `${pos.fundName} matured! Principal + total yield (${formatPhp(payout)}) credited.`
      : `Day ${nextDays} yield (${formatPhp(dailyYield)}) credited to Income Wallet.`,
    state: nextState,
  };
}

export function upgradeMembershipTier(
  state: GhaAppState,
  targetCode: MembershipCode
): ActionResult {
  const currentTier = getTierByCode(state.user.level);
  const targetTier = getTierByCode(targetCode);
  const currentIdx = MEMBERSHIP_TIERS.findIndex((t) => t.code === currentTier.code);
  const targetIdx = MEMBERSHIP_TIERS.findIndex((t) => t.code === targetTier.code);

  if (targetIdx <= currentIdx) {
    return {
      ok: false,
      message: `You are already at ${currentTier.code} or higher.`,
      state,
    };
  }

  const upgradeCost = Math.max(0, targetTier.securityDepositPhp - state.wallets.securityDepositPhp);
  if (upgradeCost > state.wallets.personalPhp) {
    return {
      ok: false,
      message: `Need ${formatPhp(upgradeCost)} in Personal Wallet to unlock ${targetTier.code}.`,
      state,
    };
  }

  // September KPI Sprint promotion bonuses
  let promoBonus = 0;
  if (currentTier.code === 'A1' && targetTier.code === 'A2') promoBonus = 158;
  else if (currentTier.code === 'A1' && targetTier.code === 'B1') promoBonus = 438;
  else if (currentTier.code === 'A2' && targetTier.code === 'B1') promoBonus = 388;
  else if (targetTier.code === 'A1') promoBonus = 88;

  const timestamp = formatNowTimestamp();

  const nextState: GhaAppState = {
    ...state,
    user: {
      ...state.user,
      level: targetTier.code,
      position: targetTier.title,
    },
    wallets: {
      ...state.wallets,
      personalPhp: Math.round((state.wallets.personalPhp - upgradeCost) * 100) / 100,
      securityDepositPhp: targetTier.securityDepositPhp,
      incomePhp: Math.round((state.wallets.incomePhp + promoBonus) * 100) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + promoBonus) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + promoBonus) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + promoBonus) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + promoBonus) * 100) / 100,
    },
    tasks: state.tasks.map((task) => ({
      ...task,
      rewardPhp: task.status === 'ongoing' ? targetTier.perTaskPhp : task.rewardPhp,
    })),
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'expenditure',
        category: 'Security Deposit Upgrade',
        amountPhp: -upgradeCost,
        timestamp,
        note: `Upgraded rank to ${targetTier.code} (${targetTier.title})`,
      },
      ...(promoBonus > 0
        ? [
            {
              id: generateTxId('txp'),
              direction: 'income' as const,
              category: 'Promotion Reward',
              amountPhp: promoBonus,
              timestamp,
              note: `KPI Sprint Promotion Bonus to ${targetTier.code}`,
            },
          ]
        : []),
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Promoted to ${targetTier.code} (${targetTier.title})!${
      promoBonus > 0 ? ` +${formatPhp(promoBonus)} promotion bonus awarded.` : ''
    }`,
    state: nextState,
  };
}

export function drawSurpriseCard(state: GhaAppState, cardSlot: number): ActionResult {
  if (state.inventory.surpriseCards <= 0) {
    return {
      ok: false,
      message: 'No Surprise Cards remaining. Invite new members to earn more!',
      state,
    };
  }

  const rewards = [
    { amount: 88, label: 'PHP 88.00 Cash Reward' },
    { amount: 168, label: 'PHP 168.00 Jackpot Bonus' },
    { amount: 38, label: 'PHP 38.00 Hospitality Bonus' },
  ];
  const picked = rewards[Math.abs(cardSlot) % rewards.length];
  const timestamp = formatNowTimestamp();

  const nextState: GhaAppState = {
    ...state,
    inventory: {
      ...state.inventory,
      surpriseCards: state.inventory.surpriseCards - 1,
    },
    wallets: {
      ...state.wallets,
      incomePhp: Math.round((state.wallets.incomePhp + picked.amount) * 100) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + picked.amount) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + picked.amount) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + picked.amount) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + picked.amount) * 100) / 100,
    },
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'income',
        category: 'Surprise Card Reward',
        amountPhp: picked.amount,
        timestamp,
        note: picked.label,
      },
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Card revealed: ${picked.label}!`,
    state: nextState,
    rewardAmount: picked.amount,
    rewardLabel: picked.label,
  };
}

export function smashGoldenEgg(state: GhaAppState, eggIndex: number): ActionResult {
  if (state.inventory.goldenEggs <= 0) {
    return {
      ok: false,
      message: 'No Golden Eggs remaining. Onboard A1/A2/B1 interns to earn more!',
      state,
    };
  }

  const prizes = [58, 158, 288];
  const amount = prizes[Math.abs(eggIndex) % prizes.length];
  const timestamp = formatNowTimestamp();

  const nextState: GhaAppState = {
    ...state,
    inventory: {
      ...state.inventory,
      goldenEggs: state.inventory.goldenEggs - 1,
    },
    wallets: {
      ...state.wallets,
      incomePhp: Math.round((state.wallets.incomePhp + amount) * 100) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + amount) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + amount) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + amount) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + amount) * 100) / 100,
    },
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'income',
        category: 'Golden Egg Smash',
        amountPhp: amount,
        timestamp,
        note: `Cracked Golden Egg #${eggIndex + 1}`,
      },
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Golden Egg cracked! You won ${formatPhp(amount)}!`,
    state: nextState,
    rewardAmount: amount,
  };
}

export function redeemCashGiftCode(
  state: GhaAppState,
  rawCode: string,
  customGiftCodes?: Record<string, number>
): ActionResult {
  const code = rawCode.trim().toUpperCase();
  const VALID_CODES: Record<string, number> = customGiftCodes ?? {
    GST2026: 68,
    GSTVIP: 128,
    PHILIPPINES: 88,
  };

  if (!code) {
    return { ok: false, message: 'Please enter a Cash Gift code.', state };
  }
  if (state.inventory.claimedGiftCodes.includes(code)) {
    return { ok: false, message: `Gift code "${code}" has already been redeemed.`, state };
  }
  const amount = VALID_CODES[code];
  if (!amount) {
    const sampleList = Object.keys(VALID_CODES).slice(0, 3).join(', ') || 'GST2026';
    return {
      ok: false,
      message: `Invalid gift code. Try ${sampleList}.`,
      state,
    };
  }

  const timestamp = formatNowTimestamp();
  const nextState: GhaAppState = {
    ...state,
    inventory: {
      ...state.inventory,
      claimedGiftCodes: [...state.inventory.claimedGiftCodes, code],
    },
    wallets: {
      ...state.wallets,
      incomePhp: Math.round((state.wallets.incomePhp + amount) * 100) / 100,
    },
    earnings: {
      ...state.earnings,
      todayPhp: Math.round((state.earnings.todayPhp + amount) * 100) / 100,
      thisWeekPhp: Math.round((state.earnings.thisWeekPhp + amount) * 100) / 100,
      thisMonthPhp: Math.round((state.earnings.thisMonthPhp + amount) * 100) / 100,
      totalIncomePhp: Math.round((state.earnings.totalIncomePhp + amount) * 100) / 100,
    },
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'income',
        category: 'Cash Gift Redemption',
        amountPhp: amount,
        timestamp,
        note: `Gift code ${code}`,
      },
      ...state.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Cash Gift redeemed! ${formatPhp(amount)} added to Income Wallet.`,
    state: nextState,
    rewardAmount: amount,
  };
}

export function isSportsWatchEligible(state: GhaAppState): boolean {
  const rankEligible = ['B1', 'B2', 'B3', 'C1', 'C2', 'C3'].includes(state.user.level);
  const inviteEligible = state.teamMembers.length >= 5;
  return rankEligible || inviteEligible;
}

export interface MemberEarningsBreakdown {
  taskCommissionPct: number;
  taskCommissionPhp: number;
  referralBonusPhp: number;
  totalGeneratedPhp: number;
}

export function calculateMemberEarningsForUser(
  member: TeamSubordinate,
  userLevel: MembershipCode
): MemberEarningsBreakdown {
  const tier = getTierByCode(userLevel);
  const taskCommissionPct =
    member.tier === 'A'
      ? tier.teamACommissionPct
      : member.tier === 'B'
      ? tier.teamBCommissionPct
      : tier.teamCCommissionPct;
  const taskCommissionPhp =
    Math.round(((member.taskEarnedPhp * taskCommissionPct) / 100) * 100) / 100;
  const referralBonusPhp =
    member.referralBonusPhp !== undefined
      ? member.referralBonusPhp
      : member.tier === 'A' && tier.canInviteRewards
      ? 128
      : 0;
  const totalGeneratedPhp =
    Math.round((taskCommissionPhp + referralBonusPhp) * 100) / 100;

  return {
    taskCommissionPct,
    taskCommissionPhp,
    referralBonusPhp,
    totalGeneratedPhp,
  };
}

export function summarizeReferredMembers(
  members: TeamSubordinate[],
  userLevel: MembershipCode
): {
  totalMembers: number;
  totalTaskVolumePhp: number;
  totalGeneratedPhp: number;
} {
  return members.reduce(
    (acc, member) => {
      const breakdown = calculateMemberEarningsForUser(member, userLevel);
      return {
        totalMembers: acc.totalMembers + 1,
        totalTaskVolumePhp:
          Math.round((acc.totalTaskVolumePhp + member.taskEarnedPhp) * 100) / 100,
        totalGeneratedPhp:
          Math.round((acc.totalGeneratedPhp + breakdown.totalGeneratedPhp) * 100) / 100,
      };
    },
    { totalMembers: 0, totalTaskVolumePhp: 0, totalGeneratedPhp: 0 }
  );
}
