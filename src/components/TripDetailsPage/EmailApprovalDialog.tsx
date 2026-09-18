// src/components/TripDetailsPage/EmailApprovalDialog.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, Variants } from 'framer-motion';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function EmailApprovalDialog({
  open,
  onClose,
  email,
  setEmail,
  onSend,
  loading,
  sent,
  error,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  setEmail: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  sent: boolean;
  error: string | null;
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
          aria-labelledby="email-approval-title"
        >
          <DialogHeader className="flex flex-col items-center text-center space-y-4 pb-2">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-primary" />
            </div>

            {/* หัวข้อ */}
            <DialogTitle
              id="email-approval-title"
              className="text-xl tracking-tight"
            >
              ส่งคำขออนุมัติทางอีเมล
            </DialogTitle>

            <p className="text-sm text-muted-foreground">
              กรุณากรอกอีเมลของผู้อนุมัติเพื่อส่งคำขออนุมัติ
            </p>
          </DialogHeader>

          {/* ฟอร์ม */}
          <div className="p-4 space-y-4">
            {/* ข้อความ Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">เกิดข้อผิดพลาด</p>
                  <p>{error}</p>
                </div>
              </motion.div>
            )}

            {/* ข้อความส่งสำเร็จ */}
            {sent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 text-sm text-success bg-success/10 border border-success/20 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">ส่งสำเร็จ!</p>
                  <p>อีเมลคำขออนุมัติได้ถูกส่งเรียบร้อยแล้ว</p>
                </div>
              </motion.div>
            )}

            {/* ช่องกรอกอีเมล */}
            <div>
              <Label htmlFor="approverEmail" className="block mb-2">
                อีเมลผู้อนุมัติ
              </Label>
              <Input
                id="approverEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || sent}
                placeholder="example@company.com"
                aria-required="true"
              />
              {!email && !sent && (
                <p className="mt-1 text-xs text-muted-foreground">
                  โปรดระบุอีเมลของผู้มีอำนาจอนุมัติทริปนี้
                </p>
              )}
            </div>
          </div>

          {/* ปุ่มควบคุม */}
          <DialogFooter className="mt-6 flex gap-3">
            {/* ปุ่มยกเลิก */}
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              aria-label="ยกเลิกการส่งอีเมลขออนุมัติ"
            >
              {sent ? 'ปิด' : 'ยกเลิก'}
            </Button>

            {/* ปุ่มส่ง (แสดงเฉพาะเมื่อยังไม่ได้ส่ง) */}
            {!sent && (
              <Button
                onClick={onSend}
                disabled={!email || loading || sent}
                className="flex-1 flex items-center justify-center"
                aria-label="ส่งคำขออนุมัติ"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    ส่ง
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}
