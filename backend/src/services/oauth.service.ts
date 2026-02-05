import { OAuth2Client, TokenPayload } from "google-auth-library";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import crypto from "crypto";

const prisma = new PrismaClient();

// Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/auth/google/callback";

if (!GOOGLE_CLIENT_ID) {
  console.warn("WARNING: GOOGLE_CLIENT_ID not set - Google OAuth will not work");
}

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
}

export interface OAuthResult {
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    authProvider: "EMAIL" | "GOOGLE" | "WALLET";
    avatarUrl: string | null;
  };
  isNewUser: boolean;
}

export class OAuthService {
  private googleClient: OAuth2Client | null;

  constructor(private redis: Redis) {
    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      this.googleClient = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );
    } else {
      this.googleClient = null;
    }
  }

  /**
   * Generate Google OAuth URL with state parameter
   */
  async generateGoogleAuthUrl(): Promise<{ url: string; state: string }> {
    if (!this.googleClient) {
      throw new Error("Google OAuth not configured");
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString("hex");

    // Store state in Redis for verification (5 min TTL)
    await this.redis.setex(`oauth:state:${state}`, 300, JSON.stringify({
      createdAt: Date.now(),
      type: "google",
    }));

    const url = this.googleClient.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state,
      prompt: "consent",
    });

    return { url, state };
  }

  /**
   * Handle Google OAuth callback
   */
  async handleGoogleCallback(code: string, state: string): Promise<OAuthResult> {
    if (!this.googleClient) {
      throw new Error("Google OAuth not configured");
    }

    // Verify state
    const storedState = await this.redis.get(`oauth:state:${state}`);
    if (!storedState) {
      throw new Error("Invalid or expired OAuth state");
    }

    // Delete state to prevent replay
    await this.redis.del(`oauth:state:${state}`);

    // Exchange code for tokens
    const { tokens } = await this.googleClient.getToken(code);

    if (!tokens.id_token) {
      throw new Error("No ID token received from Google");
    }

    // Verify ID token and get user info
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google ID token");
    }

    const googleUser: GoogleUserInfo = {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name || payload.email!,
      picture: payload.picture || "",
      emailVerified: payload.email_verified || false,
    };

    // Find or create user
    return this.findOrCreateGoogleUser(googleUser);
  }

  /**
   * Verify Google ID token (for mobile/SPA direct token auth)
   */
  async verifyGoogleIdToken(idToken: string): Promise<OAuthResult> {
    if (!this.googleClient) {
      throw new Error("Google OAuth not configured");
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google ID token");
    }

    const googleUser: GoogleUserInfo = {
      googleId: payload.sub,
      email: payload.email!,
      name: payload.name || payload.email!,
      picture: payload.picture || "",
      emailVerified: payload.email_verified || false,
    };

    return this.findOrCreateGoogleUser(googleUser);
  }

  /**
   * Find existing user or create new one from Google profile
   */
  private async findOrCreateGoogleUser(googleUser: GoogleUserInfo): Promise<OAuthResult> {
    // Check if user exists by Google ID
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    let isNewUser = false;

    if (!user) {
      // Check if user exists by email (account linking)
      user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            avatarUrl: googleUser.picture || user.avatarUrl,
            emailVerified: true, // Google verified the email
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: "GOOGLE_ACCOUNT_LINKED",
            userId: user.id,
            status: "SUCCESS",
            metadata: { googleId: googleUser.googleId },
          },
        });
      } else {
        // Create new user
        isNewUser = true;
        user = await prisma.user.create({
          data: {
            googleId: googleUser.googleId,
            email: googleUser.email,
            displayName: googleUser.name,
            avatarUrl: googleUser.picture,
            emailVerified: googleUser.emailVerified,
            authProvider: "GOOGLE",
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: "USER_REGISTERED",
            userId: user.id,
            status: "SUCCESS",
            metadata: {
              provider: "GOOGLE",
              googleId: googleUser.googleId,
            },
          },
        });
      }
    } else {
      // Update last login info
      await prisma.auditLog.create({
        data: {
          action: "GOOGLE_AUTH",
          userId: user.id,
          status: "SUCCESS",
        },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        authProvider: user.authProvider as "EMAIL" | "GOOGLE" | "WALLET",
        avatarUrl: user.avatarUrl,
      },
      isNewUser,
    };
  }
}
