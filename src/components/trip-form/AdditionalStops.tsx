// src/components/trip-form/AdditionalStops.tsx
import { useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { TripFormReturn } from '@/hooks/useTripForm';

export function AdditionalStops({ form }: { form: TripFormReturn }) {
  const { control, register } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          จุดแวะเพิ่มเติม
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ startPoint: '', endPoint: '' })}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          เพิ่มจุดแวะ
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">ไม่มีจุดแวะเพิ่มเติม</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-2 rounded-md bg-muted/50 p-2 sm:flex-row sm:items-center"
        >
          <Input
            {...register(`items.${index}.startPoint`)}
            placeholder="จุดเริ่ม"
            className="bg-background"
          />
          <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
            →
          </span>
          <Input
            {...register(`items.${index}.endPoint`)}
            placeholder="จุดหมาย"
            className="bg-background"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            aria-label="ลบจุดแวะ"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
