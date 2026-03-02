/**
 * Verify reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token from the client
 * @param remoteIp - Optional IP address of the user
 * @returns Promise<boolean> - True if verification succeeds, false otherwise
 */
export declare function verifyRecaptcha(token: string, remoteIp?: string): Promise<boolean>;
//# sourceMappingURL=recaptcha.d.ts.map