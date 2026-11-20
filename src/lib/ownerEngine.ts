import { ANNOUNCEMENTS, INITIAL_TASKS } from '../data/ghaSeed';
import {
  AccountsStore,
  BankAccountInfo,
  DepositChannel,
  GhaAppState,
  MembershipCode,
  OwnerAccount,
  PhoneVerificationEntry,
  SystemConfig,
  SystemFeatureFlags,
} from '../types/gha';
import {
  formatNowTimestamp,
  formatPhp,
  generateTxId,
  getTierByCode,
  isValidPhPhone,
  normalizePhPhone,
} from './ghaEngine';

export const DEFAULT_OWNER_ID = 'gst_owner';
export const DEFAULT_OWNER_PASSWORD = 'JCYBP.123';

export function createDefaultOwnerAccount(): OwnerAccount {
  return {
    configured: true,
    ownerId: DEFAULT_OWNER_ID,
    name: 'GST System Owner',
    password: DEFAULT_OWNER_PASSWORD,
    createdAt: formatNowTimestamp(),
    defaultPwdApplied: true,
  };
}

export function createDefaultFeatureFlags(): SystemFeatureFlags {
  return {
    depositsEnabled: true,
    withdrawalsEnabled: true,
    tasksEnabled: true,
    wealthEnabled: true,
    teamInviteEnabled: true,
    surpriseCardEnabled: true,
    goldenEggEnabled: true,
    cashGiftEnabled: true,
    sportsWatchEnabled: true,
    vipUpgradeEnabled: true,
    customerServiceEnabled: true,
  };
}

export function createDefaultSystemConfig(): SystemConfig {
  return {
    practiceMode: true,
    depositApprovalMode: 'manual',
    withdrawApprovalMode: 'manual',
    minDepositPhp: 10,
    maxDepositPhp: 250000,
    minWithdrawPhp: 100,
    incomeWithdrawFeePct: 10,
    personalWithdrawFeePct: 0,
    features: createDefaultFeatureFlags(),
    depositChannels: [],
    announcements: [...ANNOUNCEMENTS],
    giftCodes: {
      GST2026: 68,
      GSTVIP: 128,
      PHILIPPINES: 88,
    },
  };
}

export function ensureStoreDefaults(store: AccountsStore): AccountsStore {
  const defaultCfg = createDefaultSystemConfig();
  const rawCfg = store.systemConfig;
  const mergedCfg: SystemConfig = rawCfg
    ? {
        ...defaultCfg,
        ...rawCfg,
        features: {
          ...defaultCfg.features,
          ...(rawCfg.features ?? {}),
        },
        depositChannels: Array.isArray(rawCfg.depositChannels) ? rawCfg.depositChannels : [],
        announcements: Array.isArray(rawCfg.announcements) ? rawCfg.announcements : defaultCfg.announcements,
        giftCodes: rawCfg.giftCodes ?? defaultCfg.giftCodes,
      }
    : defaultCfg;

  const rawOwner = store.owner;
  const resolvedOwner: OwnerAccount =
    rawOwner && rawOwner.configured && rawOwner.defaultPwdApplied
      ? rawOwner
      : {
          configured: true,
          ownerId: rawOwner?.ownerId?.trim() || DEFAULT_OWNER_ID,
          name: rawOwner?.name?.trim() || 'GST System Owner',
          password: DEFAULT_OWNER_PASSWORD,
          createdAt: rawOwner?.createdAt || formatNowTimestamp(),
          defaultPwdApplied: true,
        };

  return {
    activePhone: store.activePhone ?? null,
    accounts: store.accounts ?? {},
    owner: resolvedOwner,
    ownerAuthenticated: Boolean(store.ownerAuthenticated),
    systemConfig: mergedCfg,
    pendingVerifications: store.pendingVerifications ?? {},
  };
}

export interface OwnerActionResult {
  ok: boolean;
  message: string;
  store: AccountsStore;
}

