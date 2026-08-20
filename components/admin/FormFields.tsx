"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import type { FieldError } from "@/lib/admin/content-schema";

/**
 * Form primitives for the staff portal.
 *
 * These are plain labelled inputs rather than a component library: the portal
 * has two forms, and the people using it are clinic staff who need obvious
 * labels and readable help text far more than they need abstraction.
 */

const fieldClass =
  "w-full rounded-2xl border border-silver bg-white px-4 py-3 text-charcoal placeholder:text-charcoal/40 focus:border-deep-teal focus:outline-none disabled:bg-sage/30 disabled:text-charcoal/50";
const labelClass = "mb-1.5 block text-sm font-semibold text-charcoal";
const hintClass = "mb-1.5 text-sm text-charcoal/55";

function errorFor(errors: FieldError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

type BaseProps = {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  errors: FieldError[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function Field({
  name,
  label,
  hint,
  defaultValue,
  errors,
  required,
  disabled,
  placeholder,
  type = "text",
}: BaseProps & { type?: string }) {
  const error = errorFor(errors, name);
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="ml-1 text-cta-orange">*</span>}
      </label>
      {hint && <p className={hintClass}>{hint}</p>}
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${fieldClass} ${error ? "border-red-400" : ""}`}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  name,
  label,
  hint,
  defaultValue,
  errors,
  required,
  disabled,
  placeholder,
  rows = 5,
}: BaseProps & { rows?: number }) {
  const error = errorFor(errors, name);
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="ml-1 text-cta-orange">*</span>}
      </label>
      {hint && <p className={hintClass}>{hint}</p>}
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${fieldClass} ${error ? "border-red-400" : ""}`}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-silver bg-white px-4 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 accent-deep-teal"
      />
      <span>
        <span className="block text-sm font-semibold text-charcoal">{label}</span>
        {hint && <span className="block text-sm text-charcoal/55">{hint}</span>}
      </span>
    </label>
  );
}

/** Errors that aren't tied to one input — a failed commit, a conflict. */
export function FormMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export function SuccessMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-start gap-2.5 rounded-2xl border border-deep-teal/30 bg-sage/50 px-4 py-3 text-sm text-charcoal"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Submit button that reports the in-flight state.
 *
 * `useFormStatus` reads the pending state of the enclosing form, so this works
 * for both `useActionState` forms and plain ones. Saving takes a couple of
 * seconds — it is two GitHub round trips — and without feedback people click
 * twice.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  disabled?: boolean;
  variant?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  const styles =
    variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-mint text-charcoal hover:-translate-y-0.5 hover:shadow-button-hover";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-pill px-7 py-3.5 text-[16px] font-semibold transition-all duration-200 ease-premium disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none ${styles}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
