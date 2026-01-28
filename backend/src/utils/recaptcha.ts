import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number; // For v3
  action?: string; // For v3
  'error-codes'?: string[];
}

/**
 * Verify reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token from the client
 * @param remoteIp - Optional IP address of the user
 * @returns Promise<boolean> - True if verification succeeds, false otherwise
 */
export async function verifyRecaptcha(token: string, remoteIp?: string): Promise<boolean> {
  try {
    // In production, secret key is required
    if (!RECAPTCHA_SECRET_KEY) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ RECAPTCHA_SECRET_KEY is required in production!');
        return false;
      }
      console.warn('⚠️  No RECAPTCHA_SECRET_KEY configured. Skipping verification in development.');
      return true;
    }

    // Validate token format
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('❌ Invalid reCAPTCHA token format');
      return false;
    }

    // Build verification request
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET_KEY);
    params.append('response', token);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    // Send verification request to Google with timeout
    const response = await axios.post<RecaptchaResponse>(RECAPTCHA_VERIFY_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 5000, // 5 second timeout
    });

    const { success, 'error-codes': errorCodes, score } = response.data;

    if (!success) {
      console.error('❌ reCAPTCHA verification failed:', {
        errorCodes,
        remoteIp,
      });

      // Log specific error codes for debugging
      if (errorCodes) {
        errorCodes.forEach((code) => {
          switch (code) {
            case 'missing-input-secret':
              console.error('  - Missing secret key');
              break;
            case 'invalid-input-secret':
              console.error('  - Invalid secret key');
              break;
            case 'missing-input-response':
              console.error('  - Missing response token');
              break;
            case 'invalid-input-response':
              console.error('  - Invalid or expired response token');
              break;
            case 'bad-request':
              console.error('  - Bad request to reCAPTCHA API');
              break;
            case 'timeout-or-duplicate':
              console.error('  - Token timeout or duplicate submission');
              break;
            default:
              console.error(`  - Unknown error: ${code}`);
          }
        });
      }

      return false;
    }

    // For v3, you can check the score (0.0 to 1.0, higher is more likely human)
    if (score !== undefined) {
      console.log(`✅ reCAPTCHA v3 verification successful (score: ${score})`);
      // Optionally reject low scores (e.g., < 0.5)
      // if (score < 0.5) return false;
    } else {
      console.log('✅ reCAPTCHA v2 verification successful');
    }

    return true;
  } catch (error: any) {
    console.error('❌ reCAPTCHA verification error:', {
      message: error.message,
      code: error.code,
      remoteIp,
    });

    // In production, fail closed (reject on error)
    // In development, you might want to fail open for testing
    return process.env.NODE_ENV !== 'production';
  }
}
