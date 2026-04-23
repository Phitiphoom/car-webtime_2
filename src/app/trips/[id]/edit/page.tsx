/* -------------------------------------------------------------------------- */
/*  File: src/app/trips/[id]/edit/page.tsx                                    */
/*  คอมโพเนนต์แก้ไขข้อมูลการเดินทาง (Edit Trip)                             */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useState } from 'react';
import { useReferenceData } from '@/hooks/useReferenceData';
import { useEditTripForm } from '@/hooks/useEditTripForm';
import { AuthGuard } from '@/components/AuthGuard';
import { MainRoute } from '@/components/EditTrip/MainRoute';
import { AdditionalStops } from '@/components/EditTrip/AdditionalStops';
import { TripDetails } from '@/components/EditTrip/TripDetails';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Loader2,
  ChevronLeft,
  Calendar,
  Car,
  MapPin,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function EditTripPage() {
  /* ---------------------------------------------------------------------- */
  /*  โหลดข้อมูลอ้างอิง (แผนก, ยี่ห้อรถ ฯลฯ) และสถานะฟอร์ม               */
  /* ---------------------------------------------------------------------- */
  const ref = useReferenceData();
  const form = useEditTripForm();

  /* แท็บปัจจุบัน */
  const [activeTab, setActiveTab] = useState<'route' | 'vehicle' | 'details'>(
    'route'
  );

  /* สถานะเลือกคนขับ “อื่น ๆ” */
  const [isCustomDriver, setIsCustomDriver] = useState(false);
  const [customDriverName, setCustomDriverName] = useState('');

  /* ---------------------------------------------------------------------- */
  /*  Animation Variants สำหรับ Framer-motion                               */
  /* ---------------------------------------------------------------------- */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  /* ---------------------------------------------------------------------- */
  /*  แสดง Loader ระหว่างโหลดข้อมูล                                         */
  /* ---------------------------------------------------------------------- */
  if (form.loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        </div>
      </AuthGuard>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  แสดง Error เมื่อโหลดข้อมูลไม่สำเร็จ                                   */
  /* ---------------------------------------------------------------------- */
  if (form.error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* หัวข้อหน้า */}
          <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Link
                href="/dashboard"
                className="p-2 inline-flex items-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="ml-1">กลับ</span>
              </Link>
            </div>
          </header>

          {/* ข้อความแจ้งเตือน */}
          <main className="max-w-5xl mx-auto px-4 py-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <p className="text-red-600">{form.error}</p>
                <Button asChild className="mt-6 bg-blue-600 hover:bg-blue-700">
                  <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </AuthGuard>
    );
  }

  /* ---------------------------------------------------------------------- */
  /*  เมื่อกดบันทึก ถ้าเลือก “คนขับอื่น ๆ” ให้เพิ่มชื่อเข้าสู่รายการ        */
  /* ---------------------------------------------------------------------- */
  const handleSubmitWithDriver = (e: React.FormEvent) => {
    e.preventDefault();

    // หากเลือกคนขับเองและมีการกรอกชื่อ
    if (isCustomDriver && customDriverName.trim()) {
      // เคลียร์รายการคนขับเดิม
      while (form.drivers.length > 0) form.removeDriver(0);

      // เพิ่มคนขับใหม่
      form.addDriver();
      form.handleDriverChange(0, customDriverName.trim());
    }

    form.handleSubmit(e);
  };

  /* ---------------------------------------------------------------------- */
  /*  UI หลัก                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* --------------------------- Header ---------------------------- */}
        <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            {/* ปุ่มย้อนกลับ */}
            <div className="flex items-center gap-3">
              <Link
                href={`/trips/${form.originalTrip?.TID}`}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="ย้อนกลับไปหน้ารายละเอียดทริป"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              {/* ชื่อหน้า */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  แก้ไขทริป
                </h1>
                <p className="text-sm text-blue-200">
                  รหัสทริป: #{form.originalTrip?.TID}
                </p>
              </div>
            </div>

            {/* วันที่ปัจจุบัน */}
            <div className="hidden md:flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* ---------------------------- Body ----------------------------- */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* ------------ แจ้งเตือน Error หรือ Success ------------- */}
            {form.error && (
              <motion.div variants={itemVariants}>
                <Alert
                  variant="destructive"
                  className="border border-red-200 bg-red-50 dark:bg-red-900/20"
                >
                  <AlertTitle className="font-medium">
                    เกิดข้อผิดพลาด
                  </AlertTitle>
                  <AlertDescription>{form.error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {form.success && (
              <motion.div variants={itemVariants}>
                <Alert className="border border-green-200 bg-green-50 dark:bg-green-900/20">
                  <AlertTitle className="font-medium text-green-800 dark:text-green-300">
                    บันทึกเรียบร้อย
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {form.success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* -------------------- Card หลักของฟอร์ม ------------------- */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-md">
                {/* หัวข้อ Card */}
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                    ฟอร์มแก้ไขทริป
                  </CardTitle>
                  <CardDescription>
                    ปรับข้อมูลทริปที่ต้องการแก้ไข แล้วกด “บันทึก”
                  </CardDescription>
                </CardHeader>

                {/* เนื้อหา Card */}
                <CardContent className="p-0">
                  {/* ------------------- Tabs นำทาง -------------------- */}
                  <Tabs
                    defaultValue="route"
                    value={activeTab}
                    onValueChange={(v) =>
                      setActiveTab(v as 'route' | 'vehicle' | 'details')
                    }
                    className="w-full"
                  >
                    {/* แถบไอคอนแท็บ */}
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800">
                      <TabsList className="grid grid-cols-3 w-full bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                        <TabsTrigger
                          value="route"
                          className="flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4" />
                          <span className="hidden sm:inline">เส้นทาง</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="vehicle"
                          className="flex items-center gap-2"
                        >
                          <Car className="h-4 w-4" />
                          <span className="hidden sm:inline">ข้อมูลรถ</span>
                        </TabsTrigger>

                        <TabsTrigger
                          value="details"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline">รายละเอียด</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* ---------------------- Tab 1: Route --------------------- */}
                    <form onSubmit={handleSubmitWithDriver} className="p-6">
                      <TabsContent value="route" className="mt-0 space-y-6">
                        <div className="space-y-1 mb-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            ข้อมูลเส้นทาง
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            แก้ไขจุดเริ่มต้นและปลายทางของทริป
                          </p>
                        </div>

                        {/* จุดเริ่ม-ปลายทาง */}
                        <MainRoute
                          start={form.startPoint}
                          end={form.endPoint}
                          onChange={(field, value) =>
                            field === 'start'
                              ? form.setStartPoint(value)
                              : form.setEndPoint(value)
                          }
                        />

                        {/* จุดแวะเพิ่มเติม */}
                        <AdditionalStops
                          stops={form.additionalRoutes}
                          onAdd={form.addRoute}
                          onRemove={form.removeRoute}
                          onChange={form.handleRouteChange}
                        />

                        {/* ปุ่ม Next */}
                        <div className="flex justify-between pt-4">
                          <div />
                          <Button
                            type="button"
                            onClick={() => setActiveTab('vehicle')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            ถัดไป
                          </Button>
                        </div>
                      </TabsContent>

                      {/* ------------------- Tab 2: Vehicle -------------------- */}
                      <TabsContent value="vehicle" className="mt-0 space-y-6">
                        <div className="space-y-1 mb-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            ข้อมูลรถ
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            เลือกรถและกรอกรายละเอียดการใช้งาน
                          </p>
                        </div>

                        {/* ฟิลด์รายละเอียดรถ */}
                        <TripDetails
                          carBrand={form.carBrand}
                          setCarBrand={form.setCarBrand}
                          department={form.department}
                          setDepartment={form.setDepartment}
                          date={form.date}
                          setDate={form.setDate}
                          time={form.time}
                          setTime={form.setTime}
                          purpose={form.purpose}
                          setPurpose={form.setPurpose}
                          purposeText={form.purposeText}
                          setPurposeText={form.setPurposeText}
                          remarks={form.remarks}
                          setRemarks={form.setRemarks}
                          approverEmail={form.approverEmail}
                          setApproverEmail={form.setApproverEmail}
                          carBrands={ref.carBrands}
                          departments={ref.departments}
                          options={[
                            'ประชุมธุรกิจ',
                            'เยี่ยมลูกค้า',
                            'ตรวจไซต์งาน',
                            'จัดส่งสินค้า',
                            'ส่วนตัว',
                            'อื่น ๆ',
                          ]}
                          approverEmails={ref.approverEmails}
                        />

                        {/* ปุ่ม Back / Next */}
                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('route')}
                          >
                            ย้อนกลับ
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            ถัดไป
                          </Button>
                        </div>
                      </TabsContent>

                      {/* ------------------- Tab 3: Details -------------------- */}
                      <TabsContent value="details" className="mt-0 space-y-6">
                        <div className="space-y-1 mb-4">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            รายละเอียดเพิ่มเติม
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            แก้ไขคนขับและตรวจสอบข้อมูลก่อนบันทึก
                          </p>
                        </div>

                        {/* ---------- เลือกคนขับ ---------- */}
                        <Card>
                          <CardHeader>
                            <CardTitle>คนขับ</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* แสดงคนขับปัจจุบัน */}
                            {form.drivers.length > 0 && (
                              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800">
                                <p className="text-blue-800 dark:text-blue-300 mb-2 font-medium">
                                  คนขับปัจจุบัน:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                  {form.drivers.map((d, i) => (
                                    <li
                                      key={i}
                                      className="text-blue-700 dark:text-blue-200"
                                    >
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* ตัวเลือกคนขับ “อื่น ๆ” */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="other-driver-option"
                                  checked={isCustomDriver}
                                  onChange={(e) => {
                                    setIsCustomDriver(e.target.checked);
                                    if (!e.target.checked)
                                      setCustomDriverName('');
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label
                                  htmlFor="other-driver-option"
                                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  อื่น ๆ (ระบุชื่อคนขับ)
                                </label>
                              </div>

                              {isCustomDriver && (
                                <div className="mt-2">
                                  <label
                                    htmlFor="custom-driver-name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                  >
                                    ชื่อคนขับ *
                                  </label>
                                  <input
                                    id="custom-driver-name"
                                    value={customDriverName}
                                    onChange={(e) =>
                                      setCustomDriverName(e.target.value)
                                    }
                                    placeholder="กรอกชื่อคนขับ"
                                    required={isCustomDriver}
                                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  />
                                </div>
                              )}

                              {isCustomDriver && customDriverName && (
                                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800 mt-2">
                                  <p className="text-sm text-blue-800 dark:text-blue-300">
                                    คุณได้ระบุชื่อคนขับ &quot;{customDriverName}
                                    &quot;
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* ปุ่ม Back / Save */}
                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('vehicle')}
                          >
                            ย้อนกลับ
                          </Button>
                          <Button
                            type="submit"
                            disabled={form.submitting}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {form.submitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                              </>
                            ) : (
                              'บันทึกการแก้ไข'
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    </form>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* ------------------- แถบแสดง Progress ------------------- */}

            {/* ------------------- แถบแสดง Progress ------------------- */}
            <motion.div variants={itemVariants} className="hidden md:block">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* จุดหมายเลขขั้นตอน */}
                  <div className="flex items-center w-full max-w-3xl">
                    {/* Step 1 */}
                    <div
                      className={`flex items-center justify-center size-8 rounded-full ${
                        activeTab === 'route'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      1
                    </div>
                    <div
                      className={`w-16 sm:w-24 h-1 ${
                        ['route', 'vehicle', 'details'].includes(activeTab)
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />

                    {/* Step 2 */}
                    <div
                      className={`flex items-center justify-center size-8 rounded-full ${
                        ['vehicle', 'details'].includes(activeTab)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      2
                    </div>
                    <div
                      className={`w-16 sm:w-24 h-1 ${
                        ['vehicle', 'details'].includes(activeTab)
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />

                    {/* Step 3 */}
                    <div
                      className={`flex items-center justify-center size-8 rounded-full ${
                        activeTab === 'details'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      3
                    </div>
                  </div>

                  {/* ข้อความสรุปขั้นตอน */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ขั้นตอน{' '}
                    {activeTab === 'route'
                      ? '1'
                      : activeTab === 'vehicle'
                        ? '2'
                        : '3'}{' '}
                    จาก 3
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  );
}
