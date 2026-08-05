import { HAS_SERVER_API } from "@/lib/deploy-target";
import { SymptomRouter } from "@/components/concierge/SymptomRouter";

/**
 * The free-text symptom router plus the "or pick what fits" divider that
 * introduces the manual PainPointSelector below it.
 *
 * Both are rendered together, or neither is: the router needs the
 * /api/concierge backend, and on a static build with no API origin it could
 * only ever answer "our assistant is offline". Rather than ship a dead input
 * box, the whole block disappears and the manual selector — which works with
 * no server at all — becomes the way in. The divider goes with it, since
 * "or pick what fits" reads as a non-sequitur with nothing before it.
 */
export function SymptomRouterBlock() {
  if (!HAS_SERVER_API) return null;

  return (
    <>
      <div className="mt-10">
        <SymptomRouter />
      </div>
      <p className="mt-10 text-center text-sm font-semibold uppercase tracking-[0.14em] text-charcoal/70">
        or pick what fits
      </p>
    </>
  );
}
