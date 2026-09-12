import { z } from 'zod';

export const rsvpSchema = z.object({
  attending: z.enum(['yes', 'no', 'one_only', 'none']),
  email: z.string().email().optional().or(z.literal('')),
  allergyComment: z.string().max(1000).optional().or(z.literal('')),
  wishText: z.string().max(1000).optional().or(z.literal('')),
  displayNameOnWall: z.boolean().default(false),
});

export const guestInputSchema = z.object({
  type: z.enum(['single', 'couple']),
  fullName: z.string().min(1).max(200),
  partnerName: z.string().max(200).optional().or(z.literal('')),
  phoneNumber: z.string().min(6).max(30),
  email: z.string().email().optional().or(z.literal('')),
  guestSide: z.enum(['groom', 'bride']),
  tableId: z.string().uuid(),
});

export const tableInputSchema = z.object({
  tableNumber: z.number().int().positive(),
  capacity: z.number().int().positive().default(10),
});

export const giftContributionSchema = z.object({
  contributorName: z.string().max(200).optional().or(z.literal('')),
  amountZar: z.number().positive(),
  note: z.string().max(500).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const passwordResetSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
});

/** Very small sanitizer for free-text fields rendered on the public Wish Wall / Moments feed. */
export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 1000);
}

// Vivid sticky-note palette for the Wish Wall — blue, orange, green,
// yellow, purple, always paired with black text (see WishWall.tsx).
const WISH_WALL_COLORS = ['#3B6DF6', '#FB923C', '#2ECC71', '#FFD60A', '#A855F7'];
export function randomWishColor(): string {
  return WISH_WALL_COLORS[Math.floor(Math.random() * WISH_WALL_COLORS.length)];
}
