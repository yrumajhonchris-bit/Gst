import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Gift,
  Globe,
  Lock,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { ASSETS } from '../data/ghaSeed';
import { Language } from '../types/gha';
import { GhaLogo, SafeImage } from './GhaLogo';

interface AuthViewProps {
  language: Language;
  onToggleLanguage: () => void;
  onLogin: (phone: string, password: string, remember: boolean) => { ok: boolean; message: string };
  onRequestVerificationCode: (phone: string) => { ok: boolean; message: string };
  onVerifyOtpCode: (phone: string, otp: string) => { ok: boolean; message: string };
  onRegister: (
    phone: string,
    password: string,
    confirmPassword: string,
    inviteCode: string,
    otpVerified: boolean,
    otpCode: string
  ) => { ok: boolean; message: string };
  onOpenOwnerPortal?: () => void;
}

export function AuthView({
  language,
  onToggleLanguage,
  onLogin,
  onRequestVerificationCode,
  onVerifyOtpCode,
  onRegister,
  onOpenOwnerPortal,
}: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setFeedback(null);
    setCodeRequested(false);
    setOtpInput('');
    setOtpVerified(false);
    setPhone('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSendOtp = () => {
    setFeedback(null);
    const res = onRequestVerificationCode(phone);
    setOtpVerified(false);
    if (res.ok) {
      setCodeRequested(true);
    }
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleVerifyOtp = () => {
    setFeedback(null);
    const res = onVerifyOtpCode(phone, otpInput);
    if (!res.ok) {
      setOtpVerified(false);
      setFeedback({ type: 'error', text: res.message });
      return;
    }
    setOtpVerified(true);
    setFeedback({ type: 'success', text: res.message });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (mode === 'login') {
      const res = onLogin(phone, password, remember);
      if (!res.ok) {
        setFeedback({ type: 'error', text: res.message });
      }
    } else {
      const verifyCheck = otpVerified ? { ok: true } : onVerifyOtpCode(phone, otpInput);
      const res = onRegister(
        phone,
        password,
        confirmPassword,
        inviteCode,
        verifyCheck.ok,
        otpInput
      );
      if (!res.ok) {
        setFeedback({ type: 'error', text: res.message });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col">
      {/* Top Language Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <GhaLogo size="sm" onClick={onOpenOwnerPortal} />
        <button
          type="button"
          onClick={onToggleLanguage}
          aria-label="Switch language"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-white hover:shadow-xs transition-colors min-h-[44px]"
        >
          <Globe className="w-4 h-4 text-[#1570EF]" />
          <span>{language === 'en' ? 'English' : 'Filipino'}</span>
        </button>
      </header>

      {/* Main Split Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Desktop Corporate Showcase */}
        <section className="hidden lg:flex lg:col-span-6 flex-col gap-6">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
            <SafeImage
              src={ASSETS.heroTeam}
              alt="GST Hospitality Alliance Philippines Team"
              className="w-full h-72 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B2545]/95 via-[#0B2545]/60 to-transparent flex flex-col justify-end p-6 text-white">
              <p className="text-xs font-medium text-[#E6B84C] tracking-wide">
                GST Hospitality Alliance Corp · Philippines
              </p>
              <h1 className="text-3xl font-display font-bold mt-1 text-balance leading-tight">
                GST, Together for a Prosperous Future
              </h1>
              <p className="text-sm text-slate-200 mt-2 max-w-lg">
                Audit luxury partner hotels, grow with employee wealth funds, and unlock team recruitment and wellness rewards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500">Daily Audits</p>
              <p className="text-xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
                5–25 Tasks
              </p>
              <p className="text-xs text-slate-500 mt-1">Instant PHP credits</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500">Partner Funds</p>
              <p className="text-xl font-display font-bold text-[#0B2545] tabular-nums mt-1">
                Up to 5.81%
              </p>
              <p className="text-xs text-slate-500 mt-1">Daily yield plans</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500">Health Benefit</p>
              <p className="text-xl font-display font-bold text-[#C8922A] tabular-nums mt-1">
                500 Watches
              </p>
              <p className="text-xs text-slate-500 mt-1">B1 &amp; invite rewards</p>
            </div>
          </div>
        </section>

        {/* Auth Card */}
        <section className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <GhaLogo size="lg" onClick={onOpenOwnerPortal} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="text-2xl font-display font-bold text-[#0B2545]">
                {mode === 'login'
                  ? language === 'en'
                    ? 'Employee Sign In'
                    : 'Mag-login sa GST'
                  : language === 'en'
                  ? 'Create GST Account'
                  : 'Gumawa ng GST Account'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {mode === 'login'
                  ? 'Sign in with your verified +63 phone number.'
                  : 'Verify your +63 phone number to open a fresh account (starts at PHP 0.00).'}
              </p>
            </div>

            {feedback && (
              <div
                role="alert"
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium border ${
                  feedback.type === 'error'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone Number */}
              <div>
                <label htmlFor="auth-phone" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Phone Number (+63 Verified)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-100 rounded-2xl px-3.5 h-12 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white transition-colors">
                    <Smartphone className="w-5 h-5 text-[#1570EF] shrink-0 mr-2" />
                    <span className="text-sm font-semibold text-slate-700 mr-2 shrink-0">+63</span>
                    <input
                      id="auth-phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (mode === 'register') {
                          setOtpVerified(false);
                          setCodeRequested(false);
                        }
                      }}
                      placeholder="9175551234"
                      className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none tabular-nums"
                    />
                  </div>
                  {mode === 'register' && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="h-12 px-3.5 rounded-2xl bg-[#1570EF] hover:bg-[#125EC9] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      {codeRequested ? 'Resend Request' : 'Request Code'}
                    </button>
                  )}
                </div>
              </div>

              {/* Phone Verification OTP on Register */}
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-otp" className="block text-xs font-medium text-slate-600 mb-1.5">
                    Owner-Issued Verification Code (6-Digit)
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center bg-slate-100 rounded-2xl px-3.5 h-12 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white transition-colors">
                      <ShieldCheck
                        className={`w-5 h-5 shrink-0 mr-2.5 ${
                          otpVerified ? 'text-emerald-600' : 'text-[#1570EF]'
                        }`}
                      />
                      <input
                        id="auth-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value);
                          setOtpVerified(false);
                        }}
                        placeholder="Enter 6-digit code from Owner"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpVerified}
                      className={`h-12 px-4 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                        otpVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#0B2545] hover:bg-[#133C73] text-white'
                      }`}
                    >
                      {otpVerified ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Tap Request Code, then enter the 6-digit code given by the GST System Owner.
                  </p>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="flex items-center bg-slate-100 rounded-2xl px-3.5 h-12 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white transition-colors">
                  <Lock className="w-5 h-5 text-[#1570EF] shrink-0 mr-2.5" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Register Extra Fields */}
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-confirm"
                      className="block text-xs font-medium text-slate-600 mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="flex items-center bg-slate-100 rounded-2xl px-3.5 h-12 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white transition-colors">
                      <Lock className="w-5 h-5 text-[#1570EF] shrink-0 mr-2.5" />
                      <input
                        id="auth-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-700"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-invite"
                      className="block text-xs font-medium text-slate-600 mb-1.5"
                    >
                      Invitation Code (Optional)
                    </label>
                    <div className="flex items-center bg-slate-100 rounded-2xl px-3.5 h-12 border border-transparent focus-within:border-[#1570EF] focus-within:bg-white transition-colors">
                      <Gift className="w-5 h-5 text-[#1570EF] shrink-0 mr-2.5" />
                      <input
                        id="auth-invite"
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="e.g. GST888PH"
                        className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Remember Me */}
              <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#1570EF] focus:ring-[#1570EF]"
                />
                <span>Remember Username/Password</span>
              </label>

              {/* Primary CTA */}
              <button
                type="submit"
                className="w-full h-12 rounded-full bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-base shadow-sm active:scale-[0.99] transition-all"
              >
                {mode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm font-semibold text-[#C8922A] hover:text-[#B5811F] min-h-[44px] px-3"
              >
                {mode === 'login' ? 'No account? Register' : 'Have an account? Go login now'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-[#1570EF] hover:bg-[#125EC9] text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download App &gt;&gt;</span>
            </button>
          </div>
        </section>
      </main>

      {/* Download App Modal */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Download GST Mobile App"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0B2545]">Download GST App</h3>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                aria-label="Close download modal"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Install the GST Mobile Portal directly on Android or iOS for faster task notifications, instant GCash payouts, and offline manual access.
            </p>
            <div className="space-y-2.5 bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm mb-5">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Android APK (v2.6 · 18.4 MB)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>iOS Web Clip (Add to Home Screen)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDownloadModal(false)}
              className="w-full h-11 rounded-xl bg-[#0B2545] text-white font-semibold text-sm hover:bg-[#133C73]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
