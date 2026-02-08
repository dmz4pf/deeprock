import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import crypto from "crypto";

const prisma = new PrismaClient();

async function getTestToken() {
  // Get test user
  const user = await prisma.user.findFirst({
    where: { email: { contains: "test" } },
  });

  if (!user) {
    console.log("No test user found");
    return;
  }

  // Generate token using jose (same as auth.routes.ts)
  const secretString = process.env.JWT_SECRET || "your-super-secret-jwt-key-min-32-chars";
  const JWT_SECRET = new TextEncoder().encode(secretString);
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  // Store session so it's valid
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(expiresAt * 1000),
      userAgent: "Test CLI",
    },
  });

  console.log("Test User:", user.email);
  console.log("User ID:", user.id);
  console.log("\nToken:\n" + token);
  console.log("\nTest commands:");
  console.log(`\ncurl -H "Authorization: Bearer ${token}" http://localhost:3001/api/pools`);
}

getTestToken()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
