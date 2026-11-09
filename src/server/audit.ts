import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

/**
 * Writes an audit_logs row (plan §10.4). Field names only — never values.
 * Audit logging is real even while modules use demo data.
 */
export async function logAudit(entry: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  patientId?: string;
  changedFields?: string[];
}) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  try {
    await db.insert(auditLogs).values({
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      patientId: entry.patientId ?? null,
      changedFields: entry.changedFields ?? null,
      ipAddress: ip && /^[0-9a-f.:]+$/i.test(ip) ? ip : null,
      userAgent: h.get("user-agent"),
    });
  } catch (err) {
    // Never block clinical work on an audit write failure; log ids only.
    console.error("audit log failed", entry.action, entry.entityId, err instanceof Error ? err.message : err);
  }
}
