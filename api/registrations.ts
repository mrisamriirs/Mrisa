import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";

// ── Inline helpers (no security.ts dependency) ────────────────────────────────

const sendJson = (res: ServerResponse, code: number, data: unknown) => {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.end(JSON.stringify(data));
};

const sanitize = (v: unknown, max = 1000): string =>
  String(v ?? "").trim().replace(/<[^>]*>/g, "").replace(/\0/g, "").slice(0, max);

const isValidId = (v: unknown) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

const readBody = async (req: IncomingMessage & { body?: unknown }, maxLimit = 10 * 1024 * 1024): Promise<Record<string, unknown>> => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { return {}; } }
  let raw = ""; let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk as string);
    if (bytes > maxLimit) return {};
    raw += chunk;
  }
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) =>
  Boolean(verifyAdminToken(getBearerToken(req.headers.authorization as string | undefined)));

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage & {
    body?: unknown;
    query?: Record<string, string | string[]>;
    headers: Record<string, string | string[] | undefined>;
  },
  res: ServerResponse
) {
  try {
    if (!process.env.MONGO_URI) {
      return sendJson(res, 503, { error: "Server not configured." });
    }

    const db = await getMongoDb();
    const collection = db.collection("registrations");

    // ── GET Count (public) ────────────────────────────────────────────────
    if (req.method === "GET" && req.query?.count) {
      const eventId = req.query?.event_id ? sanitize(req.query.event_id, 64) : null;
      const query = eventId ? { event_id: eventId } : {};
      const count = await collection.countDocuments(query);
      return sendJson(res, 200, { count });
    }

    // ── Admin-only beyond here ────────────────────────────────────────────
    if (req.method === "GET") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const eventId = req.query?.event_id ? sanitize(req.query.event_id, 64) : null;
      const query = eventId ? { event_id: eventId } : {};
      const regs = await collection.find(query).sort({ created_at: -1 }).toArray();
      return sendJson(res, 200, regs.map(r => ({ ...r, id: String(r._id) })));
    }

    if (req.method === "PUT") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const body = await readBody(req);
      const id = sanitize(body.id, 64);
      if (!id || !isValidId(id)) return sendJson(res, 400, { error: "Invalid registration ID" });

      const { id: _id, _id: __id, created_at, event_id, transaction_id_normalised, ...rest } = body as any;
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        cleaned[k] = typeof v === "string" ? sanitize(v, 2000) : v;
      }

      const update = { ...cleaned, updated_at: new Date().toISOString() };
      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const id = sanitize(req.query?.id, 64);
      if (!id || !isValidId(id)) return sendJson(res, 400, { error: "Invalid registration ID" });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    // ── Public: POST submit ───────────────────────────────────────────────
    if (req.method !== "POST") {
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = await readBody(req, 10 * 1024 * 1024);
    const eventId = sanitize(body.event_id, 64);
    if (!eventId) return sendJson(res, 400, { error: "Missing event_id" });

    const name = sanitize(body.name, 200);
    const email = sanitize(body.email, 320).toLowerCase();
    const teamName = sanitize(body.team_name, 200);
    const transactionId = body.transaction_id ? sanitize(body.transaction_id, 200) : null;
    const paymentProofUrl = body.payment_proof_url ? sanitize(body.payment_proof_url, 2048) : null;
    const registrationType = sanitize(body.registration_type, 20);
    const registrationCategory = sanitize(body.registration_category, 50);

    const rawMembers = Array.isArray(body.team_members) ? body.team_members : null;
    const teamMembers = rawMembers
      ? rawMembers.slice(0, 20).map((m: any) => {
          if (typeof m !== "object" || m === null) return {};
          const cleaned: Record<string, string> = {};
          for (const [k, v] of Object.entries(m)) {
            cleaned[sanitize(k, 100)] = sanitize(v, 500);
          }
          return cleaned;
        })
      : null;

    if (transactionId) {
      const normalised = transactionId.toLowerCase().replace(/\s+/g, "");
      const existing = await collection.findOne({ transaction_id_normalised: normalised }, { projection: { _id: 1 } });
      if (existing) {
        return sendJson(res, 409, {
          error: "DUPLICATE_TRANSACTION_ID",
          message: "This Reference / Transaction ID has already been used.",
        });
      }
    }

    await collection.insertOne({
      event_id: eventId, name, email, team_name: teamName || null,
      registration_type: registrationType || null, registration_category: registrationCategory || null,
      payment_proof_url: paymentProofUrl, transaction_id: transactionId,
      transaction_id_normalised: transactionId ? transactionId.toLowerCase().replace(/\s+/g, "") : null,
      team_members: teamMembers, dynamic_fields: teamMembers?.[0] || {},
      created_at: new Date().toISOString(),
    });

    return sendJson(res, 201, { ok: true });
  } catch (err) {
    console.error("[registrations] error:", err instanceof Error ? err.message : String(err));
    if (!res.headersSent) sendJson(res, 500, { error: "An internal server error occurred." });
  }
}
