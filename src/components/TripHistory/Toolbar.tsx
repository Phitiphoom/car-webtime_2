/* -------------------------------------------------------------------------- */
/*  File: src/components/Toolbar.tsx                                          */
/*  ทูลบาร์ประวัติการใช้รถ                                                   */
/* -------------------------------------------------------------------------- */
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText, Download } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface ToolbarProps {
  isRefreshing: boolean;
  isPrinting: boolean;
  onRefresh: () => void;
  onPrint: () => void;
  onExport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isRefreshing,
  isPrinting,
  onRefresh,
  onPrint,
  onExport,
}) => {
  /* แอนิเมชันคอนเทนเนอร์ */
  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: -10
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        type: "tween" as const,
        ease: "easeOut"
      },
    },
  };

  /* แอนิเมชันปุ่ม */
  const buttonVariants: Variants = {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring" as const,
        stiffness: 300
      }
    },
    tap: {
      scale: 0.95
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="
        flex
        flex-col
        sm:flex-row
        justify-between
        items-start
        sm:items-center
        gap-4
        mb-6
        bg-gradient-to-r
        from-white
        to-gray-50
        dark:from-gray-900
        dark:to-gray-800
        p-4
        rounded-2xl
        shadow-md
        transition-all
        duration-300
      "
      role="toolbar"
      aria-label="แถบเครื่องมือประวัติการใช้รถ"
    >
      {/* ---------- ชื่อและคำอธิบาย ---------- */}
      <div>
        <h2
          className="
            text-2xl
            sm:text-3xl
            font-bold
            text-gray-900
            dark:text-gray-100
            tracking-tight
          "
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          ประวัติการใช้รถ
        </h2>
        <p
          className="
            mt-1
            text-sm
            sm:text-base
            text-gray-600
            dark:text-gray-400
            tracking-wide
          "
        >
          ดูและจัดการบันทึกการใช้รถของคุณ
        </p>
      </div>

      {/* ---------- ปุ่มต่าง ๆ ---------- */}
      <div className="flex gap-3">
        {/* ปุ่มรีเฟรช */}
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="
              flex
              items-center
              gap-2
              border-gray-300
              dark:border-gray-600
              text-gray-700
              dark:text-gray-200
              hover:bg-indigo-50
              dark:hover:bg-indigo-900/50
              rounded-lg
              shadow-sm
              transition-all
              duration-200
            "
            aria-label="รีเฟรชประวัติการใช้รถ"
          >
            <motion.div
              animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isRefreshing
                  ? { repeat: Infinity, duration: 1, type: "tween", ease: "linear" }
                  : { duration: 0.3 }
              }
            >
              <RefreshCw className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
            <span>{isRefreshing ? 'กำลังรีเฟรช…' : 'รีเฟรช'}</span>
          </Button>
        </motion.div>

        {/* ปุ่มพิมพ์ */}
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            variant="outline"
            onClick={onPrint}
            disabled={isPrinting}
            className="
              flex
              items-center
              gap-2
              border-gray-300
              dark:border-gray-600
              text-gray-700
              dark:text-gray-200
              hover:bg-indigo-50
              dark:hover:bg-indigo-900/50
              rounded-lg
              shadow-sm
              transition-all
              duration-200
            "
            aria-label="พิมพ์ประวัติการใช้รถ"
          >
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isPrinting ? 'กำลังพิมพ์…' : 'พิมพ์'}</span>
          </Button>
        </motion.div>

        {/* ปุ่มส่งออก */}
        <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
          <Button
            variant="outline"
            onClick={onExport}
            className="
              flex
              items-center
              gap-2
              border-gray-300
              dark:border-gray-600
              text-gray-700
              dark:text-gray-200
              hover:bg-indigo-50
              dark:hover:bg-indigo-900/50
              rounded-lg
              shadow-sm
              transition-all
              duration-200
            "
            aria-label="ส่งออกประวัติการใช้รถ"
          >
            <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>ส่งออก</span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Toolbar;
