// A couple is one guest row but two people — every guest count shown in
// the admin counts it as 2, a single guest as 1.
export function guestHeads(g: { type: 'single' | 'couple' }): number {
  return g.type === 'couple' ? 2 : 1;
}

export function headcount(guests: { type: 'single' | 'couple' }[]): number {
  return guests.reduce((sum, g) => sum + guestHeads(g), 0);
}
