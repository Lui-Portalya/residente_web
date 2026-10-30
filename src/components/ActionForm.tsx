"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/validation/common";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  className?: string;
  children: React.ReactNode;
  submitLabel?: string;
  submitClass?: string;
};

/** Form bound to a server action; shows its message/error. Field errors are read via <FieldError>. */
export function ActionForm({ action, className = "stack", children, submitLabel, submitClass }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as FormState);
  return (
    <form action={formAction} className={className}>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      {state.message && <div className="notice ok" role="status">{state.message}</div>}
      {children}
      {state.fieldErrors && (
        <ul className="err" style={{ margin: 0, paddingLeft: 18 }}>
          {Object.entries(state.fieldErrors).flatMap(([k, v]) => (v ?? []).map((m) => <li key={k + m}>{k}: {m}</li>))}
        </ul>
      )}
      {submitLabel && <button type="submit" className={submitClass} disabled={pending}>{pending ? "Saving…" : submitLabel}</button>}
    </form>
  );
}
