// src/components/shared/DepartmentCombobox.tsx
//
// The one way to choose a department anywhere in the app. The list is the
// official one imported from SAP; nothing lets you type a new department, so
// typos and duplicates can't get in.
'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDepartments } from '@/hooks/queries/useReferenceData';

export function DepartmentCombobox({
  value,
  onChange,
  placeholder = 'เลือกแผนก...',
  clearable = false,
  id,
}: {
  value?: string;
  onChange: (department: string) => void;
  placeholder?: string;
  /** Allow choosing "no department" (optional fields such as user / driver). */
  clearable?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: departments, isLoading } = useDepartments();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex gap-1">
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full min-w-0 justify-between"
          >
            {value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {clearable && value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onChange('')}
            aria-label="ล้างแผนก"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="ค้นหาแผนก..." />
          <CommandList className="max-h-64">
            <CommandEmpty>
              {isLoading ? 'กำลังโหลด...' : 'ไม่พบแผนกที่ตรงกัน'}
            </CommandEmpty>
            <CommandGroup>
              {(departments ?? []).map((name) => (
                <CommandItem
                  key={name}
                  value={name}
                  onSelect={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
