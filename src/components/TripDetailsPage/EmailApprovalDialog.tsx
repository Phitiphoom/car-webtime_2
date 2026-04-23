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
import { Send, AlertCircle, CheckCircle } from 'lucide-react';

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
          aria-labelledby="email-approval-title"
        >
          <DialogHeader className="flex flex-col items-center text-center space-y-4 pb-2">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>

            {/* หัวข้อ */}
            <DialogTitle
              id="email-approval-title"
              className="
                text-xl
                font-bold
                text-gray-900
                dark:text-gray-100
                tracking-tight
              "
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              ส่งคำขออนุมัติทางอีเมล
            </DialogTitle>

            <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="
                  flex items-start gap-2
                  p-3
                  text-sm
                  text-red-600
                  dark:text-red-400
                  bg-red-50
                  dark:bg-red-900/20
                  border border-red-200 dark:border-red-800
                  rounded-lg
                "
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
                className="
                  flex items-start gap-2
                  p-3
                  text-sm
                  text-green-600
                  dark:text-green-400
                  bg-green-50
                  dark:bg-green-900/20
                  border border-green-200 dark:border-green-800
                  rounded-lg
                "
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
              <Label
                htmlFor="approverEmail"
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  dark:text-gray-300
                  mb-2
                "
              >
                อีเมลผู้อนุมัติ
              </Label>
              <Input
                id="approverEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || sent}
                className="
                  block
                  w-full
                  rounded-lg
                  border-gray-300
                  dark:border-gray-600
                  focus:ring-blue-500
                  focus:border-blue-500
                  p-2
                  text-gray-900
                  dark:text-gray-100
                "
                placeholder="example@company.com"
                aria-required="true"
              />
              {!email && !sent && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
              aria-label="ยกเลิกการส่งอีเมลขออนุมัติ"
            >
              {sent ? 'ปิด' : 'ยกเลิก'}
            </Button>

            {/* ปุ่มส่ง (แสดงเฉพาะเมื่อยังไม่ได้ส่ง) */}
            {!sent && (
              <Button
                onClick={onSend}
                disabled={!email || loading || sent}
                className="
                  flex-1
                  bg-blue-600
                  hover:bg-blue-700
                  dark:bg-blue-700
                  dark:hover:bg-blue-800
                  text-white
                  rounded-lg
                  transition-all
                  duration-200
                  flex
                  items-center
                  justify-center
                "
                aria-label="ส่งคำขออนุมัติ"
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
