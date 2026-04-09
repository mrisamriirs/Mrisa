import type { IncomingMessage, ServerResponse } from "http";
import { ObjectId } from "mongodb";
import { getMongoDb } from "./_lib/mongo.js";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json");
  const db = await getMongoDb();
  const col = db?.collection("registrations");

  if (req.method === "GET") {
    if (!col) return res.end("[]");
    try {
      const items = await col.find().sort({ created_at: -1 }).toArray();
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
    if (!col) return res.end('{"ok":true}');
    const id = (req as any).query?.id;
    if (id) await col.deleteOne({ _id: new ObjectId(id) });
    return res.end('{"ok":true}');
  }
}
