import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";
import { verifyToken } from "./_lib/auth.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  const db = await getMongoDb();
  const col = db?.collection("registrations");
  
  // Robust query parsing for portability
  const url = new URL(req.url || "", "http://localhost");
  const q = Object.fromEntries(url.searchParams.entries());

  if (req.method === "GET") {
    if (!col) return res.end(q.count ? '{"count":0}' : "[]");
    const filter: any = {};
    if (q.event_id) filter.event_id = q.event_id;

    if (q.count) {
      try {
        const count = await col.countDocuments(filter);
        return res.end(JSON.stringify({ count }));
      } catch { return res.end('{"count":0}'); }
    }

    try {
      const items = await col.find(filter).sort({ created_at: -1 }).toArray();
      return res.end(JSON.stringify(items.map(i => ({ ...i, id: i._id.toString() }))));
    } catch { return res.end("[]"); }
  }

  if (req.method === "POST") {
    if (!col) { res.statusCode = 500; return res.end('{"error":"No DB"}'); }
    let b: any = {}; try { let r = ""; for await (const c of req) r += c; b = JSON.parse(r || "{}"); } catch { }
    const doc = { ...b, created_at: new Date().toISOString() };
    if (doc.transaction_id) {
        const norm = doc.transaction_id.toLowerCase().replace(/\s+/g, "");
        const ex = await col.findOne({ t_norm: norm });
        if (ex) { res.statusCode = 409; return res.end('{"error":"Duplicate"}'); }
        doc.t_norm = norm;
    }
    await col.insertOne(doc);
    return res.end('{"ok":true}');
  }

  if (req.method === "DELETE") {
    if (col && q.id) await col.deleteOne({ _id: new ObjectId(q.id) });
    return res.end('{"ok":true}');
  }
}