export function setupOwnerAccount(
  store: AccountsStore,
  ownerId: string,
  name: string,
  password: string,
  confirmPassword: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  if (normalized.owner?.configured) {
    return {
      ok: false,
      message: 'Owner account is already initialized. Please sign in.',
      store: normalized,
    };
  }
  const cleanId = ownerId.trim();
  const cleanName = name.trim() || 'GST System Owner';
  if (cleanId.length < 3) {
    return {
      ok: false,
      message: 'Owner ID / Username must be at least 3 characters.',
      store: normalized,
    };
  }
  if (password.length < 6) {
    return {
      ok: false,
      message: 'Owner password must be at least 6 characters.',
      store: normalized,
    };
  }
  if (password !== confirmPassword) {
    return {
      ok: false,
      message: 'Owner passwords do not match.',
      store: normalized,
    };
  }

  return {
    ok: true,
    message: 'Owner account created! Welcome to the GST Owner Management Console.',
    store: {
      ...normalized,
      ownerAuthenticated: true,
      owner: {
        configured: true,
        ownerId: cleanId,
        name: cleanName,
        password,
        createdAt: formatNowTimestamp(),
      },
    },
  };
}

export function loginOwnerAccount(
  store: AccountsStore,
  ownerId: string,
  password: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const owner = normalized.owner!;
  if (!owner.configured) {
    return {
      ok: false,
      message: 'Owner account has not been created yet.',
      store: normalized,
    };
  }
  if (ownerId.trim().toLowerCase() !== owner.ownerId.toLowerCase()) {
    return {
      ok: false,
      message: 'Incorrect Owner ID.',
      store: normalized,
    };
  }
  if (password !== owner.password) {
    return {
      ok: false,
      message: 'Incorrect Owner password.',
      store: normalized,
    };
  }
  return {
    ok: true,
    message: 'Signed in as GST System Owner.',
    store: {
      ...normalized,
      ownerAuthenticated: true,
    },
  };
}

export function updateOwnerProfile(
  store: AccountsStore,
  ownerId: string,
  name: string,
  newPassword?: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const current = normalized.owner!;
  if (ownerId.trim().length < 3) {
    return { ok: false, message: 'Owner ID must be at least 3 characters.', store: normalized };
  }
  if (newPassword && newPassword.length < 6) {
    return { ok: false, message: 'New password must be at least 6 characters.', store: normalized };
  }
  return {
    ok: true,
    message: 'Owner account credentials updated.',
    store: {
      ...normalized,
      owner: {
        ...current,
        ownerId: ownerId.trim(),
        name: name.trim() || current.name,
        password: newPassword ? newPassword : current.password,
        defaultPwdApplied: true,
      },
    },
  };
}

export interface UpsertChannelInput {
  id?: string;
  channelName: string;
  provider: 'GCash' | 'Maya';
  accountName: string;
  accountNumber: string;
  paymentUrl?: string;
  instructions?: string;
  minPhp?: number;
  maxPhp?: number;
  enabled?: boolean;
}

