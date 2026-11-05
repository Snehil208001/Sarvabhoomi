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

/**
 * Normalizes any Nepali phone representation into:
 * - raw 10-digit format (e.g., "9820770232")
 * - E.164 format with Nepal country code (e.g., "+9779820770232")
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
async function handleCheckUser(phoneNumber: string): Promise<NextResponse<CheckUserResponse>> {
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

    return await handleCheckUser(phone);
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

  return await handleCheckUser(phone);
}
