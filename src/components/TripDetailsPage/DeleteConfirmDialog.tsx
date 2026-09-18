// src/components/TripDetailsPage/DeleteConfirmDialog.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

export function DeleteConfirmDialog({
  open,
  onClose,
  onDelete,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const dialogVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        type: 'tween',
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        type: 'tween',
      },
    },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <motion.div
        variants={dialogVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <DialogContent
          className="max-w-md mx-auto"
          aria-labelledby="delete-confirm-title"
        >
          <DialogHeader className="flex flex-col items-center text-center space-y-4 pb-2">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            {/* หัวข้อ */}
            <DialogTitle
              id="delete-confirm-title"
              className="text-xl tracking-tight"
            >
              ยืนยันการลบ
            </DialogTitle>

            {/* คำอธิบาย */}
            <p className="text-sm text-muted-foreground">
              คุณแน่ใจหรือไม่ว่าต้องการลบทริปนี้? การกระทำนี้ไม่สามารถย้อนคืนได้
            </p>
          </DialogHeader>

          {/* ปุ่มควบคุม */}
          <DialogFooter className="mt-6 flex gap-3">
            {/* ปุ่มยกเลิก */}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              aria-label="ยกเลิกการลบ"
            >
              ยกเลิก
            </Button>

            {/* ปุ่มยืนยันลบ */}
            <Button
              onClick={onDelete}
              disabled={loading}
              variant="destructive"
              className="flex-1 flex items-center justify-center"
              aria-label="ยืนยันการลบ"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                'ลบ'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
