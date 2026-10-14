import Google from '@auth/core/providers/google';
import { Email } from '@convex-dev/auth/providers/Email';
export function googleProvider() {
  return Google({
    allowDangerousEmailAccountLinking: false,
    authorization: {
      params: {
        scope: 'openid email'
      }
    },
    profile(profile) {
      if (profile.email_verified !== true || typeof profile.email !== 'string' || !profile.email || typeof profile.sub !== 'string' || !profile.sub) throw new Error('Use a verified Google email address.');
      return {
        id: profile.sub,
        email: profile.email.toLowerCase()
      };
    }
  });
}
export function emailOtpProvider(deliver: (email: string, code: string) => Promise<void>) {
  const generateVerificationToken = () => {
    let n: number;
    do {
      n = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (n >= 4200000000);
    return String(n % 100000000).padStart(8, '0');
  };
  return {
    ...Email({
      id: 'email-otp',
      maxAge: 600,
      generateVerificationToken,
      async sendVerificationRequest({
        identifier,
        token
      }) {
        try { await deliver(identifier, token); } catch { throw new Error('The email code could not be delivered. Try again later or use your existing sign-in method.'); }
      }
    }),
    maxAge: 600,
    generateVerificationToken
  };
}
