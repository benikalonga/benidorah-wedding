'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@/components/admin/ui/Button';
import Dialog from '@/components/admin/ui/Dialog';
import { Field, Input, PasswordInput } from '@/components/admin/ui/form';

const emptyForgotForm = { email: '', defaultPassword: '', newPassword: '', confirmPassword: '' };

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotForm, setForgotForm] = useState(emptyForgotForm);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSaving, setForgotSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push(data.mustChangePassword ? '/admin/settings?forced=1' : '/admin/dashboard');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function openForgot() {
    setForgotForm({ ...emptyForgotForm, email });
    setForgotError(null);
    setForgotOpen(true);
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError(null);
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError('New passwords do not match');
      return;
    }
    setForgotSaving(true);
    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forgotForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || 'Could not reset password');
        return;
      }
      setForgotOpen(false);
      setEmail(forgotForm.email);
      setPassword('');
      toast.success('Password reset. Sign in with your new password.');
    } finally {
      setForgotSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-onyx px-4">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-sm rounded-2xl p-8">
        <h1 className="section-title text-center text-2xl text-ivory">Admin Login</h1>
        <p className="mt-1 text-center text-xs text-ivory/60">Beni &amp; Dorah wedding platform</p>

        <div className="mt-6 flex flex-col gap-4">
          <Field label="Email" className="[&_span]:text-ivory/60">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/20 bg-white/10 !text-white placeholder:text-ivory/40 focus:border-champagne-gold focus:ring-champagne-gold/20"
            />
          </Field>
          <Field label="Password" className="[&_span]:text-ivory/60">
            <PasswordInput
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/20 bg-white/10 !text-white placeholder:text-ivory/40 focus:border-champagne-gold focus:ring-champagne-gold/20"
              iconClassName="text-ivory/50 hover:text-ivory/80"
            />
          </Field>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button variant="gold" type="submit" loading={loading} className="mt-1 w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <button
            type="button"
            onClick={openForgot}
            className="text-center text-xs text-ivory/60 underline-offset-2 hover:text-ivory hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </form>

      <Dialog
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        title="Reset your password"
        description="Enter your email and the default admin password, then choose a new password."
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="forgot-password-form" loading={forgotSaving}>
              Reset password
            </Button>
          </>
        }
      >
        <form id="forgot-password-form" onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
          <Field label="Email" required>
            <Input
              type="email"
              required
              value={forgotForm.email}
              onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
            />
          </Field>
          <Field label="Default password" required hint="The default password given to every admin account.">
            <PasswordInput
              required
              value={forgotForm.defaultPassword}
              onChange={(e) => setForgotForm({ ...forgotForm, defaultPassword: e.target.value })}
            />
          </Field>
          <Field label="New password" required hint="At least 8 characters, with upper and lower case letters and a number.">
            <PasswordInput
              required
              value={forgotForm.newPassword}
              onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password" required>
            <PasswordInput
              required
              value={forgotForm.confirmPassword}
              onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
            />
          </Field>
          {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
        </form>
      </Dialog>
    </div>
  );
}
