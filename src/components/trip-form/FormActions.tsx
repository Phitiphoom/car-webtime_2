// src/components/trip-form/FormActions.tsx
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function FormActions({
  isSubmitting,
  onCancel,
  submitLabel = 'บันทึก',
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        ยกเลิก
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </div>
  );
}
