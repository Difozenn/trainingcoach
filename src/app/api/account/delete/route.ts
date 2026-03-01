import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * GDPR Account Deletion — cascading delete removes all user data.
 * All foreign keys reference users.id with onDelete: "cascade".
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete user — cascades to all related tables
  await db.delete(users).where(eq(users.id, session.user.id));

  return NextResponse.json({
    success: true,
    message: "Account and all associated data have been permanently deleted.",
  });
}
