'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Trip } from '@/types/trip';

export function useTripExport(trips: Trip[]) {
  const [isPrinting, setIsPrinting] = useState(false);
  const printableContentRef = useRef<HTMLDivElement>(null);

  // ฟังก์ชันสำหรับพิมพ์
  const handlePrint = useReactToPrint({
    contentRef: printableContentRef,
    onBeforePrint: () =>
      new Promise<void>((resolve) => {
        setIsPrinting(true);
        // ให้เวลาอัปเดต component ก่อนจะทำการถ่ายภาพ
        setTimeout(resolve, 500);
      }),
    onAfterPrint: () => setIsPrinting(false),
    documentTitle: 'Car Webtime Trips',
    pageStyle: `
      @media print {
        body { font-size:12px }
        .no-print { display: none !important }
      }
    `,
  });

  // ฟังก์ชันสำหรับส่งออกไฟล์ CSV
  const exportToCSV = () => {
    // เตรียมข้อมูลสำหรับ CSV
    const BOM = '\uFEFF';

    const header = [
      'ID',
      'Date',
      'Vehicle',
      'Start Point',
      'End Point',
      'Purpose',
      'Department',
      'Status',
      'Recorded By',
    ];

    const csvData = trips.map((trip) => [
      trip.TID,
      formatThaiDate(new Date(trip.DATE)),
      trip.CARBARND,
      trip.START_POINT,
      trip.END_POINT,
      trip.PURPOSE || 'ไม่ระบุ',
      trip.DEPARTMENT || 'ไม่ระบุ',
      translateStatus(trip.APPROVE_STATUS) || 'รออนุมัติ',
      trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ระบุ',
    ]);

    // เพิ่ม header ลงในข้อมูล
    csvData.unshift(header);

    // แปลงเป็น CSV format
    const csvContent =
      BOM +
      csvData
        .map((row) =>
          row
            .map((cell) => {
              // จัดการกับเซลล์ที่มีเครื่องหมายพิเศษ (commas, quotes, etc.)
              const cellStr = String(cell);
              // ถ้าเซลล์มีเครื่องหมาย , หรือ " หรือ ขึ้นบรรทัดใหม่ ให้ครอบด้วยเครื่องหมาย " และแทนที่ " ด้วย ""
              if (
                cellStr.includes(',') ||
                cellStr.includes('"') ||
                cellStr.includes('\n')
              ) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            })
            .join(',')
        )
        .join('\n');

    // สร้าง blob และดาวน์โหลด
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `รายงานการใช้รถ_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ฟังก์ชันช่วยแปลงวันที่เป็นรูปแบบไทย
  const formatThaiDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('th-TH', options);
  };

  // ฟังก์ชันแปลสถานะเป็นภาษาไทย
  const translateStatus = (status?: string | null): string => {
    if (!status) return 'รออนุมัติ';

    switch (status.toLowerCase()) {
      case 'approve':
        return 'อนุมัติแล้ว';
      case 'rejected':
        return 'ไม่อนุมัติ';
      case 'pending':
        return 'รออนุมัติ';
      default:
        return status;
    }
  };

  return {
    isPrinting,
    printableContentRef,
    handlePrint,
    exportToCSV,
  };
}

export default useTripExport;
