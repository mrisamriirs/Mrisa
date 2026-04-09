import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import { getBearerToken, verifyAdminToken } from "./_lib/auth.js";
import { ObjectId } from "mongodb";

const sendJson = (res: ServerResponse, statusCode: number, data: unknown) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
};

const requireAdmin = (req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) => {
  const token = getBearerToken(req.headers.authorization as string | undefined);
  const session = verifyAdminToken(token);
  return Boolean(session);
};

const readBody = async (req: IncomingMessage & { body?: unknown }) => {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
};

export default async function handler(
  req: IncomingMessage & {
    body?: unknown;
    query?: Record<string, string | string[]>;
    headers: Record<string, string | string[] | undefined>;
  },
  res: ServerResponse
) {
  try {
    const db = await getMongoDb();
    const collection = db.collection("registrations");

    // ---- Public count endpoint: GET /api/registrations?count=1&event_id=xxx ----
    if (req.method === "GET" && req.query?.count) {
      const eventId = req.query?.event_id ? String(req.query.event_id) : null;
      const query = eventId ? { event_id: eventId } : {};
      const count = await collection.countDocuments(query);
      return sendJson(res, 200, { count });
    }

    // ---- Admin-only: GET full list ----
    if (req.method === "GET") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const eventId = req.query?.event_id;
      const query = eventId ? { event_id: String(eventId) } : {};
      const regs = await collection.find(query).sort({ created_at: -1 }).toArray();
      return sendJson(res, 200, regs.map(r => ({ ...r, id: String(r._id) })));
    }

    // ---- Admin-only: PUT edit a registration ----
    if (req.method === "PUT") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const body = (await readBody(req)) as Record<string, unknown>;
      const id = String(body.id || "").trim();
      if (!id) return sendJson(res, 400, { error: "Missing registration id" });

      // Strip immutable fields
      const { id: _id, _id: __id, created_at, event_id, ...rest } = body as any;
      const update = { ...rest, updated_at: new Date().toISOString() };

      const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      if (!result.matchedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    // ---- Admin-only: DELETE ----
    if (req.method === "DELETE") {
      if (!requireAdmin(req)) return sendJson(res, 401, { error: "Authentication required" });
      const id = String(req.query?.id || "");
      if (!id) return sendJson(res, 400, { error: "Missing registration id" });
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) return sendJson(res, 404, { error: "Registration not found" });
      return sendJson(res, 200, { ok: true });
    }

    // ---- Public: POST submit a registration ----
    if (req.method !== "POST") {
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = (await readBody(req)) as Record<string, unknown>;
    const eventId = String(body.event_id || "").trim();
    if (!eventId) return sendJson(res, 400, { error: "Missing event_id" });

    // ── Unique Transaction ID check ─────────────────────────────────────
    const transactionId = body.transaction_id ? String(body.transaction_id).trim() : null;
    if (transactionId) {
      // Normalise: lowercase, strip spaces so casing/spacing variants are caught
      const normalised = transactionId.toLowerCase().replace(/\s+/g, "");
      const existing = await collection.findOne(
        { transaction_id_normalised: normalised },
        { projection: { _id: 1 } }
      );
      if (existing) {
        return sendJson(res, 409, {
          error: "DUPLICATE_TRANSACTION_ID",
          message: "This Reference / Transaction ID has already been used. Each payment must have a unique transaction ID.",
        });
      }
    }

    await collection.insertOne({
      ...body,
      event_id: eventId,
      transaction_id: transactionId,
      // Store normalised form for duplicate lookups
      transaction_id_normalised: transactionId
        ? transactionId.toLowerCase().replace(/\s+/g, "")
        : null,
      created_at: new Date().toISOString(),
    });
    return sendJson(res, 201, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration request failed";
    return sendJson(res, 500, { error: message });
  }
}