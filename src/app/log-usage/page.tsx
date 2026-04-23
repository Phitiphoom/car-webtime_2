'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Car,
  MapPin,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

import { AuthGuard } from '@/components/AuthGuard';
import { useLogUsageForm } from '@/hooks/useLogUsageForm';
import { useReferenceData } from '@/hooks/useReferenceData';
import { MainRoute } from '@/components/LogUsage/MainRoute';
import { AdditionalStops } from '@/components/LogUsage/AdditionalStops';
import { TripDetails } from '@/components/LogUsage/TripDetails';
import { RecordedBy } from '@/components/LogUsage/RecordedBy';
import { FormActions } from '@/components/LogUsage/FormActions';
import { DriverCombobox } from '@/components/ui/DriverCombobox';
import { Input } from '@/components/ui/input';

export default function LogUsagePage() {
  const ref = useReferenceData();
  const form = useLogUsageForm();
  const [activeTab, setActiveTab] = useState<
    'route' | 'vehicle' | 'drivers' | 'details'
  >('route');

  // ─── Validation แต่ละ Step ───────────────────────────────────────────────
  const isRouteStepValid =
    form.mainRoute.start.trim() !== '' &&
    form.mainRoute.end.trim() !== '' &&
    form.additionalStops.every(
      (stop) => stop.start.trim() !== '' && stop.end.trim() !== ''
    );

  // หลังแก้: ไม่บังคับผู้อนุมัติเพิ่มเติม
  const isVehicleStepValid =
  !!form.details.carBrand &&
  !!form.details.date &&
  !!form.details.department &&
  // ถ้าเลือก "อื่น ๆ" ต้องกรอก purposeText ด้วย
  (form.details.purpose !== 'อื่น ๆ' || form.details.purposeText.trim() !== '');

  const isDriversStepValid = form.useCustomDriver
    ? form.details.otherDriverName.trim() !== ''
    : form.details.driverId.trim() !== '';

  // ─── รูปแบบแอนิเมชัน (Framer Motion) ─────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* หน้า Header */}
        <header className="bg-gradient-to-r from-blue-300 via-blue-400 to-indigo-300 text-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="ย้อนกลับไปแดชบอร์ด"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  บันทึกการใช้งานรถ
                </h1>
                <p className="text-sm text-black-500">
                  กรอกข้อมูลรายละเอียดการเดินทางเพื่อขออนุมัติ
                </p>
              </div>
            </div>
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

        {/* เนื้อหาหลัก */}
        <main className="max-w-5xl mx-auto px-4 py-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Alert Error */}
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
            {/* Alert Success */}
            {form.success && (
              <motion.div variants={itemVariants}>
                <Alert className="border border-green-200 bg-green-50 dark:bg-green-900/20">
                  <AlertTitle className="font-medium text-green-800 dark:text-green-300">
                    บันทึกสำเร็จ
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    ระบบบันทึกการใช้งานรถเรียบร้อย กำลังนำคุณกลับไปยังแดชบอร์ด…
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Card Form */}
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-md">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                    แบบฟอร์มบันทึกการใช้งานรถ
                  </CardTitle>
                  <CardDescription>
                    กรอกแบบฟอร์มด้านล่างเพื่อบันทึกและขออนุมัติการใช้งานรถ
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs
                    defaultValue="route"
                    value={activeTab}
                    onValueChange={(val) =>
                      setActiveTab(val as typeof activeTab)
                    }
                    className="w-full"
                  >
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800">
                      <TabsList className="grid grid-cols-4 w-full bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
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
                          value="drivers"
                          className="flex items-center gap-2"
                        >
                          <Users className="h-4 w-4" />
                          <span className="hidden sm:inline">คนขับ</span>
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

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                      }}
                      className="p-6"
                    >
                      {/* ── แท็บ 1: เส้นทาง ───────────────────────── */}
                      <TabsContent value="route" className="mt-0 space-y-6">
                        <MainRoute
                          start={form.mainRoute.start}
                          end={form.mainRoute.end}
                          onChange={(field, val) =>
                            form.setMainRoute((prev) => ({
                              ...prev,
                              [field]: val,
                            }))
                          }
                        />
                        <AdditionalStops
                          stops={form.additionalStops}
                          onAdd={form.addStop}
                          onRemove={form.removeStop}
                          onChange={form.updateStop}
                        />
                        <div className="flex justify-between pt-4">
                          <div />
                          <Button
                            type="button"
                            onClick={() => setActiveTab('vehicle')}
                            disabled={!isRouteStepValid}
                            className={`bg-blue-600 hover:bg-blue-700 ${
                              !isRouteStepValid
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            ถัดไป
                          </Button>
                        </div>
                      </TabsContent>

                      {/* ── แท็บ 2: ข้อมูลรถ ──────────────────────── */}
                      <TabsContent value="vehicle" className="mt-0 space-y-6">
                        <TripDetails
                          details={form.details}
                          onChange={(f, v) =>
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            form.updateDetailsField(f as any, v)
                          }
                          purposeOptions={[
                            'ประชุมธุรกิจ',
                            'รับ-ส่ง ลูกค้า',
                            'ตรวจสอบหน้างาน',
                            'ส่งของ',
                            'ส่วนตัว',
                            'อื่น ๆ',
                          ]}
                          approverEmails={ref.approverEmails}
                          approvers={form.approvers}
                          onApproverChange={form.updateApprovers}
                          carBrands={ref.carBrands}
                        />
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
                            onClick={() => setActiveTab('drivers')}
                            disabled={!isVehicleStepValid}
                            className={`bg-blue-600 hover:bg-blue-700 ${
                              !isVehicleStepValid
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            ถัดไป
                          </Button>
                        </div>
                      </TabsContent>

                      {/* ── แท็บ 3: คนขับ ─────────────────────────── */}
                      <TabsContent value="drivers" className="mt-0 space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>คนขับ</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="flex flex-col space-y-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={!form.useCustomDriver}
                                  onChange={(e) =>
                                    form.setUseCustomDriver(!e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  เลือกคนขับจากรายชื่อ
                                </span>
                              </label>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={form.useCustomDriver}
                                  onChange={(e) =>
                                    form.setUseCustomDriver(e.target.checked)
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  ระบุคนขับอื่นๆ
                                </span>
                              </label>
                            </div>

                            {form.useCustomDriver ? (
                              <div className="space-y-2">
                                <label
                                  htmlFor="other-driver-name"
                                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  ชื่อคนขับ *
                                </label>
                                <Input
                                  id="other-driver-name"
                                  value={form.details.otherDriverName}
                                  onChange={(e) =>
                                    form.updateDetailsField(
                                      'otherDriverName',
                                      e.target.value
                                    )
                                  }
                                  placeholder="กรอกชื่อคนขับ"
                                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                                {!form.details.otherDriverName.trim() && (
                                  <p className="text-xs text-red-500 mt-1">
                                    กรุณากรอกชื่อคนขับ
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                  เลือกคนขับ
                                </h3>
                                <DriverCombobox
                                  value={form.details.driverId}
                                  onChange={(value) =>
                                    form.updateDetailsField('driverId', value)
                                  }
                                />
                              </div>
                            )}

                            {(form.useCustomDriver &&
                              form.details.otherDriverName) ||
                            (!form.useCustomDriver && form.details.driverId) ? (
                              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                  คุณได้เลือกคนขับเรียบร้อยแล้ว
                                  {form.useCustomDriver
                                    ? ` คือ "${form.details.otherDriverName}"`
                                    : ''}
                                </p>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>
                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('vehicle')}
                          >
                            ย้อนกลับ
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            disabled={!isDriversStepValid}
                            className={`bg-blue-600 hover:bg-blue-700 ${
                              !isDriversStepValid
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            ถัดไป
                          </Button>
                        </div>
                      </TabsContent>

                      {/* ── แท็บ 4: รายละเอียดเพิ่มเติม ─────────────────── */}
                      <TabsContent value="details" className="mt-0 space-y-6">
                        <RecordedBy user={form.user} />
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                          <CardHeader>
                            <CardTitle className="text-blue-900 dark:text-blue-300">
                              สรุปข้อมูลการเดินทาง
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4 text-blue-800 dark:text-blue-200">
                            {/* สรุปข้อมูลหลัก */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium">เส้นทางหลัก:</p>
                                <p className="text-sm">
                                  {form.mainRoute.start} → {form.mainRoute.end}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">รถที่ใช้:</p>
                                <p className="text-sm">
                                  {form.details.carBrand || '-'}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">วันที่/เวลา:</p>
                                <p className="text-sm">
                                  {form.details.date}{' '}
                                  {form.details.time
                                    ? `เวลา ${form.details.time}`
                                    : ''}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium">แผนก:</p>
                                <p className="text-sm">
                                  {form.details.department || '-'}
                                </p>
                              </div>
                            </div>
                            {/* จุดแวะเพิ่มเติม */}
                            {form.additionalStops.length > 0 && (
                              <div>
                                <p className="font-medium">
                                  จุดแวะเพิ่มเติม ({form.additionalStops.length}
                                  ):
                                </p>
                                <ul className="text-sm list-disc pl-5">
                                  {form.additionalStops.map((stop, idx) => (
                                    <li key={idx}>
                                      {stop.start} → {stop.end}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {/* คนขับ */}
                            {form.useCustomDriver &&
                            form.details.otherDriverName ? (
                              <div>
                                <p className="font-medium">คนขับ:</p>
                                <p className="text-sm">
                                  {form.details.otherDriverName}
                                </p>
                              </div>
                            ) : form.drivers.filter((d) => d.trim()).length >
                              0 ? (
                              <div>
                                <p className="font-medium">คนขับ:</p>
                                <ul className="text-sm list-disc pl-5">
                                  {form.drivers
                                    .filter((d) => d.trim())
                                    .map((driver, idx) => (
                                      <li key={idx}>{driver}</li>
                                    ))}
                                </ul>
                              </div>
                            ) : null}
                          </CardContent>
                        </Card>

                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab('drivers')}
                          >
                            ย้อนกลับ
                          </Button>
                          <FormActions loading={form.loading} />
                        </div>
                      </TabsContent>
                    </form>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* ขั้นตอนแสดงด้านขวา (Desktop) */}
            <motion.div variants={itemVariants} className="hidden md:block">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-4">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    {['route', 'vehicle', 'drivers', 'details'].map(
                      (step, i) => (
                        <React.Fragment key={step}>
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              [
                                'route',
                                'vehicle',
                                'drivers',
                                'details',
                              ].indexOf(activeTab) >= i
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {i + 1}
                          </div>
                          {i < 3 && (
                            <div
                              className={`w-12 h-1 ${
                                [
                                  'route',
                                  'vehicle',
                                  'drivers',
                                  'details',
                                ].indexOf(activeTab) > i
                                  ? 'bg-blue-600'
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      )
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ขั้นตอน{' '}
                    {['route', 'vehicle', 'drivers', 'details'].indexOf(
                      activeTab
                    ) + 1}{' '}
                    จาก 4
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