export function ownerUpsertDepositChannel(
  store: AccountsStore,
  input: UpsertChannelInput
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const cfg = normalized.systemConfig!;
  const channelName = input.channelName.trim();
  const accountName = input.accountName.trim();
  const accountNumber = input.accountNumber.replace(/\s+/g, '').trim();

  if (!channelName) {
    return { ok: false, message: 'Enter a deposit channel name.', store: normalized };
  }
  if (!accountName) {
    return { ok: false, message: 'Enter the GCash / Maya account holder name.', store: normalized };
  }
  if (!/^\d{10,13}$/.test(accountNumber.replace(/\D/g, ''))) {
    return {
      ok: false,
      message: 'Enter a valid GCash or Maya account/mobile number (10–13 digits).',
      store: normalized,
    };
  }

  const minPhp = Number.isFinite(input.minPhp) && (input.minPhp ?? 0) >= 1 ? Number(input.minPhp) : cfg.minDepositPhp;
  const maxPhp = Number.isFinite(input.maxPhp) && (input.maxPhp ?? 0) >= minPhp ? Number(input.maxPhp) : cfg.maxDepositPhp;

  const existing = input.id ? cfg.depositChannels.find((c) => c.id === input.id) : undefined;
  const record: DepositChannel = {
    id: existing?.id ?? generateTxId('ch'),
    channelName,
    provider: input.provider,
    accountName,
    accountNumber,
    paymentUrl: input.paymentUrl?.trim() || undefined,
    instructions: input.instructions?.trim() || undefined,
    minPhp,
    maxPhp,
    enabled: input.enabled ?? existing?.enabled ?? true,
    createdAt: existing?.createdAt ?? formatNowTimestamp(),
  };

  const nextChannels = existing
    ? cfg.depositChannels.map((c) => (c.id === existing.id ? record : c))
    : [...cfg.depositChannels, record];

  return {
    ok: true,
    message: existing
      ? `Updated ${record.provider} channel "${record.channelName}".`
      : `Added ${record.provider} deposit channel "${record.channelName}" (${record.accountNumber}).`,
    store: {
      ...normalized,
      systemConfig: {
        ...cfg,
        depositChannels: nextChannels,
      },
    },
  };
}

export function ownerToggleDepositChannel(
  store: AccountsStore,
  channelId: string,
  enabled: boolean
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const cfg = normalized.systemConfig!;
  const found = cfg.depositChannels.find((c) => c.id === channelId);
  if (!found) {
    return { ok: false, message: 'Deposit channel not found.', store: normalized };
  }
  return {
    ok: true,
    message: `${found.provider} channel "${found.channelName}" ${enabled ? 'enabled' : 'disabled'}.`,
    store: {
      ...normalized,
      systemConfig: {
        ...cfg,
        depositChannels: cfg.depositChannels.map((c) =>
          c.id === channelId ? { ...c, enabled } : c
        ),
      },
    },
  };
}

export function ownerDeleteDepositChannel(
  store: AccountsStore,
  channelId: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const cfg = normalized.systemConfig!;
  const found = cfg.depositChannels.find((c) => c.id === channelId);
  if (!found) {
    return { ok: false, message: 'Deposit channel not found.', store: normalized };
  }
  return {
    ok: true,
    message: `Removed ${found.provider} channel "${found.channelName}".`,
    store: {
      ...normalized,
      systemConfig: {
        ...cfg,
        depositChannels: cfg.depositChannels.filter((c) => c.id !== channelId),
      },
    },
  };
}

export function ownerToggleFeatureFlag(
  store: AccountsStore,
  key: keyof SystemFeatureFlags,
  enabled: boolean
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const cfg = normalized.systemConfig!;
  return {
    ok: true,
    message: `Updated ${key} to ${enabled ? 'Enabled' : 'Paused'}.`,
    store: {
      ...normalized,
      systemConfig: {
        ...cfg,
        features: {
          ...cfg.features,
          [key]: enabled,
        },
      },
    },
  };
}

