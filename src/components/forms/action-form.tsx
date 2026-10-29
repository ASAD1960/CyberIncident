'use client';

import { createContext, useActionState, useContext } from 'react';
import { initialActionState, type ActionState } from '@/lib/action-state';
import { Alert } from '@/components/ui/alert';

const FormStateContext = createContext<ActionState>(initialActionState);
export const useFormState = () => useContext(FormStateContext);

/**
 * Wraps a Server Action with pending/error/success handling. Child fields read their own
 * errors and echoed values from context, so server components can compose forms declaratively.
 */
export function ActionForm({
  action,
  children,
  className,
  showSuccess = true,
  encType,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  showSuccess?: boolean;
  encType?: 'multipart/form-data';
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={className} noValidate>
        {state.message && (state.ok ? showSuccess : true) && (
          <Alert tone={state.ok ? 'success' : 'error'} className="mb-4">
            {state.message}
          </Alert>
        )}
        {children}
      </form>
    </FormStateContext.Provider>
  );
}
