'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Button from '@/components/admin/ui/Button';
import Card from '@/components/admin/ui/Card';
import { Field, Input } from '@/components/admin/ui/form';

function SettingsForm() {
  const params = useSearchParams();
  const forced = params.get('forced') === '1';
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
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
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (forced) {
        setTimeout(() => router.push('/admin/dashboard'), 800);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Account Settings</h1>

      {forced && (
        <div className="mt-4 max-w-sm rounded-xl bg-champagne-gold/15 p-4 text-sm text-onyx">
          For security, you must set a new password before continuing.
        </div>
      )}

      <Card className="mt-6 max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Current password" required>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </Field>
          <Field label="New password" required hint="At least 10 characters, with upper, lower case and a number.">
            <Input
              type="password"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" required>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button variant="primary" type="submit" loading={saving} className="mt-1 self-start">
            Update password
          </Button>
        </form>
      </Card>
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
