import { readClient } from "@/lib/content/supabase";

/**
 * Keeps the Supabase project from pausing.
 *
 * Supabase pauses free-tier projects after about a week without activity, and
 * a paused database means the staff portal cannot save until someone signs in
 * to the Supabase dashboard to wake it. For a clinic that edits its site every
 * few weeks, that is exactly the friction this whole setup exists to remove.
 *
 * A trivial query counts as activity. Vercel's scheduler calls this once a day
 * (see vercel.json), which keeps the project awake without anyone thinking
 * about it. The public site would often do the same on its own, but only if
 * someone happens to visit after the content cache expires — not something to
 * depend on.
 *
 * The response also doubles as a health check: it reports whether the database
 * actually answered, so a paused or broken project is visible in the Vercel
 * cron log rather than discovered the next time someone tries to save.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const client = readClient();
  if (!client) {
    return Response.json({ ok: true, database: "not configured" });
  }

  const startedAt = Date.now();
  const { error } = await client.from("clinic_info").select("id").eq("id", 1).maybeSingle();
  const ms = Date.now() - startedAt;

  if (error) {
    console.error("Keepalive: database did not respond —", error.message);
    return Response.json({ ok: false, database: "unreachable", error: error.message }, { status: 503 });
  }

  return Response.json({ ok: true, database: "awake", ms });
}
