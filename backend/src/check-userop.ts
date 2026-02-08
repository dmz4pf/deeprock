import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Get recent user operations
  const ops = await prisma.userOperation.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      userOpHash: true,
      status: true,
      action: true,
      createdAt: true,
      user: { select: { email: true } }
    }
  });
  
  console.log("=== RECENT USER OPERATIONS ===");
  for (const op of ops) {
    console.log(op.createdAt.toISOString().slice(0, 19) + " | " + op.status + " | " + op.action + " | " + op.user?.email + " | " + op.userOpHash?.slice(0, 20));
  }
  
  await prisma.$disconnect();
}
main();
