import test from 'node:test';
import assert from 'node:assert/strict';
import { createFreshAccountState } from '../data/ghaSeed';
import { processDeposit, processWithdrawal } from './ghaEngine';
import { AccountsStore } from '../types/gha';
import {
  DEFAULT_OWNER_ID,
  DEFAULT_OWNER_PASSWORD,
  ensureStoreDefaults,
  getSystemMetrics,
  loginOwnerAccount,
  ownerAdjustMemberWallet,
  ownerApproveDepositRecord,
  ownerApproveWithdrawalRecord,
  ownerDeleteDepositChannel,
  ownerDeleteTransactionRecord,
  ownerGrantPracticeDraws,
  ownerIssueVerificationCode,
  ownerRejectDepositRecord,
  ownerRejectWithdrawalRecord,
  ownerReplyToMemberChat,
  ownerRevokeVerificationCode,
  ownerSetMemberBankAccount,
  ownerSetMemberRank,
  ownerToggleDepositChannel,
  ownerToggleFeatureFlag,
  ownerToggleInviteUnlock,
  ownerUpdateTransactionRules,
  ownerUpsertDepositChannel,
  requestMemberVerificationCode,
  setupOwnerAccount,
  updateOwnerProfile,
  verifyMemberOtpCode,
} from './ownerEngine';

test('owner account defaults to password JCYBP.123, migrates legacy stores, and enforces auth', () => {
  const fresh: AccountsStore = ensureStoreDefaults({ activePhone: null, accounts: {} });
  assert.equal(fresh.owner?.configured, true);
  assert.equal(fresh.owner?.ownerId, DEFAULT_OWNER_ID);
  assert.equal(fresh.owner?.password, 'JCYBP.123');
  assert.equal(DEFAULT_OWNER_PASSWORD, 'JCYBP.123');
  assert.equal(fresh.ownerAuthenticated, false);

  // Legacy un-migrated store also gets JCYBP.123 applied
  const migrated = ensureStoreDefaults({
    activePhone: null,
    accounts: {},
    owner: {
      configured: true,
      ownerId: 'custom_owner',
      name: 'Owner',
      password: 'oldPassword',
      createdAt: '2026-01-01',
    },
  });
  assert.equal(migrated.owner?.password, 'JCYBP.123');
  assert.equal(migrated.owner?.ownerId, 'custom_owner');

  const badLogin = loginOwnerAccount(fresh, DEFAULT_OWNER_ID, 'wrongpass');
  assert.equal(badLogin.ok, false);

  const okLogin = loginOwnerAccount(fresh, DEFAULT_OWNER_ID, 'JCYBP.123');
  assert.equal(okLogin.ok, true);
  assert.equal(okLogin.store.ownerAuthenticated, true);

  // Explicit setupOwnerAccount still rejects already-configured store
  const dupSetup = setupOwnerAccount(fresh, 'other', 'Other', '123456', '123456');
  assert.equal(dupSetup.ok, false);

  // Intentional profile update keeps defaultPwdApplied true
  const updated = updateOwnerProfile(okLogin.store, 'gst_owner', 'GST System Owner');
  assert.equal(updated.ok, true);
  assert.equal(ensureStoreDefaults(updated.store).owner?.password, 'JCYBP.123');
});

test('owner manages member wallets, ranks, practice draws, invite locks, and metrics', () => {
  const member = createFreshAccountState('9171112222', 'member123');
  let store: AccountsStore = ensureStoreDefaults({
    activePhone: null,
    accounts: { '9171112222': member },
  });

  // Positive personal credit unlocks invite and adds financial record
  const credit = ownerAdjustMemberWallet(store, '9171112222', 'personal', 500, 'System practice fund');
  assert.equal(credit.ok, true);
  store = credit.store;
  assert.equal(store.accounts['9171112222'].wallets.personalPhp, 500);
  assert.equal(store.accounts['9171112222'].hasDeposited, true);

  // Rank update scales task payout
  const ranked = ownerSetMemberRank(store, '9171112222', 'B1');
  assert.equal(ranked.ok, true);
  store = ranked.store;
  assert.equal(store.accounts['9171112222'].user.level, 'B1');
  assert.equal(store.accounts['9171112222'].tasks[0].rewardPhp, 60);

  // Grant practice draws & reset tasks
  const practice = ownerGrantPracticeDraws(store, '9171112222', 2, 3, true);
  assert.equal(practice.ok, true);
  store = practice.store;
  assert.equal(store.accounts['9171112222'].inventory.surpriseCards, 2);
  assert.equal(store.accounts['9171112222'].inventory.goldenEggs, 3);

  // Toggle invite lock
  const lock = ownerToggleInviteUnlock(store, '9171112222', false);
  assert.equal(lock.ok, true);
  store = lock.store;
  assert.equal(store.accounts['9171112222'].hasDeposited, false);

  // Update payout bank account
  const bankUpdate = ownerSetMemberBankAccount(store, '9171112222', {
    ...store.accounts['9171112222'].user.bankAccount,
    walletType: 'Maya Wallet Account',
    accountNumber: '09182223333',
  });
  assert.equal(bankUpdate.ok, true);
  store = bankUpdate.store;
  assert.equal(store.accounts['9171112222'].user.bankAccount.walletType, 'Maya Wallet Account');

  // Reply to member chat
  const chat = ownerReplyToMemberChat(store, '9171112222', 'Approved by owner');
  assert.equal(chat.ok, true);
  store = chat.store;
  assert.ok(store.accounts['9171112222'].chatHistory.at(-1)?.text.includes('[Owner Desk] Approved by owner'));

  const metrics = getSystemMetrics(store);
  assert.equal(metrics.totalAccounts, 1);
  assert.equal(metrics.totalPersonalPhp, 500);
});

