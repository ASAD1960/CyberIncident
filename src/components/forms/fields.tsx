'use client';

import { useId } from 'react';
import { useFormState } from './action-form';

interface BaseProps {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
}

function FieldShell({
  id,
  label,
  hint,
  required,
  errors,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !errors?.length && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
      {errors?.map((e) => (
        <p key={e} id={`${id}-error`} className="field-error">
          {e}
        </p>
      ))}
    </div>
  );
}

const describe = (id: string, hint?: string, errors?: string[]) =>
  errors?.length ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function TextField({
  name,
  label,
  hint,
  required,
  defaultValue,
  type = 'text',
  autoComplete,
  maxLength,
  placeholder,
}: BaseProps & { type?: string; autoComplete?: string; maxLength?: number; placeholder?: string }) {
  const id = useId();
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  const isSecret = type === 'password';
  return (
    <FieldShell id={id} label={label} hint={hint} required={required} errors={errors}>
      <input
        id={id}
        name={name}
        type={type}
        className="input"
        defaultValue={isSecret ? undefined : (state.values?.[name] ?? defaultValue)}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describe(id, hint, errors)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  required,
  defaultValue,
  rows = 5,
  maxLength,
  placeholder,
}: BaseProps & { rows?: number; maxLength?: number; placeholder?: string }) {
  const id = useId();
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  return (
    <FieldShell id={id} label={label} hint={hint} required={required} errors={errors}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className="input"
        defaultValue={state.values?.[name] ?? defaultValue}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describe(id, hint, errors)}
      />
    </FieldShell>
  );
}

export function SelectField({
  name,
  label,
  hint,
  required,
  defaultValue,
  options,
  placeholder,
}: BaseProps & { options: { value: string; label: string }[]; placeholder?: string }) {
  const id = useId();
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  return (
    <FieldShell id={id} label={label} hint={hint} required={required} errors={errors}>
      <select
        id={id}
        name={name}
        className="input"
        defaultValue={state.values?.[name] ?? defaultValue ?? ''}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describe(id, hint, errors)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function FileField({
  name,
  label,
  hint,
  accept,
  multiple = true,
}: Omit<BaseProps, 'defaultValue'> & { accept?: string; multiple?: boolean }) {
  const id = useId();
  const state = useFormState();
  const errors = state.fieldErrors?.[name];
  return (
    <FieldShell id={id} label={label} hint={hint} errors={errors}>
      <input
        id={id}
        name={name}
        type="file"
        multiple={multiple}
        accept={accept}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-dark hover:file:bg-line"
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describe(id, hint, errors)}
      />
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[var(--brand)]" aria-describedby={hint ? `${id}-hint` : undefined} />
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="hint">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