export function ownerUpdateTransactionRules(
  store: AccountsStore,
  patch: Partial<
    Pick<
      SystemConfig,
      | 'depositApprovalMode'
      | 'withdrawApprovalMode'
      | 'minDepositPhp'
      | 'maxDepositPhp'
      | 'minWithdrawPhp'
      | 'incomeWithdrawFeePct'
      | 'personalWithdrawFeePct'
    >
  >
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const cfg = normalized.systemConfig!;
  const next: SystemConfig = {
    ...cfg,
    depositApprovalMode: patch.depositApprovalMode ?? cfg.depositApprovalMode,
    withdrawApprovalMode: patch.withdrawApprovalMode ?? cfg.withdrawApprovalMode,
    minDepositPhp: Math.max(1, Number(patch.minDepositPhp ?? cfg.minDepositPhp) || 10),
    maxDepositPhp: Math.max(10, Number(patch.maxDepositPhp ?? cfg.maxDepositPhp) || 250000),
    minWithdrawPhp: Math.max(1, Number(patch.minWithdrawPhp ?? cfg.minWithdrawPhp) || 100),
    incomeWithdrawFeePct: Math.min(50, Math.max(0, Number(patch.incomeWithdrawFeePct ?? cfg.incomeWithdrawFeePct) || 0)),
    personalWithdrawFeePct: Math.min(50, Math.max(0, Number(patch.personalWithdrawFeePct ?? cfg.personalWithdrawFeePct) || 0)),
  };
  return {
    ok: true,
    message: 'System transaction rules & limits saved.',
    store: {
      ...normalized,
      systemConfig: next,
    },
  };
}

export function ownerAdjustMemberWallet(
  store: AccountsStore,
  phone: string,
  walletType: 'personal' | 'income',
  deltaPhp: number,
  note: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  if (!Number.isFinite(deltaPhp) || deltaPhp === 0) {
    return { ok: false, message: 'Enter a non-zero PHP adjustment amount.', store: normalized };
  }

  const currentBalance =
    walletType === 'personal' ? account.wallets.personalPhp : account.wallets.incomePhp;
  const nextBalance = Math.round((currentBalance + deltaPhp) * 100) / 100;
  if (nextBalance < 0) {
    return {
      ok: false,
      message: `Cannot deduct ${formatPhp(Math.abs(deltaPhp))} from ${formatPhp(currentBalance)}.`,
      store: normalized,
    };
  }

  const timestamp = formatNowTimestamp();
  const isDepositCredit = walletType === 'personal' && deltaPhp > 0;
  const nextAccount: GhaAppState = {
    ...account,
    hasDeposited: isDepositCredit ? true : account.hasDeposited,
    wallets: {
      ...account.wallets,
      personalPhp: walletType === 'personal' ? nextBalance : account.wallets.personalPhp,
      incomePhp: walletType === 'income' ? nextBalance : account.wallets.incomePhp,
    },
    financialRecords: isDepositCredit
      ? [
          {
            id: generateTxId('OWN'),
            type: 'deposit',
            amountPhp: deltaPhp,
            feePhp: 0,
            channel: 'Owner System Credit',
            timestamp,
            status: 'Deposit successfully',
            walletType: 'personal',
            ownerNote: note.trim() || 'Direct Owner system credit',
          },
          ...account.financialRecords,
        ]
      : account.financialRecords,
    transactionRecords: [
      {
        id: generateTxId('otx'),
        direction: deltaPhp > 0 ? 'income' : 'expenditure',
        category: deltaPhp > 0 ? 'Owner System Credit' : 'Owner System Debit',
        amountPhp: deltaPhp,
        timestamp,
        note: note.trim() || `Adjusted ${walletType} wallet by System Owner`,
      },
      ...account.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Updated +63 ${phone} ${walletType} wallet by ${deltaPhp > 0 ? '+' : ''}${formatPhp(deltaPhp)}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: nextAccount,
      },
    },
  };
}

export function ownerSetMemberRank(
  store: AccountsStore,
  phone: string,
  level: MembershipCode
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const tier = getTierByCode(level);
  const nextAccount: GhaAppState = {
    ...account,
    user: {
      ...account.user,
      level: tier.code,
      position: tier.title,
    },
    wallets: {
      ...account.wallets,
      securityDepositPhp: tier.securityDepositPhp,
    },
    tasks: account.tasks.map((task) => ({
      ...task,
      rewardPhp: task.status === 'ongoing' ? tier.perTaskPhp : task.rewardPhp,
    })),
  };

  return {
    ok: true,
    message: `Updated +63 ${phone} rank to ${tier.code} (${tier.title}).`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: nextAccount,
      },
    },
  };
}