test('owner configures GCash and Maya deposit channels cleanly', () => {
  let store = ensureStoreDefaults({ activePhone: null, accounts: {} });
  assert.equal(store.systemConfig?.depositChannels.length, 0);

  const gcash = ownerUpsertDepositChannel(store, {
    channelName: 'GST GCash Desk 1',
    provider: 'GCash',
    accountName: 'GST Treasury',
    accountNumber: '09171234567',
    minPhp: 100,
    maxPhp: 50000,
    instructions: 'Include mobile number in note',
  });
  assert.equal(gcash.ok, true);
  store = gcash.store;

  const maya = ownerUpsertDepositChannel(store, {
    channelName: 'GST Maya Desk 1',
    provider: 'Maya',
    accountName: 'GST Maya Holdings',
    accountNumber: '09189876543',
  });
  assert.equal(maya.ok, true);
  store = maya.store;
  assert.equal(store.systemConfig?.depositChannels.length, 2);

  const mayaId = store.systemConfig!.depositChannels[1].id;
  const paused = ownerToggleDepositChannel(store, mayaId, false);
  assert.equal(paused.ok, true);
  assert.equal(paused.store.systemConfig?.depositChannels[1].enabled, false);

  const removed = ownerDeleteDepositChannel(paused.store, mayaId);
  assert.equal(removed.ok, true);
  assert.equal(removed.store.systemConfig?.depositChannels.length, 1);
});

test('owner manages pending deposits, pending withdrawals, refunds, and feature rules', () => {
  const member = createFreshAccountState('9179998888', 'member123');
  let store: AccountsStore = ensureStoreDefaults({
    activePhone: null,
    accounts: { '9179998888': member },
  });

  // Member submits two manual deposits: one approved, one closed
  const d1 = processDeposit(store.accounts['9179998888'], 500, 'GST GCash', 'GCash', {
    approvalMode: 'manual',
    channelAccountName: 'GST Main',
    channelAccountNumber: '09171234567',
    senderReference: 'GC1001',
  });
  assert.equal(d1.ok, true);
  assert.equal(d1.state.wallets.personalPhp, 0);
  assert.equal(d1.state.hasDeposited, false);
  assert.equal(d1.state.financialRecords[0].status, 'Deposit to be confirmed');

  const d2 = processDeposit(d1.state, 200, 'GST Maya', 'Maya', {
    approvalMode: 'manual',
    channelAccountName: 'GST Maya',
    channelAccountNumber: '09189876543',
    senderReference: 'MY2002',
  });
  store = { ...store, accounts: { '9179998888': d2.state } };

  assert.equal(getSystemMetrics(store).pendingDeposits, 2);

  const rec1Id = store.accounts['9179998888'].financialRecords[1].id;
  const rec2Id = store.accounts['9179998888'].financialRecords[0].id;

  // Approve first deposit -> credits 500 & unlocks invite
  const approved = ownerApproveDepositRecord(store, '9179998888', rec1Id, 'Verified GC1001');
  assert.equal(approved.ok, true);
  store = approved.store;
  assert.equal(store.accounts['9179998888'].wallets.personalPhp, 500);
  assert.equal(store.accounts['9179998888'].hasDeposited, true);

  // Close second deposit -> balance stays 500
  const closed = ownerRejectDepositRecord(store, '9179998888', rec2Id, 'No transfer received');
  assert.equal(closed.ok, true);
  store = closed.store;
  assert.equal(store.accounts['9179998888'].wallets.personalPhp, 500);
  assert.equal(store.accounts['9179998888'].financialRecords[0].status, 'Deposit order closed');

  // Member submits two manual personal withdrawals (150 each -> 200 remaining)
  const w1 = processWithdrawal(store.accounts['9179998888'], 150, 'personal', '123456', {
    approvalMode: 'manual',
    feePct: 0,
  });
  assert.equal(w1.ok, true);
  const w2 = processWithdrawal(w1.state, 150, 'personal', '123456', {
    approvalMode: 'manual',
    feePct: 0,
  });
  assert.equal(w2.ok, true);
  assert.equal(w2.state.wallets.personalPhp, 200);
  store = { ...store, accounts: { '9179998888': w2.state } };
  assert.equal(getSystemMetrics(store).pendingWithdrawals, 2);

  const wdrApproveId = store.accounts['9179998888'].financialRecords[1].id;
  const wdrRejectId = store.accounts['9179998888'].financialRecords[0].id;

  const wApproved = ownerApproveWithdrawalRecord(store, '9179998888', wdrApproveId, 'Sent via GCash');
  assert.equal(wApproved.ok, true);
  store = wApproved.store;

  const wRejected = ownerRejectWithdrawalRecord(store, '9179998888', wdrRejectId, 'Invalid e-wallet');
  assert.equal(wRejected.ok, true);
  store = wRejected.store;
  // Rejected withdrawal refunds 150 back to Personal Wallet (200 -> 350)
  assert.equal(store.accounts['9179998888'].wallets.personalPhp, 350);

  // Feature toggle & rules update
  const pausedWdr = ownerToggleFeatureFlag(store, 'withdrawalsEnabled', false);
  assert.equal(pausedWdr.store.systemConfig?.features.withdrawalsEnabled, false);
  const rules = ownerUpdateTransactionRules(pausedWdr.store, {
    incomeWithdrawFeePct: 5,
    minWithdrawPhp: 200,
  });
  assert.equal(rules.store.systemConfig?.incomeWithdrawFeePct, 5);
  assert.equal(rules.store.systemConfig?.minWithdrawPhp, 200);

  // Remove a wallet transaction record
  const firstTxId = rules.store.accounts['9179998888'].transactionRecords[0].id;
  const removedTx = ownerDeleteTransactionRecord(rules.store, '9179998888', firstTxId);
  assert.equal(removedTx.ok, true);
  assert.equal(
    removedTx.store.accounts['9179998888'].transactionRecords.some((t) => t.id === firstTxId),
    false
  );
});

