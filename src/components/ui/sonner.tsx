'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Styled like a paper slip: cream card, ruled border, hard offset shadow and a
// colored ink bar on the left instead of sonner's default rounded pill.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-[3px] border border-foreground/30 border-l-4 border-l-foreground/50 bg-card px-4 py-3 text-sm text-card-foreground shadow-[3px_3px_0_0_hsl(var(--foreground)/0.12)]',
          title: 'font-medium',
          description: 'mt-0.5 text-xs text-muted-foreground',
          icon: 'mt-0.5 shrink-0',
          success:
            '!border-l-[hsl(var(--success))] [&_[data-icon]]:text-[hsl(var(--success))]',
          error: '!border-l-destructive [&_[data-icon]]:text-destructive',
          warning: '!border-l-amber-600 [&_[data-icon]]:text-amber-600',
          info: '!border-l-primary [&_[data-icon]]:text-primary',
          actionButton:
            'rounded-[3px] bg-primary px-2 py-1 text-xs text-primary-foreground',
          cancelButton:
            'rounded-[3px] bg-muted px-2 py-1 text-xs text-muted-foreground',
          closeButton: 'border border-foreground/30 bg-card text-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
