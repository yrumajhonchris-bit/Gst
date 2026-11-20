export type Language = 'en' | 'tl';

export type NavTab = 'home' | 'wealth' | 'team' | 'task' | 'mine';

export type SubView =
  | 'none'
  | 'deposit'
  | 'withdraw'
  | 'task-details'
  | 'settings'
  | 'bank-account'
  | 'address'
  | 'financial-records'
  | 'transaction-records'
  | 'agreements'
  | 'mail'
  | 'mail-detail'
  | 'surprise-card'
  | 'golden-egg'
  | 'cash-gift'
  | 'coupon'
  | 'vip-journey'
  | 'about-us'
  | 'news'
  | 'employee-manual'
  | 'sports-watch'
  | 'campaigns';

export type MembershipCode = 'A0' | 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';

export interface MembershipTier {
  code: MembershipCode;
  title: string;
  securityDepositPhp: number;
  dailyTasks: number;
  perTaskPhp: number;
  teamACommissionPct: number;
  teamBCommissionPct: number;
  teamCCommissionPct: number;
  canInviteRewards: boolean;
  badgeColor: string;
}

export interface BankAccountInfo {
  fullName: string;
  phone: string;
  walletType: 'GCASH Wallet Account' | 'Maya Wallet Account' | 'BDO Unibank' | 'UnionBank';
  accountNumber: string;
}

export interface DeliveryAddress {
  id: string;
  recipient: string;
  phone: string;
  provinceCity: string;
  streetAddress: string;
  postalCode: string;
  isDefault: boolean;
}

export interface HotelTask {
  id: string;
  hotelName: string;
  location: string;
  category: string;
  image: string;
  description: string;
  rewardPhp: number;
  status: 'ongoing' | 'completed';
  rating?: number;
  reviewNote?: string;
  completedAt?: string;
}

export interface WealthFund {
  id: string;
  name: string;
  partnerTag: string;
  minAmountPhp: number;
  termDays: number;
  dailyRatePct: number;
  repaymentMethod: string;
  investmentType: string;
  campaignWindow: string;
  bonusTiers: Array<{
    minAmount: number;
    maxAmount: number | null;
    bonusPct: number;
    label: string;
  }>;
}

export interface ActiveInvestment {
  id: string;
  fundId: string;
  fundName: string;
  principalPhp: number;
  dailyRatePct: number;
  termDays: number;
  daysElapsed: number;
  accruedInterestPhp: number;
  purchaseBonusPhp: number;
  startedAt: string;
  status: 'active' | 'matured';
}

export interface FinancialRecord {
  id: string;
  type: 'deposit' | 'withdraw';
  amountPhp: number;
  feePhp: number;
  channel: string;
  timestamp: string;
  status:
    | 'Deposit successfully'
    | 'Deposit to be confirmed'
    | 'Deposit order closed'
    | 'Withdrawal to be confirmed'
    | 'Successful withdrawals'
    | 'Withdrawal rejected';
  walletType?: 'personal' | 'income';
  channelId?: string;
  channelAccountNumber?: string;
  channelAccountName?: string;
  senderReference?: string;
  ownerNote?: string;
}

export interface TransactionRecord {
  id: string;
  direction: 'income' | 'expenditure';
  category: string;
  amountPhp: number;
  timestamp: string;
  note: string;
}

export interface MailMessage {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  read: boolean;
  tag: 'wellness' | 'service' | 'fund' | 'kpi';
  bannerImage?: string;
  bodyParagraphs: string[];
  highlights?: Array<{ label: string; value: string }>;
}

export interface CouponItem {
  id: string;
  title: string;
  code: string;
  bonusPct: number;
  minInvestPhp: number;
  expiresAt: string;
  used: boolean;
}

export interface TeamSubordinate {
  id: string;
  maskedPhone: string;
  name: string;
  tier: 'A' | 'B' | 'C';
  level: MembershipCode;
  joinedAt: string;
  taskEarnedPhp: number;
  referralBonusPhp?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  phoneVerified: boolean;
  level: MembershipCode;
  position: string;
  inviteCode: string;
  effectiveDateStart: string;
  effectiveDateEnd: string;
  avatar: string;
  loginPassword: string;
  transactionPassword: string;
  bankAccount: BankAccountInfo;
}

export interface GhaAppState {
  isAuthenticated: boolean;
  hasDeposited: boolean;
  language: Language;
  user: UserProfile;
  wallets: {
    incomePhp: number;
    personalPhp: number;
    securityDepositPhp: number;
  };
  earnings: {
    yesterdayPhp: number;
    todayPhp: number;
    thisWeekPhp: number;
    thisMonthPhp: number;
    teamTaskIncomePhp: number;
    teamInvitationIncomePhp: number;
    totalIncomePhp: number;
  };
  inventory: {
    surpriseCards: number;
    goldenEggs: number;
    sportsWatchClaimed: boolean;
    sportsWatchColor?: 'Rose Gold' | 'Matte Black';
    claimedGiftCodes: string[];
    dailyCheckInClaimed: boolean;
  };
  tasks: HotelTask[];
  investments: ActiveInvestment[];
  financialRecords: FinancialRecord[];
  transactionRecords: TransactionRecord[];
  addresses: DeliveryAddress[];
  mails: MailMessage[];
  coupons: CouponItem[];
  teamMembers: TeamSubordinate[];
  chatHistory: ChatMessage[];
}

export interface OwnerAccount {
  configured: boolean;
  ownerId: string;
  name: string;
  password: string;
  createdAt: string;
  defaultPwdApplied?: boolean;
}

export interface DepositChannel {
  id: string;
  channelName: string;
  provider: 'GCash' | 'Maya';
  accountName: string;
  accountNumber: string;
  paymentUrl?: string;
  instructions?: string;
  minPhp: number;
  maxPhp: number;
  enabled: boolean;
  createdAt: string;
}

export interface SystemFeatureFlags {
  depositsEnabled: boolean;
  withdrawalsEnabled: boolean;
  tasksEnabled: boolean;
  wealthEnabled: boolean;
  teamInviteEnabled: boolean;
  surpriseCardEnabled: boolean;
  goldenEggEnabled: boolean;
  cashGiftEnabled: boolean;
  sportsWatchEnabled: boolean;
  vipUpgradeEnabled: boolean;
  customerServiceEnabled: boolean;
}

export interface SystemConfig {
  practiceMode: boolean;
  depositApprovalMode: 'manual' | 'auto';
  withdrawApprovalMode: 'manual' | 'auto';
  minDepositPhp: number;
  maxDepositPhp: number;
  minWithdrawPhp: number;
  incomeWithdrawFeePct: number;
  personalWithdrawFeePct: number;
  features: SystemFeatureFlags;
  depositChannels: DepositChannel[];
  announcements: string[];
  giftCodes: Record<string, number>;
}

export interface PhoneVerificationEntry {
  phone: string;
  code: string;
  status: 'requested' | 'issued';
  requestedAt: string;
  issuedAt?: string;
  note?: string;
}

export interface AccountsStore {
  activePhone: string | null;
  accounts: Record<string, GhaAppState>;
  owner?: OwnerAccount;
  ownerAuthenticated?: boolean;
  systemConfig?: SystemConfig;
  pendingVerifications?: Record<string, PhoneVerificationEntry>;
}
