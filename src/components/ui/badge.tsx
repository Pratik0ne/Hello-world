import { cn } from '@/lib/utils/cn';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full border border-indigo/30 bg-indigo/10 px-3 py-1 text-xs font-medium text-indigo', className)}
      {...props}
    />
  );
}
