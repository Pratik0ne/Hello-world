import { cn } from '@/lib/utils/cn';

type Step = {
  title: string;
  description?: string;
};

type StepperProps = {
  steps: Step[];
  activeStep: number;
};

export function Stepper({ steps, activeStep }: StepperProps) {
  return (
    <ol className="grid gap-4 sm:grid-cols-5">
      {steps.map((step, index) => {
        const status = index === activeStep ? 'active' : index < activeStep ? 'complete' : 'pending';
        return (
          <li key={step.title} className={cn('flex flex-col rounded-xl border border-indigo/20 p-4', status === 'active' && 'border-indigo bg-indigo/5')}>
            <span
              className={cn(
                'mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
                status === 'complete' && 'border-teal bg-teal text-white',
                status === 'active' && 'border-indigo bg-indigo text-white',
                status === 'pending' && 'border-indigo/30 text-indigo'
              )}
            >
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-navy">{step.title}</span>
            {step.description ? <span className="mt-1 text-xs text-charcoal/70">{step.description}</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
