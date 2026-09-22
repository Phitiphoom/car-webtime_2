// src/components/trip-form/DriversSection.tsx
import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useDrivers } from '@/hooks/queries/useReferenceData';
import { Check, Plus, User, X } from 'lucide-react';
import type { TripFormReturn } from '@/hooks/useTripForm';

export function DriversSection({ form }: { form: TripFormReturn }) {
  const { control } = form;
  const { data: drivers } = useDrivers();
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name="driverIds"
      render={({ field }) => {
        const selectedIds = field.value ?? [];
        const selectedDrivers = (drivers ?? []).filter((d) =>
          selectedIds.includes(d.id)
        );

        const toggle = (id: number) => {
          field.onChange(
            selectedIds.includes(id)
              ? selectedIds.filter((existing) => existing !== id)
              : [...selectedIds, id]
          );
        };

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>คนขับ</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    เพิ่มคนขับ
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <Command>
                    <CommandInput placeholder="ค้นหาคนขับ..." />
                    <CommandList>
                      <CommandEmpty>ไม่พบคนขับ</CommandEmpty>
                      <CommandGroup>
                        {(drivers ?? []).map((driver) => (
                          <CommandItem
                            key={driver.id}
                            value={driver.name}
                            onSelect={() => toggle(driver.id)}
                          >
                            <Check
                              className={
                                selectedIds.includes(driver.id)
                                  ? 'mr-2 h-4 w-4 opacity-100'
                                  : 'mr-2 h-4 w-4 opacity-0'
                              }
                            />
                            {driver.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ยังไม่ได้เลือกคนขับ
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDrivers.map((driver) => (
                  <span
                    key={driver.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1 text-sm"
                  >
                    <User className="h-3.5 w-3.5" />
                    {driver.name}
                    <button
                      type="button"
                      onClick={() => toggle(driver.id)}
                      aria-label={`ลบ ${driver.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