export function ownerGrantPracticeDraws(
  store: AccountsStore,
  phone: string,
  addCards: number,
  addEggs: number,
  resetTasks: boolean
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const tier = getTierByCode(account.user.level);
  const safeCards = Math.max(0, Math.floor(addCards));
  const safeEggs = Math.max(0, Math.floor(addEggs));

  const nextAccount: GhaAppState = {
    ...account,
    inventory: {
      ...account.inventory,
      surpriseCards: account.inventory.surpriseCards + safeCards,
      goldenEggs: account.inventory.goldenEggs + safeEggs,
    },
    tasks: resetTasks
      ? INITIAL_TASKS.map((t) => ({
          ...t,
          rewardPhp: tier.perTaskPhp,
          status: 'ongoing',
        }))
      : account.tasks,
  };

  return {
    ok: true,
    message: `Practice rewards applied for +63 ${phone} (+${safeCards} cards, +${safeEggs} eggs${
      resetTasks ? ', tasks reset' : ''
    }).`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: nextAccount,
      },
    },
  };
}

export function ownerToggleInviteUnlock(
  store: AccountsStore,
  phone: string,
  unlocked: boolean
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  return {
    ok: true,
    message: `Invitations ${unlocked ? 'unlocked' : 'locked'} for +63 ${phone}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: {
          ...account,
          hasDeposited: unlocked,
        },
      },
    },
  };
}

export function ownerSetMemberBankAccount(
  store: AccountsStore,
  phone: string,
  bankAccount: BankAccountInfo
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  return {
    ok: true,
    message: `Updated payout account for +63 ${phone} (${bankAccount.walletType}).`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: {
          ...account,
          user: {
            ...account.user,
            bankAccount,
          },
        },
      },
    },
  };
}

export function ownerApproveDepositRecord(
  store: AccountsStore,
  phone: string,
  recordId: string,
  note?: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const rec = account.financialRecords.find((r) => r.id === recordId && r.type === 'deposit');
  if (!rec) {
    return { ok: false, message: 'Deposit record not found.', store: normalized };
  }
  if (rec.status === 'Deposit successfully') {
    return { ok: false, message: 'This deposit is already approved.', store: normalized };
  }
  if (rec.status === 'Deposit order closed') {
    return { ok: false, message: 'This deposit order was already closed/rejected.', store: normalized };
  }

  const timestamp = formatNowTimestamp();
  const nextAccount: GhaAppState = {
    ...account,
    hasDeposited: true,
    wallets: {
      ...account.wallets,
      personalPhp: Math.round((account.wallets.personalPhp + rec.amountPhp) * 100) / 100,
    },
    financialRecords: account.financialRecords.map((r) =>
      r.id === recordId
        ? {
            ...r,
            status: 'Deposit successfully' as const,
            ownerNote: note?.trim() || 'Approved by GST Owner',
          }
        : r
    ),
    transactionRecords: [
      {
        id: generateTxId('tx'),
        direction: 'income',
        category: 'Owner Approved Deposit',
        amountPhp: rec.amountPhp,
        timestamp,
        note: `Approved ${rec.channel} (${rec.id})${note?.trim() ? ` · ${note.trim()}` : ''}`,
      },
      ...account.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Approved ${formatPhp(rec.amountPhp)} deposit for +63 ${phone}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: nextAccount,
      },
    },
  };
}

export function ownerRejectDepositRecord(
  store: AccountsStore,
  phone: string,
  recordId: string,
  note?: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const rec = account.financialRecords.find((r) => r.id === recordId && r.type === 'deposit');
  if (!rec) {
    return { ok: false, message: 'Deposit record not found.', store: normalized };
  }
  if (rec.status === 'Deposit successfully') {
    return { ok: false, message: 'Cannot close an already approved deposit.', store: normalized };
  }
  if (rec.status === 'Deposit order closed') {
    return { ok: false, message: 'This deposit order is already closed.', store: normalized };
  }

  return {
    ok: true,
    message: `Closed deposit order ${rec.id} for +63 ${phone}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: {
          ...account,
          financialRecords: account.financialRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: 'Deposit order closed' as const,
                  ownerNote: note?.trim() || 'Closed by GST Owner',
                }
              : r
          ),
        },
      },
    },
  };
}

