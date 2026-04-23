'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCars } from '@/hooks/useCars';

interface CarOption {
  value: string;
  label: string;
}

interface CarComboboxProps {
  options?: CarOption[]; // หากมี prop นี้จะใช้แทนผลลัพธ์จาก useCars
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CarCombobox({
  options,
  value,
  onChange,
  disabled,
  placeholder,
}: CarComboboxProps) {
  const [open, setOpen] = React.useState(false);

  let items: CarOption[] = [];
  let isLoading = false;
  let error: unknown = null;

  // หากมี prop options ให้ใช้ options นั้น ในกรณีที่ไม่มีให้ใช้ useCars hook
  if (options) {
    items = options;
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { cars, isLoading: loading, error: err } = useCars();
    isLoading = loading;
    error = err;
    items = cars.map((car) => ({
      value: car.CAR_ID.toString(),
      label: `${car.PLATE_NUMBER} - ${car.BRAND} ${car.MODEL}`,
    }));
  }

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Loading cars...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="outline" className="w-full text-red-500" disabled>
        Error loading cars
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value && items.length > 0
            ? items.find((item) => item.value === value)?.label ||
              (placeholder ?? 'Select car...')
            : (placeholder ?? 'Select car...')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search cars..." />
          <CommandEmpty>No car found.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => {
                  onChange?.(item.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === item.value ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
