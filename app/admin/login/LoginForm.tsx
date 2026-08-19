"use client";

import { useActionState } from "react";
import { AlertCircle, Lock } from "lucide-react";

import { login, type LoginState } from "../actions";

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";

const initialState: LoginState = { error: null };

/**
 * The sign-in form.
 *
 * Posts to a Server Action rather than fetching an API route, so it still
 * works with JavaScript unavailable and so the session cookie and the next
 * screen arrive in one response. `useActionState` supplies the pending flag
 * and carries the error message back without the component holding any of the
 * submitted values itself — nothing here keeps a password in React state.
 */
export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {!configured && (
        <p
          className="flex items-start gap-2.5 rounded-2xl border border-cta-orange/40 bg-cta-orange/10 px-4 py-3 text-sm text-charcoal"
          role="status"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-cta-orange" aria-hidden="true" />
          <span>
            No accounts are configured on this deployment yet. Set{" "}
            <code className="font-semibold">ADMIN_USERS</code> and{" "}
            <code className="font-semibold">ADMIN_SESSION_SECRET</code>, then redeploy.
          </span>
        </p>
      )}

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={fieldClass}
          placeholder="you@kinetictherapyclinic.ca"
        />
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
          placeholder="••••••••"
        />
      </div>

      {state.error && (
        <p
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-mint px-7 py-4 text-[17px] font-semibold text-charcoal transition-all duration-200 ease-premium hover:-translate-y-0.5 hover:shadow-button-hover disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        <Lock className="h-[18px] w-[18px]" aria-hidden="true" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
