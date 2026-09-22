// src/components/trip-form/ApproverCombobox.tsx
//
// Multi-select approver picker: search existing users with an email on file,
// or type an address that isn't in the list yet. Picked approvers show as
// removable chips. Any ONE of them can settle the trip, so order is irrelevant.
'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
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
import { useApprovers } from '@/hooks/queries/useReferenceData';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_APPROVERS = 10;

export function ApproverCombobox({
  value = [],
  onChange,
}: {
  value?: string[];
  onChange: (emails: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: approvers } = useApprovers();

  const selected = new Set(value.map((e) => e.toLowerCase()));
  const term = search.trim().toLowerCase();
  const matches = (approvers ?? []).filter(
    (a) =>
      a.email &&
      (a.name.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term))
  );
  const newEmail = search.trim();
  const searchIsNewEmail =
    EMAIL_PATTERN.test(newEmail) &&
    !matches.some((a) => a.email?.toLowerCase() === newEmail.toLowerCase());
  const full = value.length >= MAX_APPROVERS;

  const toggle = (email: string) => {
    const lower = email.toLowerCase();
    if (selected.has(lower)) {
      onChange(value.filter((e) => e.toLowerCase() !== lower));
    } else if (!full) {
      onChange([...value, email.trim()]);
    }
  };

  const labelFor = (email: string) => {
    const a = (approvers ?? []).find(
      (x) => x.email?.toLowerCase() === email.toLowerCase()
    );
    return a ? a.name : email;
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((email) => (
            <li
              key={email}
              className="flex items-center gap-1 rounded-sm border border-foreground/25 bg-muted/50 py-0.5 pl-2 pr-1 text-sm"
              title={email}
            >
              <span className="max-w-[16rem] truncate">{labelFor(email)}</span>
              <button
                type="button"
                onClick={() => toggle(email)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`ลบ ${email}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="text-muted-foreground">
              {value.length
                ? 'เพิ่มผู้อนุมัติอีก...'
                : 'ค้นหาหรือเลือกผู้อนุมัติ...'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>ไม่พบผู้ใช้ที่ตรงกัน</CommandEmpty>
              <CommandGroup>
                {matches.map((approver) => (
                  <CommandItem
                    key={approver.id}
                    value={approver.email ?? String(approver.id)}
                    onSelect={() => approver.email && toggle(approver.email)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        approver.email &&
                          selected.has(approver.email.toLowerCase())
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{approver.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {approver.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
                {searchIsNewEmail && (
                  <CommandItem
                    value={newEmail}
                    onSelect={() => {
                      toggle(newEmail);
                      setSearch('');
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    ใช้อีเมลนี้: {newEmail}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {full && (
        <p className="text-xs text-muted-foreground">
          เพิ่มผู้อนุมัติได้สูงสุด {MAX_APPROVERS} คน
        </p>
      )}
    </div>
  );
}
