import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const styles = {
  error: { box: 'border-danger/40 bg-danger-soft text-danger', Icon: AlertTriangle },
  success: { box: 'border-ok/40 bg-ok-soft text-ok', Icon: CheckCircle2 },
  info: { box: 'border-brand/30 bg-brand-soft text-brand-dark', Icon: Info },
  warning: { box: 'border-warn/40 bg-warn-soft text-warn', Icon: AlertTriangle },
};

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: keyof typeof styles;
  children: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = styles[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-2 rounded-md border px-3 py-2 text-sm', box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