export function ownerApproveWithdrawalRecord(
  store: AccountsStore,
  phone: string,
  recordId: string,
  note?: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const rec = account.financialRecords.find((r) => r.id === recordId && r.type === 'withdraw');
  if (!rec) {
    return { ok: false, message: 'Withdrawal record not found.', store: normalized };
  }
  if (rec.status === 'Successful withdrawals') {
    return { ok: false, message: 'This withdrawal is already settled.', store: normalized };
  }
  if (rec.status === 'Withdrawal rejected') {
    return { ok: false, message: 'This withdrawal was already rejected and refunded.', store: normalized };
  }

  return {
    ok: true,
    message: `Approved withdrawal ${rec.id} (${formatPhp(rec.amountPhp - rec.feePhp)} net) for +63 ${phone}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: {
          ...account,
          financialRecords: account.financialRecords.map((r) =>
            r.id === recordId
              ? {
                  ...r,
                  status: 'Successful withdrawals' as const,
                  ownerNote: note?.trim() || 'Payout released by GST Owner',
                }
              : r
          ),
        },
      },
    },
  };
}

export function ownerRejectWithdrawalRecord(
  store: AccountsStore,
  phone: string,
  recordId: string,
  note?: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const rec = account.financialRecords.find((r) => r.id === recordId && r.type === 'withdraw');
  if (!rec) {
    return { ok: false, message: 'Withdrawal record not found.', store: normalized };
  }
  if (rec.status === 'Withdrawal rejected') {
    return { ok: false, message: 'This withdrawal is already rejected and refunded.', store: normalized };
  }

  // Refund amount back to the source wallet (defaults to income if fee > 0 else personal)
  const targetWallet: 'personal' | 'income' =
    rec.walletType ?? (rec.feePhp > 0 ? 'income' : 'personal');
  const timestamp = formatNowTimestamp();

  const nextAccount: GhaAppState = {
    ...account,
    wallets: {
      ...account.wallets,
      incomePhp:
        targetWallet === 'income'
          ? Math.round((account.wallets.incomePhp + rec.amountPhp) * 100) / 100
          : account.wallets.incomePhp,
      personalPhp:
        targetWallet === 'personal'
          ? Math.round((account.wallets.personalPhp + rec.amountPhp) * 100) / 100
          : account.wallets.personalPhp,
    },
    financialRecords: account.financialRecords.map((r) =>
      r.id === recordId
        ? {
            ...r,
            status: 'Withdrawal rejected' as const,
            ownerNote: note?.trim() || 'Rejected & refunded by GST Owner',
          }
        : r
    ),
    transactionRecords: [
      {
        id: generateTxId('txr'),
        direction: 'income',
        category: 'Withdrawal Refund',
        amountPhp: rec.amountPhp,
        timestamp,
        note: `Refunded ${rec.id} to ${targetWallet} wallet${note?.trim() ? ` (${note.trim()})` : ''}`,
      },
      ...account.transactionRecords,
    ],
  };

  return {
    ok: true,
    message: `Rejected withdrawal ${rec.id} and refunded ${formatPhp(rec.amountPhp)} to ${targetWallet} wallet.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: nextAccount,
      },
    },
  };
}

