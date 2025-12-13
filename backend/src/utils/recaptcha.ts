import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token from the client
 * @param remoteIp - Optional IP address of the user
 * @returns Promise<boolean> - True if verification succeeds, false otherwise
 */
export async function verifyRecaptcha(token: string, remoteIp?: string): Promise<boolean> {
  try {
    // Skip verification in development if no secret key is configured
    if (!RECAPTCHA_SECRET_KEY) {
      console.warn('⚠️  No RECAPTCHA_SECRET_KEY configured. Skipping verification.');
      return true;
    }

    // Build verification request
    const params = new URLSearchParams();
    params.append('secret', RECAPTCHA_SECRET_KEY);
    params.append('response', token);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    // Send verification request to Google
    const response = await axios.post(RECAPTCHA_VERIFY_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { success, 'error-codes': errorCodes } = response.data;

    if (!success) {
      console.error('❌ reCAPTCHA verification failed:', errorCodes);
      return false;
    }

    console.log('✅ reCAPTCHA verification successful');
    return true;
  } catch (error) {
    console.error('❌ reCAPTCHA verification error:', error);
    return false;
  }
}
