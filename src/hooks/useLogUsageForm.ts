// src/hooks/useLogUsageForm.ts
'use client';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrips } from '@/hooks/useTrips';
import { useRouter } from 'next/navigation';

interface Route {
  start: string;
  end: string;
}

interface Details {
  carBrand: string;
  carId: string;
  driverId: string;
  department: string;
  date: string;
  time: string;
  purpose: string;
  purposeText: string;
  remarks: string;
  otherDriverName: string;
}

interface Approvers {
  primary: string;
  additional: string[];
}

export function useLogUsageForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { createTrip } = useTrips();

  // เส้นทางหลัก
  const [mainRoute, setMainRoute] = useState<Route>({ start: '', end: '' });

  // จุดแวะเพิ่มเติม - รองรับหลายรายการ
  const [additionalStops, setAdditionalStops] = useState<Route[]>([]);

  // รายละเอียดทริป
  const [details, setDetails] = useState<Details>({
    carId: '',
    driverId: '',
    carBrand: '',
    department: user?.department || '',
    date: new Date().toISOString().split('T')[0], // วันปัจจุบัน
    time: '',
    purpose: '',
    purposeText: '',
    remarks: '',
    otherDriverName: '',
  });

  // รายชื่อคนขับ - รองรับหลายคน
  const [drivers, setDrivers] = useState<string[]>(['']);
  
  // สถานะการเลือกคนขับแบบระบุเอง
  const [useCustomDriver, setUseCustomDriver] = useState(false);

  // ผู้อนุมัติหลักและเพิ่มเติม
  const [approvers, setApprovers] = useState<Approvers>({
    primary: '',
    additional: [],
  });

  // สถานะการทำงาน
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ฟังก์ชันจัดการจุดแวะเพิ่มเติม
  const addStop = () => {
    setAdditionalStops([...additionalStops, { start: '', end: '' }]);
  };

  const removeStop = (idx: number) => {
    setAdditionalStops(additionalStops.filter((_, i) => i !== idx));
  };

  const updateStop = (idx: number, field: 'start' | 'end', value: string) => {
    const newStops = [...additionalStops];
    newStops[idx] = { ...newStops[idx], [field]: value };
    setAdditionalStops(newStops);
  };

  // ฟังก์ชันจัดการคนขับ
  const addDriver = () => {
    setDrivers([...drivers, '']);
  };

  const removeDriver = (idx: number) => {
    if (drivers.length <= 1) return; // ต้องมีคนขับอย่างน้อย 1 คน
    setDrivers(drivers.filter((_, i) => i !== idx));
  };

  const handleDriverChange = (idx: number, value: string) => {
    const newDrivers = [...drivers];
    newDrivers[idx] = value;
    setDrivers(newDrivers);
  };

  // ฟังก์ชันอัปเดตรายละเอียด
  const updateDetailsField = <K extends keyof Details>(
    field: K,
    value: Details[K]
  ) => {
    setDetails((d) => ({ ...d, [field]: value }));
  };

  // ฟังก์ชันอัปเดตผู้อนุมัติ
  const updateApprovers = (primary: string, additional: string[]) => {
    setApprovers({ primary, additional });
  };

  // ฟังก์ชันรีเซ็ตฟอร์ม
  const resetForm = () => {
    setMainRoute({ start: '', end: '' });
    setAdditionalStops([]);
    setDetails({
      carId: '',
      driverId: '',
      carBrand: '',
      department: user?.department ?? '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      purpose: '',
      purposeText: '',
      remarks: '',
      otherDriverName: '',
    });
    setDrivers(['']);
    setUseCustomDriver(false);
    setApprovers({ primary: '', additional: [] });
    setError(null);
    setSuccess(false);
  };

  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    // Validate ข้อมูลที่จำเป็น
    const missing = [];
    if (!mainRoute.start) missing.push('จุดเริ่มต้น');
    if (!mainRoute.end) missing.push('จุดสุดท้าย');
    if (!details.carBrand) missing.push('รถที่ใช้');

    if (!details.date) missing.push('วันที่');
    if (!details.department) missing.push('แผนก');
    
    // ตรวจสอบคนขับ
    if (useCustomDriver && !details.otherDriverName) {
      missing.push('ชื่อคนขับ');
    } else if (!useCustomDriver && !details.driverId) {
      missing.push('คนขับ');
    }
    
    // ตรวจสอบวัตถุประสงค์
    if (details.purpose === 'อื่น ๆ' && !details.purposeText) {
      missing.push('รายละเอียดวัตถุประสงค์');
    }
    
    if (missing.length) {
      setError(`กรุณากรอกข้อมูลที่จำเป็น: ${missing.join(', ')}`);
      return;
    }

    // ตรวจสอบความถูกต้องของจุดแวะเพิ่มเติม
    const invalidStops = additionalStops.filter(
      (stop) => !stop.start || !stop.end
    );
    if (invalidStops.length > 0) {
      setError(`กรุณากรอกข้อมูลจุดแวะเพิ่มเติมให้ครบทุกช่อง`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        START_POINT: mainRoute.start,
        END_POINT: mainRoute.end,
        CARBARND: details.carBrand,
        DATE: new Date(details.date),
        TIME: details.time ? new Date(`1970-01-01T${details.time}:00`) : null,
        PURPOSE: details.purpose,
        PURPOSE_TEXT: details.purpose === 'อื่น ๆ' ? details.purposeText : '',
        REMARK: details.remarks,
        DEPARTMENT: details.department,
        RECORD_BY: user?.id,
        Approve_Email: approvers.primary,

        // สร้าง items จากจุดแวะเพิ่มเติมทั้งหมด
        items: additionalStops
          .filter((s) => s.start && s.end)
          .map((s, i) => ({
            ITEM_ID: i + 1,
            START_POINT: s.start,
            END_POINT: s.end,
          })),

        // สร้าง drivers ตามประเภทคนขับที่เลือก
        drivers: useCustomDriver 
          ? [{ DriverID: 1, DRIVER_NAME: details.otherDriverName }]
          : drivers
              .filter((d) => d.trim())
              .map((d, i) => ({ DriverID: i + 1, DRIVER_NAME: d })),
      };

      // ส่งข้อมูลผู้อนุมัติเพิ่มเติม (ถ้ามี)
      if (approvers.additional.length > 0) {
        // เพิ่มข้อมูลผู้อนุมัติเพิ่มเติมที่นี่
        // ในอนาคตอาจจะต้องสร้างตาราง trip_approvers เพิ่ม
        console.log('Additional approvers:', approvers.additional);
      }

      const result = await createTrip(payload);
      if (!result) throw new Error('บันทึกทริปไม่สำเร็จ');

      setSuccess(true);
      resetForm();
      setTimeout(() => router.push('/dashboard'), 1500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'การบันทึกล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return {
    mainRoute,
    setMainRoute,
    additionalStops,
    addStop,
    removeStop,
    updateStop,
    details,
    user,
    updateDetailsField,
    drivers,
    addDriver,
    removeDriver,
    handleDriverChange,
    useCustomDriver,
    setUseCustomDriver,
    approvers,
    updateApprovers,
    loading,
    error,
    success,
    handleSubmit,
  };
}