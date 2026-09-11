'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SettingsForm() {
  const params = useSearchParams();
  const forced = params.get('forced') === '1';
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to change password');
      return;
    }
    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (forced) {
      setTimeout(() => router.push('/admin/dashboard'), 1000);
    }
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Account Settings</h1>

      {forced && (
        <div className="mt-4 rounded-lg bg-champagne-gold/20 p-4 text-sm text-onyx">
          For security, you must set a new password before continuing.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-sm flex-col gap-3 rounded-2xl border border-onyx/10 bg-white p-6">
        <div>
          <label className="text-xs text-charcoal/60">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="mt-1 w-full rounded border border-onyx/10 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-charcoal/60">New password</label>
          <input
            type="password"
            required
            minLength={10}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded border border-onyx/10 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-charcoal/50">At least 10 characters, with upper, lower case and a number.</p>
        </div>
        <div>
          <label className="text-xs text-charcoal/60">Confirm new password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded border border-onyx/10 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {success && <p className="text-sm text-green-700">Password updated.</p>}
        <button type="submit" className="mt-2 rounded-full bg-royal-blue px-4 py-2 text-sm font-semibold text-ivory">
          Update password
        </button>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsForm />
    </Suspense>
  );
}
