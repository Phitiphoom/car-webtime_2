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
import { AlertTriangle } from 'lucide-react';

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
      scale: 0.95
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        type: "tween",
        ease: "easeOut"
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        type: "tween"
      }
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
          className="
            bg-white
            dark:bg-gray-900
            rounded-2xl
            shadow-xl
            p-6
            sm:p-8
            max-w-md
            mx-auto
          "
          aria-labelledby="delete-confirm-title"
        >
          <DialogHeader className="flex flex-col items-center text-center space-y-4 pb-2">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* หัวข้อ */}
            <DialogTitle
              id="delete-confirm-title"
              className="
                text-xl
                font-bold
                text-gray-900
                dark:text-gray-100
                tracking-tight
              "
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              ยืนยันการลบ
            </DialogTitle>

            {/* คำอธิบาย */}
            <p
              className="
                text-sm
                text-gray-600
                dark:text-gray-400
              "
            >
              คุณแน่ใจหรือไม่ว่าต้องการลบทริปนี้? การกระทำนี้ไม่สามารถย้อนคืนได้
            </p>
          </DialogHeader>

          {/* ปุ่มควบคุม */}
          <DialogFooter className="mt-6 flex gap-3">
            {/* ปุ่มยกเลิก */}
            <Button
              variant="outline"
              onClick={onClose}
              className="
                flex-1
                border-gray-300
                dark:border-gray-600
                text-gray-700
                dark:text-gray-200
                hover:bg-gray-100
                dark:hover:bg-gray-800
                rounded-lg
                transition-all
                duration-200
              "
              aria-label="ยกเลิกการลบ"
            >
              ยกเลิก
            </Button>

            {/* ปุ่มยืนยันลบ */}
            <Button
              onClick={onDelete}
              disabled={loading}
              className="
                flex-1
                bg-red-600
                hover:bg-red-700
                dark:bg-red-700
                dark:hover:bg-red-800
                text-white
                rounded-lg
                transition-all
                duration-200
                flex
                items-center
                justify-center
              "
              aria-label="ยืนยันการลบ"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
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
