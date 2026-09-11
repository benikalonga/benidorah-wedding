'use client';

import { useEffect, useState } from 'react';

interface GuestRow {
  id: string;
  fullName: string;
  partnerName: string | null;
  userHashCode: string;
  linkOpenedAt: string | null;
  rsvp: {
    attending: string;
    allergyComment: string | null;
    wishText: string | null;
    submittedAt: string | null;
  } | null;
}

export default function InvitedPage() {
  const [guests, setGuests] = useState<GuestRow[]>([]);

  useEffect(() => {
    fetch('/api/admin/guests')
      .then((r) => r.json())
      .then((d) => setGuests(d.guests || []));
  }, []);

  return (
    <div>
      <h1 className="section-title text-2xl text-onyx">Invited &amp; RSVP Tracking</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-onyx/10 bg-white">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-ivory text-xs uppercase text-charcoal/50">
            <tr>
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Link opened</th>
              <th className="px-3 py-2">RSVP status</th>
              <th className="px-3 py-2">Allergy / comment</th>
              <th className="px-3 py-2">Wish</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <tr key={g.id} className="border-t border-onyx/5">
                <td className="px-3 py-2">{g.fullName}{g.partnerName ? ` & ${g.partnerName}` : ''}</td>
                <td className="px-3 py-2">{g.linkOpenedAt ? '✅' : '—'}</td>
                <td className="px-3 py-2 capitalize">{g.rsvp?.attending || 'pending'}</td>
                <td className="px-3 py-2">{g.rsvp?.allergyComment || '—'}</td>
                <td className="px-3 py-2 max-w-xs truncate">{g.rsvp?.wishText || '—'}</td>
                <td className="px-3 py-2">
                  {g.rsvp?.submittedAt ? new Date(g.rsvp.submittedAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
