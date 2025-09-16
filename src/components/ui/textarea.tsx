import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-indigo/30 bg-white px-3 py-2 text-sm text-charcoal shadow-sm transition focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/40 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
