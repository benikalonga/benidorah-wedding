'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/admin/ui/Button';
import { Field, Input } from '@/components/admin/ui/form';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
              className="border-white/20 bg-white/10 text-ivory placeholder:text-ivory/40 focus:border-champagne-gold focus:ring-champagne-gold/20"
            />
          </Field>
          <Field label="Password" className="[&_span]:text-ivory/60">
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/20 bg-white/10 text-ivory placeholder:text-ivory/40 focus:border-champagne-gold focus:ring-champagne-gold/20"
            />
          </Field>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <Button variant="gold" type="submit" loading={loading} className="mt-1 w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
