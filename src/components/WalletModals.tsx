import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Lock,
  ShieldAlert,
  Smartphone,
  X,
} from 'lucide-react';
import { calculateWithdrawalFee, formatPhp, generateTxId } from '../lib/ghaEngine';
import { DepositChannel, GhaAppState } from '../types/gha';

interface DepositViewProps {
  state: GhaAppState;
  channels: DepositChannel[];
  depositsEnabled?: boolean;
  depositApprovalMode?: 'manual' | 'auto';
  minDepositPhp?: number;
  maxDepositPhp?: number;
  onDeposit: (
    amountPhp: number,
    channel: DepositChannel,
    senderReference: string
  ) => { ok: boolean; message: string };
  onOpenRecords: () => void;
}

const DEPOSIT_PRESETS = [100, 1800, 5500, 16000, 45000, 50000, 100000, 250000];
const PAYMENT_TIMEOUT_SECONDS = 20 * 60;

function formatCountdown(secondsLeft: number): string {
  const safe = Math.max(0, Math.floor(secondsLeft));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function DepositView({
  state,
  channels,
  depositsEnabled = true,
  depositApprovalMode = 'manual',
  minDepositPhp = 10,
  maxDepositPhp = 250000,
  onDeposit,
  onOpenRecords,
}: DepositViewProps) {
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState<'select' | 'order' | 'gateway'>('select');
  const [amountAlert, setAmountAlert] = useState<string | null>(null);
  const [pickerChannel, setPickerChannel] = useState<DepositChannel | null>(null);
  const [pickerProvider, setPickerProvider] = useState<'paymaya' | 'paygcash'>('paygcash');

  const [activeOrder, setActiveOrder] = useState<{
    orderRef: string;
    channel: DepositChannel;
    provider: 'GCash' | 'Maya';
    amountPhp: number;
    paymentLink: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(PAYMENT_TIMEOUT_SECONDS);
  const [senderReference, setSenderReference] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [linkToast, setLinkToast] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const activeChannels = channels.filter((c) => c.enabled);
  const parsedAmount = Number(amount);

  useEffect(() => {
    if (stage !== 'gateway' || !activeOrder) return;
    setSecondsLeft(PAYMENT_TIMEOUT_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [stage, activeOrder?.orderRef]);

  useEffect(() => {
    if (stage !== 'gateway' || !activeOrder) {
      setQrDataUrl('');
      return;
    }
    const qrPayload =
      activeOrder.channel.paymentUrl ||
      `GST-${activeOrder.provider.toUpperCase()}|ACCT:${activeOrder.channel.accountNumber}|NAME:${activeOrder.channel.accountName}|PHP:${activeOrder.amountPhp.toFixed(2)}|REF:${activeOrder.orderRef}`;
    let cancelled = false;
    QRCode.toDataURL(qrPayload, {
      width: 224,
      margin: 2,
      color: { dark: '#0B2545', light: '#FFFFFF' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [stage, activeOrder]);

  const handleCopyText = (key: string, value: string, toastMessage?: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
    if (toastMessage) {
      setLinkToast(toastMessage);
      setTimeout(() => setLinkToast(null), 2200);
    }
  };

  const handleChannelClick = (channel: DepositChannel) => {
    setFeedback(null);
    if (!depositsEnabled) {
      setFeedback({ ok: false, text: 'Deposits are currently paused by the GST Owner.' });
      return;
    }
    const chMin = Math.max(minDepositPhp, channel.minPhp || minDepositPhp);
    const chMax = Math.min(maxDepositPhp, channel.maxPhp || maxDepositPhp);
    if (!amount.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountAlert('Enter Amount');
      return;
    }
    if (parsedAmount < chMin || parsedAmount > chMax) {
      setAmountAlert(
        `Enter an amount between ${formatPhp(chMin)} and ${formatPhp(chMax)} for ${channel.channelName}.`
      );
      return;
    }
    setPickerChannel(channel);
    setPickerProvider(channel.provider === 'Maya' ? 'paymaya' : 'paygcash');
  };

  const handleConfirmProviderPicker = () => {
    if (!pickerChannel) return;
    const chosenProvider: 'GCash' | 'Maya' = pickerProvider === 'paymaya' ? 'Maya' : 'GCash';
    const matchingChannel =
      pickerChannel.provider === chosenProvider
        ? pickerChannel
        : activeChannels.find((c) => c.provider === chosenProvider) ?? pickerChannel;

    const orderRef = generateTxId('DEP').toUpperCase();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const generatedLink =
      matchingChannel.paymentUrl ||
      `${origin}/?pay=${chosenProvider.toLowerCase()}&ch=${encodeURIComponent(
        matchingChannel.id
      )}&acct=${encodeURIComponent(matchingChannel.accountNumber)}&amt=${parsedAmount.toFixed(
        2
      )}&ref=${orderRef}`;

    setActiveOrder({
      orderRef,
      channel: matchingChannel,
      provider: chosenProvider,
      amountPhp: parsedAmount,
      paymentLink: generatedLink,
    });
    setPickerChannel(null);
    setSenderReference('');
    setStage('order');
  };

  const handleOpenInWalletApp = (e: React.MouseEvent) => {
    if (!activeOrder) return;
    const isCustomHttps = Boolean(
      activeOrder.channel.paymentUrl && /^https?:\/\//i.test(activeOrder.channel.paymentUrl)
    );
    if (!isCustomHttps) {
      e.preventDefault();
    }
    handleCopyText(
      'open-app',
      `${activeOrder.channel.accountNumber}`,
      `${activeOrder.provider} account ${activeOrder.channel.accountNumber} & ${formatPhp(
        activeOrder.amountPhp
      )} link copied — complete payment in ${activeOrder.provider} App.`
    );
  };

  const handleSubmitGatewayDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    const finalRef = senderReference.trim() || activeOrder.orderRef;
    const res = onDeposit(activeOrder.amountPhp, activeOrder.channel, finalRef);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setStage('select');
      setActiveOrder(null);
      setSenderReference('');
      setAmount('');
    }
  };

  // STAGE 3: BRANDED GCASH / MAYA QR & DEEP-LINK CHECKOUT SCREEN
  if (stage === 'gateway' && activeOrder) {
    const isGcash = activeOrder.provider === 'GCash';
    const brandColor = isGcash ? 'bg-[#007DFE]' : 'bg-[#00B250]';
    const brandHover = isGcash ? 'hover:bg-[#0066D6]' : 'hover:bg-[#009643]';
    const deepLinkHref =
      activeOrder.channel.paymentUrl ||
      (isGcash
        ? `gcash://gcash.com/app/send?account=${encodeURIComponent(
            activeOrder.channel.accountNumber
          )}&amount=${activeOrder.amountPhp.toFixed(2)}`
        : `paymaya://pay?account=${encodeURIComponent(
            activeOrder.channel.accountNumber
          )}&amount=${activeOrder.amountPhp.toFixed(2)}`);

    return (
      <div className="max-w-md mx-auto space-y-4">
        {/* Branded GCash / Maya Header */}
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-9 h-9 rounded-full ${brandColor} text-white font-display font-extrabold text-lg flex items-center justify-center`}
            >
              {isGcash ? 'G' : 'M'}
            </span>
            <div>
              <p className={`text-xl font-display font-extrabold leading-none ${isGcash ? 'text-[#007DFE]' : 'text-[#00B250]'}`}>
                {activeOrder.provider}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeOrder.channel.channelName} · {formatPhp(activeOrder.amountPhp)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStage('order')}
            className="text-xs font-semibold text-slate-600 hover:text-[#0B2545] px-2 py-1"
          >
            Back
          </button>
        </div>

        {linkToast && (
          <div
            role="status"
            className="rounded-xl bg-[#0B2545] text-white px-4 py-2.5 text-xs font-semibold text-center shadow-sm"
          >
            {linkToast}
          </div>
        )}

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

        {/* Main Checkout Card matching Video 00:21 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5 text-center">
          <p className="text-sm font-medium text-slate-700">
            Securely complete the payment with your {activeOrder.provider} App
          </p>

          <a
            href={deepLinkHref}
            onClick={handleOpenInWalletApp}
            className={`w-full h-12 rounded-xl ${brandColor} ${brandHover} text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-colors`}
          >
            <span>Open in {activeOrder.provider}</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <p className="text-xs text-slate-500">
            or Login to {activeOrder.provider} and scan this QR with the QR Scanner
          </p>

          {/* Real Scannable QR Code */}
          <div className="flex flex-col items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${activeOrder.provider} Deposit QR Code`}
                className="w-52 h-52 rounded-xl border border-slate-200 p-2 bg-white shadow-xs"
              />
            ) : (
              <div className="w-52 h-52 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          {/* Owner Receiving Account Info + Reference Submission */}
          <form onSubmit={handleSubmitGatewayDeposit} className="text-left space-y-3 pt-2 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] text-slate-500">
                    {activeOrder.provider} Receiving Account
                  </p>
                  <p className="text-xs font-bold text-[#0B2545]">
                    {activeOrder.channel.accountName}
                  </p>
                  <p className="text-sm font-mono font-bold text-[#0B2545] tabular-nums">
                    {activeOrder.channel.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'gateway-acct',
                      activeOrder.channel.accountNumber,
                      `Copied ${activeOrder.provider} number ${activeOrder.channel.accountNumber}`
                    )
                  }
                  className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#1570EF] inline-flex items-center gap-1.5 shrink-0"
                >
                  {copiedKey === 'gateway-acct' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'gateway-acct' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              {activeOrder.channel.instructions && (
                <p className="text-[11px] text-slate-600 border-t border-slate-200 pt-1.5">
                  {activeOrder.channel.instructions}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="deposit-ref" className="block text-xs font-medium text-slate-600 mb-1">
                {activeOrder.provider} Reference No. / Sender Name
              </label>
              <input
                id="deposit-ref"
                type="text"
                value={senderReference}
                onChange={(e) => setSenderReference(e.target.value)}
                placeholder={`Enter ${activeOrder.provider} Ref No. (or auto: ${activeOrder.orderRef})`}
                className="w-full h-11 px-3.5 rounded-xl bg-slate-100 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1570EF]"
              />
            </div>

            <button
              type="submit"
              disabled={secondsLeft === 0}
              className="w-full h-11 rounded-full bg-[#C8922A] hover:bg-[#B5811F] disabled:opacity-50 text-white font-semibold text-sm"
            >
              {depositApprovalMode === 'manual'
                ? 'I Have Paid · Submit for Approval'
                : 'I Have Paid · Confirm Deposit'}
            </button>
          </form>
        </div>

        {/* Bottom-Right Payment Timeout Countdown Pill matching Video 00:21 */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setStage('select');
              setActiveOrder(null);
            }}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel Order
          </button>

          <div
            aria-label="Payment Timeout Countdown"
            className={`px-4 h-10 rounded-xl ${brandColor} text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm tabular-nums`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {secondsLeft > 0
                ? `Payment Timeout: ${formatCountdown(secondsLeft)}`
                : 'Payment Timeout: Expired'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 2: DEPOSIT LINK ORDER SCREEN (Video 00:10 - Deposit / Please Copy the Link / Cancel)
  if (stage === 'order' && activeOrder) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Deposit Amount (PHP)</p>
              <p className="text-3xl font-display font-bold text-[#1570EF] tabular-nums mt-1">
                {formatPhp(activeOrder.amountPhp)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Deposit Channel</p>
              <p className="text-2xl font-display font-bold text-[#1570EF] mt-1">
                {activeOrder.channel.channelName}
              </p>
              <p className="text-xs text-slate-600 mt-1 tabular-nums">
                {activeOrder.provider} · {activeOrder.channel.accountName} ({activeOrder.channel.accountNumber})
              </p>
            </div>
          </div>

          {linkToast && (
            <div
              role="status"
              className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold text-center"
            >
              {linkToast}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setLinkToast(null);
                setStage('gateway');
              }}
              className="w-full h-12 rounded-full bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm shadow-xs transition-colors"
            >
              Deposit
            </button>

            <button
              type="button"
              onClick={() =>
                handleCopyText(
                  'payment-link',
                  activeOrder.paymentLink,
                  'Success · Payment link copied!'
                )
              }
              className="w-full h-12 rounded-full bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm shadow-xs transition-colors"
            >
              {copiedKey === 'payment-link' ? 'Copied Link!' : 'Please Copy the Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStage('select');
                setActiveOrder(null);
                setLinkToast(null);
              }}
              className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 1: DEPOSIT AMOUNT & OWNER-CONFIGURED GCASH / MAYA CHANNELS
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Account Balance (PHP)</p>
          <p className="text-3xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
            {formatPhp(state.wallets.personalPhp)}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenRecords}
          className="text-xs font-semibold text-[#1570EF] hover:underline min-h-[44px] px-2"
        >
          Deposit Records &gt;
        </button>
      </div>

      {!depositsEnabled && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900"
        >
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Deposits Temporarily Paused</p>
            <p className="text-xs mt-0.5">
              Deposit transactions are currently disabled by the GST System Owner. Please check back later or contact Customer Service.
            </p>
          </div>
        </div>
      )}

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

      {/* Deposit Amount & Presets */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div>
          <label htmlFor="deposit-amount" className="block text-sm font-semibold text-[#0B2545] mb-2">
            Deposit Amount (PHP)
          </label>
          <input
            id="deposit-amount"
            type="number"
            min={minDepositPhp}
            max={maxDepositPhp}
            disabled={!depositsEnabled}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter Amount ${minDepositPhp}-${maxDepositPhp}`}
            className="w-full h-12 px-4 rounded-xl bg-slate-100 border border-transparent focus:border-[#1570EF] focus:bg-white text-base font-bold tabular-nums focus:outline-none disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {DEPOSIT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!depositsEnabled}
              onClick={() => setAmount(String(preset))}
              className={`h-11 rounded-xl text-sm font-semibold tabular-nums transition-colors disabled:opacity-50 ${
                Number(amount) === preset
                  ? 'bg-[#1570EF] text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {preset.toLocaleString()}
            </button>
          ))}
        </div>
      </section>

      {/* Owner-Configured GCash & Maya Deposit Channels */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-display font-bold text-[#0B2545]">
            Official GCash &amp; Maya Deposit Channels
          </h2>
          <span className="text-xs text-slate-500">
            {activeChannels.length} active
          </span>
        </div>

        {activeChannels.length === 0 ? (
          <div className="p-6 text-center space-y-2">
            <Smartphone className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-[#0B2545]">
              No GCash or Maya Receiving Accounts Configured Yet
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The GST System Owner manages all GCash and Maya receiving accounts. Once the Owner adds an active channel in the Owner Portal, it will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                disabled={!depositsEnabled}
                onClick={() => handleChannelClick(channel)}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      channel.provider === 'GCash'
                        ? 'bg-blue-50 text-[#1570EF]'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#0B2545] truncate">
                        {channel.channelName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          channel.provider === 'GCash'
                            ? 'bg-blue-100 text-[#1570EF]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {channel.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate tabular-nums mt-0.5">
                      {channel.accountName} · {channel.accountNumber}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="text-xs text-slate-500 space-y-1.5 px-1">
        <p>
          {depositApprovalMode === 'manual'
            ? 'After sending funds via GCash / Maya link or QR code, submit your transfer reference for GST Owner verification.'
            : 'Deposits submitted via active GCash or Maya links credit automatically once confirmed.'}
        </p>
        <p>
          If you do not receive the funds within 3 minutes, please contact your hiring manager via GST Online Service.
        </p>
      </div>

      {/* Enter Amount Modal Dialog (matches Video 00:04) */}
      {amountAlert && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Enter Amount Prompt"
        >
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center space-y-5 shadow-xl border border-slate-200">
            <p className="text-base font-bold text-[#0B2545]">{amountAlert}</p>
            <button
              type="button"
              onClick={() => setAmountAlert(null)}
              className="w-full h-11 rounded-full bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Bottom-Sheet Provider Picker (matches Video 00:07 paymaya / paygcash) */}
      {pickerChannel && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Select Payment Method"
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPickerChannel(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 px-2 py-1"
              >
                Cancel
              </button>
              <span className="text-xs font-semibold text-slate-500">
                {pickerChannel.channelName}
              </span>
              <button
                type="button"
                onClick={handleConfirmProviderPicker}
                className="text-sm font-semibold text-[#1570EF] hover:text-[#125EC9] px-2 py-1"
              >
                Confirm
              </button>
            </div>

            <div className="p-4 space-y-2">
              {(
                [
                  { id: 'paymaya', label: 'paymaya', sub: 'Maya Wallet Link & QR' },
                  { id: 'paygcash', label: 'paygcash', sub: 'GCash App Link & QR' },
                ] as const
              ).map((opt) => {
                const selected = pickerProvider === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPickerProvider(opt.id)}
                    className={`w-full py-3.5 px-4 rounded-xl text-center transition-colors border ${
                      selected
                        ? 'bg-slate-100 border-[#1570EF] text-[#0B2545] font-bold'
                        : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-base">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">{opt.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface WithdrawViewProps {
  state: GhaAppState;
  withdrawalsEnabled?: boolean;
  withdrawApprovalMode?: 'manual' | 'auto';
  minWithdrawPhp?: number;
  incomeFeePct?: number;
  personalFeePct?: number;
  onWithdraw: (
    amountPhp: number,
    walletType: 'personal' | 'income',
    txPassword: string
  ) => { ok: boolean; message: string };
}

const WITHDRAW_PRESETS = [100, 150, 500, 1000, 10000, 30000, 50000, 100000];

export function WithdrawView({
  state,
  withdrawalsEnabled = true,
  withdrawApprovalMode = 'manual',
  minWithdrawPhp = 100,
  incomeFeePct = 10,
  personalFeePct = 0,
  onWithdraw,
}: WithdrawViewProps) {
  const [amount, setAmount] = useState(String(minWithdrawPhp));
  const [walletType, setWalletType] = useState<'personal' | 'income'>('income');
  const [txPassword, setTxPassword] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const numAmount = Number(amount) || 0;
  const activeFeePct = walletType === 'income' ? incomeFeePct : personalFeePct;
  const { feePhp, netPhp } = calculateWithdrawalFee(numAmount, walletType, activeFeePct);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalsEnabled) {
      setFeedback({ ok: false, text: 'Withdrawals are currently paused by the GST Owner.' });
      return;
    }
    const res = onWithdraw(numAmount, walletType, txPassword);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTxPassword('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Wallet Balances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Income Wallet (PHP)</p>
          <p className="text-2xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
            {formatPhp(state.wallets.incomePhp)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Personal Wallet (PHP)</p>
          <p className="text-2xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
            {formatPhp(state.wallets.personalPhp)}
          </p>
        </div>
      </div>

      {!withdrawalsEnabled && (
        <div
          role="alert"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-sm text-amber-900"
        >
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Withdrawals Temporarily Paused</p>
            <p className="text-xs mt-0.5">
              Withdrawal payouts are currently paused by the GST System Owner.
            </p>
          </div>
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="withdraw-amount" className="text-sm font-semibold text-[#0B2545]">
              Amount (PHP)
            </label>
            <span className="text-xs font-semibold text-slate-500 tabular-nums">
              Tax / Handling Fee ({activeFeePct}%): {formatPhp(feePhp)} · Net: {formatPhp(netPhp)}
            </span>
          </div>
          <input
            id="withdraw-amount"
            type="number"
            min={minWithdrawPhp}
            disabled={!withdrawalsEnabled}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-slate-100 border border-transparent focus:border-[#1570EF] focus:bg-white text-base font-bold tabular-nums focus:outline-none disabled:opacity-60"
          />

          <div className="grid grid-cols-4 gap-2 mt-3">
            {WITHDRAW_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={!withdrawalsEnabled}
                onClick={() => setAmount(String(preset))}
                className={`h-10 rounded-xl text-xs font-semibold tabular-nums transition-colors disabled:opacity-50 ${
                  Number(amount) === preset
                    ? 'bg-[#1570EF] text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#0B2545] mb-2">
            Please Select a Withdrawals Wallet
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!withdrawalsEnabled}
              onClick={() => setWalletType('personal')}
              className={`h-14 rounded-xl border font-semibold text-sm transition-colors ${
                walletType === 'personal'
                  ? 'bg-[#1570EF] text-white border-[#1570EF]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Personal Wallet ({personalFeePct}% Fee)
            </button>
            <button
              type="button"
              disabled={!withdrawalsEnabled}
              onClick={() => setWalletType('income')}
              className={`h-14 rounded-xl border font-semibold text-sm transition-colors ${
                walletType === 'income'
                  ? 'bg-[#1570EF] text-white border-[#1570EF]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Income Wallet ({incomeFeePct}% Fee)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="withdraw-pin" className="block text-sm font-semibold text-[#0B2545] mb-1.5">
            Transaction Password
          </label>
          <input
            id="withdraw-pin"
            type="password"
            disabled={!withdrawalsEnabled}
            value={txPassword}
            onChange={(e) => setTxPassword(e.target.value)}
            placeholder="Transaction Password (default PIN: 123456)"
            className="w-full h-12 px-4 rounded-xl bg-slate-100 border border-transparent focus:border-[#1570EF] focus:bg-white text-sm focus:outline-none disabled:opacity-60"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Receiving Account: {state.user.bankAccount.walletType} · {state.user.bankAccount.accountNumber}
          </p>
        </div>

        <button
          type="submit"
          disabled={!withdrawalsEnabled}
          className="w-full h-12 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          Submit Withdrawal
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs text-slate-600 space-y-2">
        <p className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C8922A] shrink-0 mt-0.5" />
          <span>
            {withdrawApprovalMode === 'manual'
              ? 'After submitting your withdrawal request, the GST Owner reviews and releases payout to your GCash/Maya wallet within 0 to 72 hours.'
              : 'Your withdrawal is processed immediately to your registered GCash/Maya or bank receiving account.'}
          </span>
        </p>
        <p>
          Current handling fees set by GST Owner: {incomeFeePct}% on Income Wallet and {personalFeePct}% on Personal Wallet (Minimum withdrawal: {formatPhp(minWithdrawPhp)}).
        </p>
      </div>
    </div>
  );
}
