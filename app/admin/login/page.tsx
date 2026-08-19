import Link from "next/link";
import { redirect } from "next/navigation";

import { adminPortalConfigured, getAdminSession, isSafeRedirect } from "@/lib/admin/auth";
import { KineticMark } from "@/components/layout/Logo";

import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

/**
 * The portal's front door.
 *
 * Reading the session cookie opts this route into dynamic rendering, which is
 * what we want — a prerendered login page would show the form to someone who
 * is already signed in.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only carry forward a destination we're willing to redirect to; see
  // isSafeRedirect for why an unchecked value here would be an open redirect.
  const safeNext = next && isSafeRedirect(next) ? next : "";

  const session = await getAdminSession();
  if (session) redirect(safeNext || "/admin");

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-charcoal"
            aria-label="Kinetic Therapy Clinic home"
          >
            <KineticMark className="h-9 w-9" />
            <span className="font-heading text-lg font-bold">Kinetic Therapy</span>
          </Link>
          <h1 className="mt-6 font-heading text-3xl font-bold text-charcoal">Staff portal</h1>
          <p className="mt-2 text-[15px] text-charcoal/60">
            Sign in to manage the clinic&apos;s website content.
          </p>
        </div>

        <div className="rounded-card border border-silver/70 bg-white p-7 shadow-card sm:p-8">
          <LoginForm next={safeNext} configured={adminPortalConfigured()} />
        </div>

        <p className="mt-6 text-center text-sm text-charcoal/50">
          Locked out? Ask whoever manages the site to reset your password.
        </p>
      </div>
    </main>
  );
}
