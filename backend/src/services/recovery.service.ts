import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export class RecoveryService {
  /**
   * Generate 10 recovery codes for a user
   * Returns plain codes (show to user once)
   */
  async generateCodes(userId: string): Promise<string[]> {
    // Delete existing codes
    await prisma.recoveryCode.deleteMany({ where: { userId } });

    // Generate 10 new codes
    const codes: string[] = [];
    const records: { userId: string; codeHash: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const code = this.generateCode();
      codes.push(code);
      records.push({
        userId,
        codeHash: await bcrypt.hash(code, 10),
      });
    }

    await prisma.recoveryCode.createMany({ data: records });
    return codes;
  }

  /**
   * Verify and use a recovery code
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const codes = await prisma.recoveryCode.findMany({
      where: { userId, used: false },
    });

    for (const record of codes) {
      if (await bcrypt.compare(code, record.codeHash)) {
        await prisma.recoveryCode.update({
          where: { id: record.id },
          data: { used: true, usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Check recovery code status
   */
  async getStatus(userId: string): Promise<{ total: number; unused: number }> {
    const [total, unused] = await Promise.all([
      prisma.recoveryCode.count({ where: { userId } }),
      prisma.recoveryCode.count({ where: { userId, used: false } }),
    ]);
    return { total, unused };
  }

  /**
   * Generate a single recovery code in format XXXX-XXXX
   */
  private generateCode(): string {
    // Use chars that avoid confusion (no 0/O/1/I)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
      if (i === 3) code += "-";
    }
    return code;
  }
}
