import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE, WEALTH_FUNDS, createFreshAccountState } from '../data/ghaSeed';
import {
  advanceInvestmentDay,
  calculateFundPurchaseBonus,
  calculateMemberEarningsForUser,
  calculateWithdrawalFee,
  canUserInvite,
  completeHotelTask,
  drawSurpriseCard,
  investInFund,
  isValidPhPhone,
  normalizePhPhone,
  processDeposit,
  processWithdrawal,
  redeemCashGiftCode,
  smashGoldenEgg,
  summarizeReferredMembers,
  upgradeMembershipTier,
} from './ghaEngine';

test('phone normalization and validation enforce +63 mobile format', () => {
  assert.equal(normalizePhPhone('+63 917 555 1234'), '9175551234');
  assert.equal(normalizePhPhone('09175551234'), '9175551234');
  assert.equal(isValidPhPhone('9175551234'), true);
  assert.equal(isValidPhPhone('12345'), false);
});

test('fresh account starts with zero balance, zero draws, and invite locked until deposit', () => {
  const fresh = createFreshAccountState('9175551234', 'secret123');
  assert.equal(fresh.user.phoneVerified, true);
  assert.equal(fresh.wallets.incomePhp, 0);
  assert.equal(fresh.wallets.personalPhp, 0);
  assert.equal(fresh.inventory.surpriseCards, 0);
  assert.equal(fresh.inventory.goldenEggs, 0);
  assert.equal(fresh.financialRecords.length, 0);
  assert.equal(fresh.transactionRecords.length, 0);
  assert.equal(canUserInvite(fresh), false);

  const afterDeposit = processDeposit(fresh, 100, 'GST Channel ①', 'paygcash');
  assert.equal(afterDeposit.ok, true);
  assert.equal(afterDeposit.state.wallets.personalPhp, 100);
  assert.equal(canUserInvite(afterDeposit.state), true);
});

test('withdrawal fee applies 10% on Income Wallet and 0% on Personal Wallet', () => {
  const incomeFee = calculateWithdrawalFee(500, 'income');
  assert.equal(incomeFee.feePhp, 50);
  assert.equal(incomeFee.netPhp, 450);

  const personalFee = calculateWithdrawalFee(500, 'personal');
  assert.equal(personalFee.feePhp, 0);
  assert.equal(personalFee.netPhp, 500);
});

test('deposit credits personal wallet and creates financial record', () => {
  const res = processDeposit(INITIAL_STATE, 1800, 'GST Channel ①', 'paygcash');
  assert.equal(res.ok, true);
  assert.equal(res.state.wallets.personalPhp, INITIAL_STATE.wallets.personalPhp + 1800);
  assert.equal(res.state.financialRecords[0].status, 'Deposit successfully');
});

test('withdrawal validates PIN and deducts balance', () => {
  const badPin = processWithdrawal(INITIAL_STATE, 100, 'income', '000000');
  assert.equal(badPin.ok, false);

  const valid = processWithdrawal(INITIAL_STATE, 100, 'income', '123456');
  assert.equal(valid.ok, true);
  assert.equal(valid.state.wallets.incomePhp, INITIAL_STATE.wallets.incomePhp - 100);
  assert.equal(valid.state.financialRecords[0].feePhp, 10);
});

test('completing a hotel review task awards PHP and updates progress', () => {
  const res = completeHotelTask(INITIAL_STATE, '1', 5, 'Great resort standards');
  assert.equal(res.ok, true);
  assert.equal(res.state.tasks[0].status, 'completed');
  assert.equal(res.state.tasks[0].rating, 5);
  assert.equal(res.state.wallets.incomePhp, INITIAL_STATE.wallets.incomePhp + 10);
  assert.equal(res.state.earnings.todayPhp, 10);
});

test('wealth investment calculates bonus tiers and daily yield', () => {
  const fund = WEALTH_FUNDS[0];
  assert.equal(calculateFundPurchaseBonus(fund, 1000), 50);
  assert.equal(calculateFundPurchaseBonus(fund, 5000), 350);
  assert.equal(calculateFundPurchaseBonus(fund, 10000), 900);

  const res = investInFund(INITIAL_STATE, 'lightspeed-vp', 1000, 'personal');
  assert.equal(res.ok, true);
  assert.equal(res.state.wallets.personalPhp, 1000);
  assert.equal(res.state.wallets.incomePhp, INITIAL_STATE.wallets.incomePhp + 50);

  const day1 = advanceInvestmentDay(res.state, res.state.investments[0].id);
  assert.equal(day1.ok, true);
  assert.equal(day1.state.investments[0].daysElapsed, 1);
  assert.equal(day1.state.investments[0].accruedInterestPhp, 53.6);
});

test('interactive activities: surprise card, golden egg, cash gift, and tier upgrade', () => {
  const card = drawSurpriseCard(INITIAL_STATE, 0);
  assert.equal(card.ok, true);
  assert.equal(card.state.inventory.surpriseCards, 1);

  const egg = smashGoldenEgg(card.state, 1);
  assert.equal(egg.ok, true);
  assert.equal(egg.state.inventory.goldenEggs, 2);

  const gift = redeemCashGiftCode(egg.state, 'GST2026');
  assert.equal(gift.ok, true);
  assert.equal(gift.rewardAmount, 68);

  const dupGift = redeemCashGiftCode(gift.state, 'GST2026');
  assert.equal(dupGift.ok, false);

  const upgrade = upgradeMembershipTier(gift.state, 'A1');
  assert.equal(upgrade.ok, true);
  assert.equal(upgrade.state.user.level, 'A1');
});

test('referred member earnings compute task commission and referral bonus accurately', () => {
  const members = [
    {
      id: 'm1',
      maskedPhone: '+63 917****101',
      name: 'Coordinator #1',
      tier: 'A' as const,
      level: 'A1' as const,
      joinedAt: '20/11/2026',
      taskEarnedPhp: 100,
      referralBonusPhp: 128,
    },
    {
      id: 'm2',
      maskedPhone: '+63 928****202',
      name: 'Coordinator #2',
      tier: 'B' as const,
      level: 'A0' as const,
      joinedAt: '20/11/2026',
      taskEarnedPhp: 200,
    },
  ];

  // At B1 rank: Tier A = 12%, Tier B = 9%
  const b1A = calculateMemberEarningsForUser(members[0], 'B1');
  assert.equal(b1A.taskCommissionPct, 12);
  assert.equal(b1A.taskCommissionPhp, 12);
  assert.equal(b1A.referralBonusPhp, 128);
  assert.equal(b1A.totalGeneratedPhp, 140);

  const b1B = calculateMemberEarningsForUser(members[1], 'B1');
  assert.equal(b1B.taskCommissionPct, 9);
  assert.equal(b1B.taskCommissionPhp, 18);
  assert.equal(b1B.referralBonusPhp, 0);
  assert.equal(b1B.totalGeneratedPhp, 18);

  const summary = summarizeReferredMembers(members, 'B1');
  assert.equal(summary.totalMembers, 2);
  assert.equal(summary.totalTaskVolumePhp, 300);
  assert.equal(summary.totalGeneratedPhp, 158);
});
