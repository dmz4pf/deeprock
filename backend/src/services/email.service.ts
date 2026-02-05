import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import crypto from "crypto";

const prisma = new PrismaClient();

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@rwagateway.com";
const CODE_LENGTH = 6;
const CODE_TTL_SECONDS = 600; // 10 minutes
const MAX_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60; // 1 minute between sends

if (!RESEND_API_KEY) {
  console.warn("WARNING: RESEND_API_KEY not set - Email verification will not work");
}

export interface SendCodeResult {
  success: boolean;
  message: string;
  expiresAt: Date;
}

export interface VerifyCodeResult {
  success: boolean;
  user?: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    authProvider: "EMAIL" | "GOOGLE" | "WALLET";
  };
  isNewUser?: boolean;
}

export class EmailVerificationService {
  private resend: Resend | null;

  constructor(private redis: Redis) {
    if (RESEND_API_KEY) {
      this.resend = new Resend(RESEND_API_KEY);
    } else {
      this.resend = null;
    }
  }

  /**
   * Generate a 6-digit verification code
   */
  private generateCode(): string {
    // Generate cryptographically secure random code
    const buffer = crypto.randomBytes(4);
    const num = buffer.readUInt32BE(0);
    // Convert to 6-digit string
    return String(num % 1000000).padStart(CODE_LENGTH, "0");
  }

  /**
   * Send verification code to email
   */
  async sendVerificationCode(email: string): Promise<SendCodeResult> {
    // Check cooldown
    const cooldownKey = `email:cooldown:${email}`;
    const cooldownExists = await this.redis.exists(cooldownKey);
    if (cooldownExists) {
      const ttl = await this.redis.ttl(cooldownKey);
      throw new Error(`Please wait ${ttl} seconds before requesting a new code`);
    }

    // Generate code
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);

    // Store in database
    await prisma.emailVerificationCode.create({
      data: {
        email,
        code,
        expiresAt,
        attempts: 0,
        verified: false,
      },
    });

    // Also cache in Redis for faster lookups
    await this.redis.setex(
      `email:code:${email}`,
      CODE_TTL_SECONDS,
      JSON.stringify({ code, attempts: 0 })
    );

    // Set cooldown
    await this.redis.setex(cooldownKey, COOLDOWN_SECONDS, "1");

    // Send email
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          subject: "Your RWA Gateway Verification Code",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 480px; margin: 0 auto; padding: 20px; }
                .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;
                        background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; }
                .footer { color: #666; font-size: 12px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Verify your email</h2>
                <p>Enter this code to complete your sign-in:</p>
                <div class="code">${code}</div>
                <p>This code expires in 10 minutes.</p>
                <div class="footer">
                  <p>If you didn't request this code, you can safely ignore this email.</p>
                  <p>RWA Gateway - Secure Asset Tokenization</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new Error("Failed to send verification email. Please try again.");
      }
    } else {
      // Development mode - log code to console
      console.log(`[DEV] Verification code for ${email}: ${code}`);
    }

    return {
      success: true,
      message: "Verification code sent",
      expiresAt,
    };
  }

  /**
   * Verify the code and authenticate/register user
   */
  async verifyCode(email: string, code: string, displayName?: string): Promise<VerifyCodeResult> {
    // Check Redis first (faster)
    const cachedData = await this.redis.get(`email:code:${email}`);

    if (!cachedData) {
      // Check database as fallback
      const dbCode = await prisma.emailVerificationCode.findFirst({
        where: {
          email,
          verified: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!dbCode) {
        throw new Error("Verification code expired or not found");
      }

      if (dbCode.attempts >= MAX_ATTEMPTS) {
        throw new Error("Too many failed attempts. Please request a new code.");
      }

      if (dbCode.code !== code) {
        // Increment attempts
        await prisma.emailVerificationCode.update({
          where: { id: dbCode.id },
          data: { attempts: { increment: 1 } },
        });
        throw new Error("Invalid verification code");
      }

      // Mark as verified
      await prisma.emailVerificationCode.update({
        where: { id: dbCode.id },
        data: { verified: true },
      });
    } else {
      const { code: storedCode, attempts } = JSON.parse(cachedData);

      if (attempts >= MAX_ATTEMPTS) {
        throw new Error("Too many failed attempts. Please request a new code.");
      }

      if (storedCode !== code) {
        // Increment attempts in Redis
        await this.redis.setex(
          `email:code:${email}`,
          await this.redis.ttl(`email:code:${email}`),
          JSON.stringify({ code: storedCode, attempts: attempts + 1 })
        );
        throw new Error("Invalid verification code");
      }

      // Delete from Redis (code used)
      await this.redis.del(`email:code:${email}`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email,
          displayName: displayName || email.split("@")[0],
          emailVerified: true,
          authProvider: "EMAIL",
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: "USER_REGISTERED",
          userId: user.id,
          status: "SUCCESS",
          metadata: { provider: "EMAIL" },
        },
      });
    } else {
      // Mark email as verified if not already
      if (!user.emailVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: "EMAIL_AUTH",
          userId: user.id,
          status: "SUCCESS",
        },
      });
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        authProvider: user.authProvider as "EMAIL" | "GOOGLE" | "WALLET",
      },
      isNewUser,
    };
  }

  /**
   * Check if email is already registered
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }
}
