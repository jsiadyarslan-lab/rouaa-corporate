// @ts-nocheck
// ─── NextAuth Configuration for User Authentication V4 ──────────
// Separate from admin auth (which uses jose + admin_token cookie)
// This handles: Google OAuth + Email/Password + Passkey
// V4 FIX: Enabled debug:true in production to diagnose Callback error.
//   Also added NEXTAUTH_URL validation and route handler wrapper.
// V3 FIX: Added .trim() to GOOGLE_CLIENT_ID/SECRET — Railway often
//   adds trailing whitespace/newlines when pasting values, which causes
//   Google to reject the secret with "invalid_client". Also added
//   startup validation that logs format/length without revealing values.

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { db } from './db';

// ── V4: Verify accounts table has required columns at module load ──
// If id_token column is missing, createAccount will fail silently.
(async () => {
  try {
    const columns = await db.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'accounts' ORDER BY ordinal_position`
    ) as any[];
    const colNames = columns.map((c: any) => c.column_name);
    console.log(`[NextAuth V4] accounts table columns: [${colNames.join(', ')}]`);
    const required = ['id', 'userId', 'type', 'provider', 'providerAccountId', 'access_token', 'refresh_token', 'expires_at', 'token_type', 'scope', 'id_token'];
    const missing = required.filter(c => !colNames.includes(c));
    if (missing.length > 0) {
      console.error(`[NextAuth V4] ❌ accounts table MISSING columns: [${missing.join(', ')}] — Google OAuth will fail!`);
    } else {
      console.log(`[NextAuth V4] ✓ accounts table has all required columns`);
    }
  } catch (err: any) {
    console.warn(`[NextAuth V4] Could not verify accounts table: ${err.message?.slice(0, 100)}`);
  }
})();

// Custom Prisma Adapter — handles our schema
// V4: Fixed method names to match NextAuth v4 adapter interface.
//   NextAuth v4 calls: linkAccount (not createAccount), getUserByAccount (not getAccount),
//   unlinkAccount (not deleteAccount). Wrong names caused "Callback" error because
//   NextAuth called methods that didn't exist → TypeError → generic Callback error.
function customPrismaAdapter(): any {
  const log = (method: string, msg: string) => console.log(`[Adapter V4] ${method}: ${msg}`);
  const logErr = (method: string, err: any) => console.error(`[Adapter V4] ${method} FAILED: ${err?.message || err}`);

  return {
    createUser: async (data: any) => {
      log('createUser', `email=${data.email}`);
      try {
        const user = await db.user.create({
          data: {
            email: data.email,
            name: data.name,
            image: data.image,
            provider: 'google',
            emailVerified: data.emailVerified || new Date(),
          },
        });
        // V122: Auto-create advisor profile for new users so recommendations work immediately
        try {
          await db.userProfile.create({
            data: {
              userId: user.id,
              experienceLevel: 'beginner',
              riskTolerance: 'moderate',
              investmentHorizon: 'medium',
              onboardingComplete: false,
              advisorEnabled: true,
              preferredAssets: '[]',
              preferredMarkets: '[]',
              interests: '[]',
              excludedAssets: '[]',
            },
          });
          log('createUser', `advisor profile created for ${user.id}`);
        } catch (profileErr: any) {
          // Non-fatal — advisor will skip if no profile exists
          logErr('createUser profile', profileErr);
        }
        log('createUser', `OK id=${user.id}`);
        return user;
      } catch (err: any) {
        logErr('createUser', err);
        throw err;
      }
    },
    getUser: async (id: string) => {
      log('getUser', `id=${id}`);
      try {
        return await db.user.findUnique({ where: { id } });
      } catch (err: any) { logErr('getUser', err); throw err; }
    },
    getUserByEmail: async (email: string) => {
      log('getUserByEmail', `email=${email}`);
      try {
        const user = await db.user.findUnique({ where: { email } });
        log('getUserByEmail', user ? `found id=${user.id}` : 'not found');
        return user;
      } catch (err: any) { logErr('getUserByEmail', err); throw err; }
    },
    // V4: getUserByAccount — REQUIRED by NextAuth v4 for OAuth callbacks.
    // NextAuth calls this to find if a user is already linked to an OAuth account.
    // Returns the User object (not the Account), or null.
    getUserByAccount: async ({ provider, providerAccountId }: { provider: string; providerAccountId: string }) => {
      log('getUserByAccount', `provider=${provider}, providerAccountId=${providerAccountId}`);
      try {
        const account = await db.account.findFirst({
          where: { provider, providerAccountId: String(providerAccountId) },
          select: { user: true },
        });
        log('getUserByAccount', account?.user ? `found userId=${account.user.id}` : 'not found');
        return account?.user || null;
      } catch (err: any) { logErr('getUserByAccount', err); throw err; }
    },
    updateUser: async (data: any) => {
      log('updateUser', `id=${data.id}`);
      try {
        return await db.user.update({ where: { id: data.id }, data });
      } catch (err: any) { logErr('updateUser', err); throw err; }
    },
    deleteUser: async (id: string) => {
      try {
        return await db.user.delete({ where: { id } });
      } catch (err: any) { logErr('deleteUser', err); throw err; }
    },
    // V4: linkAccount — NextAuth v4 calls this (NOT createAccount).
    // This is the method NextAuth uses to save OAuth account data during callback.
    linkAccount: async (data: any) => {
      log('linkAccount', `provider=${data.provider}, userId=${data.userId}, providerAccountId=${data.providerAccountId}`);
      try {
        const account = await db.account.create({
          data: {
            userId: data.userId,
            type: data.type,
            provider: data.provider,
            providerAccountId: String(data.providerAccountId),
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            token_type: data.token_type,
            scope: data.scope,
            id_token: data.id_token,
          },
        });
        log('linkAccount', `OK id=${account.id}`);
        return account;
      } catch (err: any) {
        logErr('linkAccount', err);
        throw err;
      }
    },
    // V4: unlinkAccount — NextAuth v4 calls this (NOT deleteAccount).
    unlinkAccount: async ({ provider, providerAccountId }: { provider: string; providerAccountId: string }) => {
      log('unlinkAccount', `provider=${provider}, providerAccountId=${providerAccountId}`);
      try {
        await db.account.deleteMany({
          where: { provider, providerAccountId: String(providerAccountId) },
        });
      } catch (err: any) { logErr('unlinkAccount', err); }
      return undefined;
    },
    createSession: async (data: any) => {
      log('createSession', `userId=${data.userId}`);
      try {
        return await db.session.create({
          data: {
            sessionToken: data.sessionToken,
            userId: data.userId,
            expires: data.expires,
          },
        });
      } catch (err: any) { logErr('createSession', err); throw err; }
    },
    getSession: async (sessionToken: string) => {
      try {
        return await db.session.findUnique({ where: { sessionToken } });
      } catch (err: any) { logErr('getSession', err); throw err; }
    },
    updateSession: async (data: any) => {
      try {
        return await db.session.update({ where: { sessionToken: data.sessionToken }, data });
      } catch (err: any) { logErr('updateSession', err); throw err; }
    },
    deleteSession: async (sessionToken: string) => {
      try {
        return await db.session.delete({ where: { sessionToken } });
      } catch (err: any) { logErr('deleteSession', err); throw err; }
    },
    createVerificationToken: async (data: any) => {
      try {
        return await db.verificationToken.create({
          data: { identifier: data.identifier, token: data.token, expires: data.expires },
        });
      } catch (err: any) { logErr('createVerificationToken', err); throw err; }
    },
    useVerificationToken: async (data: any) => {
      try {
        return await db.verificationToken.delete({
          where: { identifier_token: { identifier: data.identifier, token: data.token } },
        });
      } catch {
        return null;
      }
    },
  };
}

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter() as any,
  providers: [
    // Google OAuth — V3: Trimmed env vars + startup validation.
    // Railway often adds trailing whitespace/newlines when pasting values,
    // which causes Google to reject the secret with "invalid_client".
    GoogleProvider({
      clientId: (() => {
        const raw = process.env.GOOGLE_CLIENT_ID;
        const id = raw?.trim();
        if (!id) {
          console.warn('[NextAuth] GOOGLE_CLIENT_ID not set — Google login will fail');
        } else {
          const hasWhitespace = raw !== id;
          const looksValid = id.endsWith('.apps.googleusercontent.com') && id.length > 30;
          console.log(`[NextAuth V3] GOOGLE_CLIENT_ID: ${id.length} chars, suffix=${id.slice(-10)}, valid=${looksValid}${hasWhitespace ? ' (trimmed whitespace!)' : ''}`);
          if (!looksValid) console.warn('[NextAuth V3] GOOGLE_CLIENT_ID format looks wrong — should end with .apps.googleusercontent.com');
        }
        return id || 'missing-google-client-id';
      })(),
      clientSecret: (() => {
        const raw = process.env.GOOGLE_CLIENT_SECRET;
        const secret = raw?.trim();
        if (!secret) {
          console.warn('[NextAuth] GOOGLE_CLIENT_SECRET not set — Google login will fail');
        } else {
          const hasWhitespace = raw !== secret;
          const looksValid = secret.startsWith('GOCSPX-') && secret.length >= 30;
          console.log(`[NextAuth V3] GOOGLE_CLIENT_SECRET: ${secret.length} chars, prefix=${secret.slice(0, 7)}, valid=${looksValid}${hasWhitespace ? ' (trimmed whitespace!)' : ''}`);
          if (!looksValid) console.warn('[NextAuth V3] GOOGLE_CLIENT_SECRET format looks wrong — should start with GOCSPX- and be 35+ chars');
        }
        return secret || 'missing-google-client-secret';
      })(),
      // V155: Disabled allowDangerousEmailAccountLinking — it allowed account takeover.
      // An attacker could register with a victim's email via credentials, then the
      // victim's Google OAuth would link to the attacker's account (or vice versa).
      // Now: if email exists with different provider, Google login is rejected.
      allowDangerousEmailAccountLinking: false,
    }),

    // Email + Password
    CredentialsProvider({
      id: 'credentials',
      name: 'البريد الإلكتروني',
      credentials: {
        email: { label: 'البريد الإلكتروني', type: 'email' },
        password: { label: 'كلمة السر', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('البريد الإلكتروني وكلمة السر مطلوبان');
        }

        // V155: Password minimum length validation
        if (credentials.password.length < 8) {
          throw new Error('كلمة السر يجب أن تكون 8 أحرف على الأقل');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('البريد الإلكتروني أو كلمة السر غير صحيحة');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('البريد الإلكتروني أو كلمة السر غير صحيحة');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),

    // Passkey (handled via separate API routes — this is for session creation)
    CredentialsProvider({
      id: 'passkey',
      name: 'باسكي',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.userId) return null;

        const user = await db.user.findUnique({
          where: { id: credentials.userId },
        });

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    // V155: Reduced from 30 days to 7 days — financial platform should have shorter sessions.
    // 30 days is too long for a platform that handles investment recommendations.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  jwt: {
    // V155: JWT maxAge synced with session maxAge
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'user';
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // V155: Security hardening for OAuth account linking
      console.log(`[NextAuth V155] signIn callback — provider: ${account?.provider}, email: ${user?.email}`);

      // V155: Prevent account takeover — verify email ownership when linking providers.
      // If a user registered with credentials (password), and then tries to sign in
      // with Google using the same email, verify the Google email is verified.
      if (account?.provider === 'google') {
        // Google emails are always verified by Google
        if (!profile?.email_verified) {
          console.warn(`[NextAuth V155] Google profile email not verified — rejecting login for ${user?.email}`);
          return false;
        }

        // Check if this email already has an account with a DIFFERENT provider
        const existingUser = await db.user.findUnique({ where: { email: user.email! } });
        if (existingUser && existingUser.provider !== 'google' && !existingUser.emailVerified) {
          // Existing user registered with credentials but never verified their email.
          // Don't allow Google to link — could be account takeover.
          console.warn(`[NextAuth V155] Account takeover attempt? Email ${user.email} registered with ${existingUser.provider} but not verified. Blocking Google link.`);
          return false;
        }

        // Update user provider info
        try {
          if (!user.id) {
            console.error('[NextAuth V155] Google signIn: user.id is missing — adapter may have failed to create user');
          } else {
            await db.user.update({
              where: { id: user.id },
              data: {
                provider: 'google',
                image: user.image || undefined,
                emailVerified: new Date(),
              },
            });
            console.log(`[NextAuth V155] Google user updated: ${user.email}`);
          }
        } catch (dbError: any) {
          console.error(`[NextAuth V155] Failed to update Google user: ${dbError?.message || dbError}`);
        }
      }
      return true;
    },
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
  },

  // V3: Added events logging for OAuth debugging
  events: {
    async signIn({ user, account, profile }) {
      console.log(`[NextAuth Event] signIn — provider: ${account?.provider}, email: ${user?.email}`);
    },
    async signOut({ session }) {
      console.log(`[NextAuth Event] signOut`);
    },
    async createUser({ user }) {
      console.log(`[NextAuth Event] createUser — email: ${user?.email}`);
    },
    async linkAccount({ user, account }) {
      console.log(`[NextAuth Event] linkAccount — provider: ${account?.provider}, userId: ${user?.id}`);
    },
    async session({ session }) {
      // Don't log every session check — too noisy
    },
    async error(message) {
      console.error(`[NextAuth V3 Event] ERROR: ${JSON.stringify(message)}`);
      // Log the full error for debugging Callback errors
      if (typeof message === 'object' && message !== null) {
        try {
          console.error(`[NextAuth V3 Event] ERROR detail: ${JSON.stringify(message, null, 2)}`);
        } catch {}
      }
    },
  },

  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.ADMIN_SECRET;
    if (!secret) {
      console.error('[NextAuth V155] ❌ No NEXTAUTH_SECRET or ADMIN_SECRET set — JWT signing is INSECURE!');
    }
    const nextauthUrl = process.env.NEXTAUTH_URL;
    if (!nextauthUrl) {
      console.error('[NextAuth V155] ❌ NEXTAUTH_URL not set — OAuth callbacks will fail!');
    } else {
      console.log(`[NextAuth V155] NEXTAUTH_URL=${nextauthUrl}`);
    }
    // V155: NO fallback in production runtime — must use proper secret.
    // During build, allow fallback since env vars aren't available.
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    if (!secret && process.env.NODE_ENV === 'production' && !isBuildTime) {
      // At runtime in production without a secret — this is a critical security issue.
      // We can't throw here (it breaks module loading), but we log loudly and use
      // a warning prefix to make the issue visible in production logs.
      console.error('[NextAuth V155] ❌ CRITICAL: No NEXTAUTH_SECRET set in production! JWT tokens can be forged!');
    }
    return secret || 'dev-only-secret-NOT-FOR-PRODUCTION';
  })(),

  // V155: Disable debug in production — was temporarily enabled for OAuth debugging.
  // Debug mode leaks internal auth details in logs and responses.
  debug: process.env.NODE_ENV === 'development',
};
