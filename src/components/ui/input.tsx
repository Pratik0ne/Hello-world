import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border border-indigo/30 bg-white px-3 py-2 text-sm text-charcoal shadow-sm transition focus:border-indigo focus:outline-none focus:ring-2 focus:ring-indigo/40 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
