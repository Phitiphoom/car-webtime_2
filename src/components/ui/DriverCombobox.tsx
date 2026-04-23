// src/components/ui/DriverCombobox.tsx
// ปรับปรุงให้รองรับกรณีที่ไม่มีคนขับ หรือมีการโหลดข้อมูล

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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

import { useDrivers } from '@/hooks/useDrivers';

interface DriverComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function DriverCombobox({
  value,
  onChange,
  disabled,
}: DriverComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const { drivers, isLoading, error } = useDrivers();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>กำลังโหลดข้อมูลคนขับ...</span>
            </div>
          ) : value ? (
            drivers.find((driver) => driver.DRIVER_ID.toString() === value)
              ?.DRIVER_NAME || 'ไม่พบคนขับ'
          ) : (
            'เลือกคนขับ...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="ค้นหาคนขับ..." />
          <CommandEmpty>
            {error ? 'เกิดข้อผิดพลาดในการโหลดข้อมูล' : 'ไม่พบคนขับ'}
          </CommandEmpty>
          <CommandGroup>
            {drivers.map((driver) => (
              <CommandItem
                key={driver.DRIVER_ID}
                value={driver.DRIVER_NAME}
                onSelect={() => {
                  onChange?.(driver.DRIVER_ID.toString());
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === driver.DRIVER_ID.toString()
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {driver.DRIVER_NAME}
                {driver.DEPARTMENT && (
                  <span className="ml-2 text-muted-foreground text-xs">
                    ({driver.DEPARTMENT})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