export function ownerDeleteTransactionRecord(
  store: AccountsStore,
  phone: string,
  txId: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const exists = account.transactionRecords.some((tx) => tx.id === txId);
  if (!exists) {
    return { ok: false, message: 'Transaction record not found.', store: normalized };
  }
  return {
    ok: true,
    message: `Removed transaction ${txId} from +63 ${phone}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: {
          ...account,
          transactionRecords: account.transactionRecords.filter((tx) => tx.id !== txId),
        },
      },
    },
  };
}

export function ownerReplyToMemberChat(
  store: AccountsStore,
  phone: string,
  text: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const account = normalized.accounts[phone];
  if (!account) {
    return { ok: false, message: 'Member account not found.', store: normalized };
  }
  const clean = text.trim();
  if (!clean) {
    return { ok: false, message: 'Message cannot be empty.', store: normalized };
  }
  const now = formatNowTimestamp().slice(0, 5);
  return {
    ok: true,
    message: `Reply sent to +63 ${phone}.`,
    store: {
      ...normalized,
      accounts: {
        ...normalized.accounts,
        [phone]: {
          ...account,
          chatHistory: [
            ...account.chatHistory,
            {
              id: generateTxId('own'),
              sender: 'agent',
              text: `[Owner Desk] ${clean}`,
              timestamp: now,
            },
          ],
        },
      },
    },
  };
}

export function requestMemberVerificationCode(
  store: AccountsStore,
  rawPhone: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  if (!isValidPhPhone(rawPhone)) {
    return {
      ok: false,
      message: 'Enter a valid 10-digit +63 mobile number starting with 9 (e.g. 9175551234).',
      store: normalized,
    };
  }
  const clean = normalizePhPhone(rawPhone);
  if (normalized.accounts[clean]) {
    return {
      ok: false,
      message: `Phone +63 ${clean} is already registered. Please sign in instead.`,
      store: normalized,
    };
  }

  const existing = normalized.pendingVerifications?.[clean];
  if (existing && existing.status === 'issued' && existing.code) {
    return {
      ok: true,
      message: `Verification request logged for +63 ${clean}. Please obtain your 6-digit verification code from the GST System Owner.`,
      store: normalized,
    };
  }

  const entry: PhoneVerificationEntry = {
    phone: clean,
    code: '',
    status: 'requested',
    requestedAt: formatNowTimestamp(),
  };

  return {
    ok: true,
    message: `Verification request sent to GST System Owner for +63 ${clean}. Ask the Owner for your 6-digit verification code.`,
    store: {
      ...normalized,
      pendingVerifications: {
        ...(normalized.pendingVerifications ?? {}),
        [clean]: entry,
      },
    },
  };
}

export function ownerIssueVerificationCode(
  store: AccountsStore,
  rawPhone: string,
  customCode?: string,
  note?: string
): OwnerActionResult & { code?: string } {
  const normalized = ensureStoreDefaults(store);
  if (!isValidPhPhone(rawPhone)) {
    return {
      ok: false,
      message: 'Enter a valid 10-digit +63 mobile number starting with 9 (e.g. 9175551234).',
      store: normalized,
    };
  }
  const clean = normalizePhPhone(rawPhone);
  if (normalized.accounts[clean]) {
    return {
      ok: false,
      message: `Phone +63 ${clean} is already registered as a GST member.`,
      store: normalized,
    };
  }

  const trimmedCode = (customCode ?? '').trim();
  if (trimmedCode && !/^\d{6}$/.test(trimmedCode)) {
    return {
      ok: false,
      message: 'Verification code must be exactly 6 digits (or leave blank to auto-generate).',
      store: normalized,
    };
  }

  const code = trimmedCode || String(Math.floor(100000 + Math.random() * 900000));
  const now = formatNowTimestamp();
  const existing = normalized.pendingVerifications?.[clean];
  const entry: PhoneVerificationEntry = {
    phone: clean,
    code,
    status: 'issued',
    requestedAt: existing?.requestedAt || now,
    issuedAt: now,
    note: note?.trim() || existing?.note,
  };

  return {
    ok: true,
    code,
    message: `Issued verification code ${code} to +63 ${clean}.`,
    store: {
      ...normalized,
      pendingVerifications: {
        ...(normalized.pendingVerifications ?? {}),
        [clean]: entry,
      },
    },
  };
}

export function verifyMemberOtpCode(
  store: AccountsStore,
  rawPhone: string,
  inputOtp: string
): { ok: boolean; message: string } {
  if (!isValidPhPhone(rawPhone)) {
    return {
      ok: false,
      message: 'Enter a valid 10-digit +63 mobile number starting with 9.',
    };
  }
  const clean = normalizePhPhone(rawPhone);
  const entry = store.pendingVerifications?.[clean];
  if (!entry) {
    return {
      ok: false,
      message: 'No verification code found for this number. Tap "Request Code" and contact the GST System Owner.',
    };
  }
  if (entry.status !== 'issued' || !entry.code) {
    return {
      ok: false,
      message: 'Your request is queued. Waiting for the GST System Owner to issue a 6-digit code to your number.',
    };
  }
  if (inputOtp.trim() !== entry.code) {
    return {
      ok: false,
      message: 'Incorrect verification code. Please enter the exact 6-digit code given by the GST System Owner.',
    };
  }
  return {
    ok: true,
    message: `Phone +63 ${clean} verified!`,
  };
}

export function ownerRevokeVerificationCode(
  store: AccountsStore,
  rawPhone: string
): OwnerActionResult {
  const normalized = ensureStoreDefaults(store);
  const clean = normalizePhPhone(rawPhone);
  const currentMap = normalized.pendingVerifications ?? {};
  if (!currentMap[clean]) {
    return { ok: false, message: 'Verification entry not found.', store: normalized };
  }
  const nextMap = { ...currentMap };
  delete nextMap[clean];
  return {
    ok: true,
    message: `Revoked verification code/request for +63 ${clean}.`,
    store: {
      ...normalized,
      pendingVerifications: nextMap,
    },
  };
}

export function getSystemMetrics(store: AccountsStore): {
  totalAccounts: number;
  depositedAccounts: number;
  totalPersonalPhp: number;
  totalIncomePhp: number;
  totalReferrals: number;
  totalTransactions: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  activeChannels: number;
  pendingOtps: number;
} {
  const accounts = Object.values(store.accounts ?? {});
  const base = accounts.reduce(
    (acc, acct) => ({
      totalAccounts: acc.totalAccounts + 1,
      depositedAccounts: acc.depositedAccounts + (acct.hasDeposited ? 1 : 0),
      totalPersonalPhp:
        Math.round((acc.totalPersonalPhp + acct.wallets.personalPhp) * 100) / 100,
      totalIncomePhp:
        Math.round((acc.totalIncomePhp + acct.wallets.incomePhp) * 100) / 100,
      totalReferrals: acc.totalReferrals + acct.teamMembers.length,
      totalTransactions:
        acc.totalTransactions + acct.financialRecords.length + acct.transactionRecords.length,
      pendingDeposits:
        acc.pendingDeposits +
        acct.financialRecords.filter(
          (r) => r.type === 'deposit' && r.status === 'Deposit to be confirmed'
        ).length,
      pendingWithdrawals:
        acc.pendingWithdrawals +
        acct.financialRecords.filter(
          (r) => r.type === 'withdraw' && r.status === 'Withdrawal to be confirmed'
        ).length,
    }),
    {
      totalAccounts: 0,
      depositedAccounts: 0,
      totalPersonalPhp: 0,
      totalIncomePhp: 0,
      totalReferrals: 0,
      totalTransactions: 0,
      pendingDeposits: 0,
      pendingWithdrawals: 0,
    }
  );
  const activeChannels = (store.systemConfig?.depositChannels ?? []).filter((c) => c.enabled).length;
  const pendingOtps = Object.values(store.pendingVerifications ?? {}).filter(
    (v) => v.status === 'requested'
  ).length;
  return { ...base, activeChannels, pendingOtps };
}
