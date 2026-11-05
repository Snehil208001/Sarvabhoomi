import { NextRequest, NextResponse } from 'next/server';
import { nepalPhoneRegex } from '@sarvabhoomi/shared';
import { checkUserStatus } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface CheckUserResponse {
  success: boolean;
  data?: {
    phone: string;
    rawPhone: string;
    exists: boolean;
    isOnboarded: boolean;
    userIntent: string | null;
    suggestedMode: 'login' | 'signup';
    message: string;
  };
  error?: string;
}

// -----------------------------------------------------------------------------
// In-Memory Sliding-Window Rate Limiter
// Throttles to max 5 requests per minute per IP address and per phone number
// -----------------------------------------------------------------------------
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Evict timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { allowed: false, retryAfter };
  }

  record.timestamps.push(now);
  rateLimitStore.set(key, record);

  // Periodic pruning if store exceeds threshold
  if (rateLimitStore.size > 5000) {
    rateLimitStore.forEach((v, k) => {
      v.timestamps = v.timestamps.filter((ts: number) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (v.timestamps.length === 0) {
        rateLimitStore.delete(k);
      }
    });
  }

  return { allowed: true, retryAfter: 0 };
}

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'client-default-ip';
}

/**
 * Normalizes any Nepali phone representation into:
 * - raw 10-digit format (e.g., "98XXXXXXXX")
 * - E.164 format with Nepal country code (e.g., "+97798XXXXXXXX")
 */
function normalizeNepalPhone(input: string): { raw10: string; fullPhone: string } | null {
  const cleaned = input.replace(/^(?:\+977|977)/, '').replace(/[-\s]/g, '');
  if (!nepalPhoneRegex.test(cleaned)) {
    return null;
  }
  return {
    raw10: cleaned,
    fullPhone: `+977${cleaned}`,
  };
}

/**
 * Core verification logic shared between GET and POST handlers
 */
async function handleCheckUser(req: NextRequest, phoneNumber: string): Promise<NextResponse<CheckUserResponse>> {
  const clientIp = getClientIdentifier(req);
  const ipLimit = checkRateLimit(`ip:${clientIp}`);

  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many verification requests from this IP. Please wait ${ipLimit.retryAfter} seconds before trying again.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(ipLimit.retryAfter),
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  const normalized = normalizeNepalPhone(phoneNumber);

  if (!normalized) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid Nepali mobile number. Must be a valid 10-digit NTC or Ncell number.',
      },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // Rate limit by phone number to prevent targeted user enumeration
  const phoneLimit = checkRateLimit(`phone:${normalized.fullPhone}`);
  if (!phoneLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many verification attempts for this phone number. Please wait ${phoneLimit.retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(phoneLimit.retryAfter),
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  try {
    const status = await checkUserStatus(normalized.fullPhone);

    const exists = status.exists;
    const isOnboarded = status.is_onboarded;
    const userIntent = status.user_intent;

    // Dynamic branching determination:
    // 1. Existing & Onboarded -> Log In directly
    // 2. Existing but Not Onboarded -> Sign Up (complete remaining steps)
    // 3. New User -> Sign Up (fresh registration + 15 free credits)
    const suggestedMode: 'login' | 'signup' = exists && isOnboarded ? 'login' : 'signup';

    let message: string;
    if (exists && isOnboarded) {
      message = 'Registered account found. Ready for direct mobile login.';
    } else if (exists && !isOnboarded) {
      message = 'Account detected with pending onboarding. Please complete role and profile setup.';
    } else {
      message = 'New mobile number detected. Proceed to sign up and claim 15 free contact credits.';
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          phone: normalized.fullPhone,
          rawPhone: normalized.raw10,
          exists,
          isOnboarded,
          userIntent,
          suggestedMode,
          message,
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Error in /api/auth/check-user:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'An internal server error occurred while verifying user status.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}

/**
 * POST /api/auth/check-user
 * Request Body: { "phone": "9820770232" } or { "phone": "+9779820770232" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone = body?.phone;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: "phone" in request body.',
        },
        { status: 400 }
      );
    }

    return await handleCheckUser(req, phone);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Malformed JSON payload.',
      },
      { status: 400 }
    );
  }
}

/**
 * GET /api/auth/check-user?phone=9820770232
 */
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone');

  if (!phone) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing query parameter: "phone" is required.',
      },
      { status: 400 }
    );
  }

  return await handleCheckUser(req, phone);
}
