import type { IncomingMessage, ServerResponse } from "http";
import { getMongoDb } from "./_lib/mongo.js";
import { signToken, verifyPassword } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.end("{}");
  let b: any = {}; try { let r = ""; for await (const c of req) r += c; b = JSON.parse(r || "{}"); } catch { }
  const email = b.email?.toLowerCase().trim();
  const pass = b.password;
  const be = process.env.ADMIN_BOOTSTRAP_EMAIL || process.env.ADMIN_EMAIL;
  const bp = process.env.ADMIN_BOOTSTRAP_PASSWORD || process.env.ADMIN_PASSWORD;
  if (email && email === be?.toLowerCase() && pass === bp) {
    return res.end(JSON.stringify({ token: signToken({ email: be, role: "admin" }) }));
  }
  const db = await getMongoDb();
  if (!db) { res.statusCode = 401; return res.end('{"error":"No DB"}'); }
  const user = await db.collection("admin_users").findOne({ email });
  if (user && verifyPassword(pass, user.password_hash)) {
    return res.end(JSON.stringify({ token: signToken({ email: user.email, role: user.role }) }));
  }
  res.statusCode = 401; return res.end('{"error":"Invalid login"}');
}