test('owner exclusively issues and manages 6-digit phone verification codes', () => {
  let store = ensureStoreDefaults({ activePhone: null, accounts: {} });

  // 1. Member requests verification code -> queued with empty code (no self-generation/leak)
  const req = requestMemberVerificationCode(store, '9178889999');
  assert.equal(req.ok, true);
  assert.equal(/\d{6}/.test(req.message.replace('9178889999', '')), false);
  store = req.store;
  const pendingEntry = store.pendingVerifications?.['9178889999'];
  assert.ok(pendingEntry);
  assert.equal(pendingEntry.status, 'requested');
  assert.equal(pendingEntry.code, '');
  assert.equal(getSystemMetrics(store).pendingOtps, 1);

  // Verification fails while waiting for Owner
  const beforeIssue = verifyMemberOtpCode(store, '9178889999', '123456');
  assert.equal(beforeIssue.ok, false);

  // 2. Owner issues custom 6-digit code to requested number
  const issuedCustom = ownerIssueVerificationCode(store, '9178889999', '482910', 'Verified via Viber');
  assert.equal(issuedCustom.ok, true);
  assert.equal(issuedCustom.code, '482910');
  store = issuedCustom.store;
  assert.equal(getSystemMetrics(store).pendingOtps, 0);
  assert.equal(store.pendingVerifications?.['9178889999'].status, 'issued');

  // Wrong code fails, Owner-issued code passes
  assert.equal(verifyMemberOtpCode(store, '9178889999', '000000').ok, false);
  assert.equal(verifyMemberOtpCode(store, '9178889999', '482910').ok, true);

  // Re-requesting does NOT wipe out Owner-issued code or leak it
  const reReq = requestMemberVerificationCode(store, '9178889999');
  assert.equal(reReq.ok, true);
  assert.equal(reReq.message.includes('482910'), false);
  assert.equal(reReq.store.pendingVerifications?.['9178889999'].code, '482910');

  // 3. Owner proactively auto-generates a code directly for a number that hasn't requested yet
  const proactive = ownerIssueVerificationCode(store, '9187776666');
  assert.equal(proactive.ok, true);
  assert.ok(proactive.code && /^\d{6}$/.test(proactive.code));
  store = proactive.store;
  assert.equal(verifyMemberOtpCode(store, '9187776666', proactive.code!).ok, true);

  // 4. Owner revokes verification entry
  const revoked = ownerRevokeVerificationCode(store, '9187776666');
  assert.equal(revoked.ok, true);
  assert.equal(verifyMemberOtpCode(revoked.store, '9187776666', proactive.code!).ok, false);
});
