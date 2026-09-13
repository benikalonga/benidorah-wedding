'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/ui/PageHeader';
import Button from '@/components/admin/ui/Button';
import Card from '@/components/admin/ui/Card';
import { Field, Input } from '@/components/admin/ui/form';

function SettingsForm() {
  const params = useSearchParams();
  const forced = params.get('forced') === '1';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
    general?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!currentPassword) errors.current = 'Enter your current password';
    if (newPassword.length < 8) {
      errors.new = 'Password must be at least 8 characters, with upper, lower case and a number.';
    } else if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errors.new = 'Password must include upper case, lower case and a number.';
    }
    if (confirmPassword !== newPassword) errors.confirm = 'New passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    let res: Response;
    try {
      res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch {
      setSaving(false);
      setFieldErrors({ general: 'Network error — please try again.' });
      return;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSaving(false);
      if (res.status === 401) {
        setFieldErrors({ current: data.error || 'Current password is incorrect' });
      } else if (res.status === 400) {
        setFieldErrors({ new: data.error || 'That password is not strong enough.' });
      } else {
        setFieldErrors({ general: data.error || 'Failed to change password' });
      }
      return;
    }

    toast.success('Password updated');
    // Full reload (not a soft client-side navigation) so every part of the
    // shell — session cookie, sidebar email, forced-password banner — fully
    // re-syncs from the server with the freshly issued session. A short
    // delay first so the toast actually has time to render and be seen
    // before the reload wipes the page out from under it; `saving` is left
    // true (button stays disabled) since the page is about to unload anyway.
    setTimeout(() => {
      window.location.href = forced ? '/admin/dashboard' : '/admin/settings';
    }, 900);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Account Settings" />

      {forced && (
        <div className="max-w-sm rounded-xl bg-champagne-gold/15 p-4 text-sm text-onyx">
          For security, you must set a new password before continuing.
        </div>
      )}

      <Card className="max-w-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Current password" required error={fieldErrors.current}>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, current: undefined, general: undefined }));
              }}
            />
          </Field>
          <Field
            label="New password"
            required
            error={fieldErrors.new}
            hint="At least 8 characters, with upper, lower case and a number."
          >
            <Input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, new: undefined, general: undefined }));
              }}
            />
          </Field>
          <Field label="Confirm new password" required error={fieldErrors.confirm}>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, confirm: undefined, general: undefined }));
              }}
            />
          </Field>
          {fieldErrors.general && <p className="text-sm text-red-600">{fieldErrors.general}</p>}
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
