/* -------------------------------------------------------------------------- */
/*  File: src/components/TripHistory.tsx                                      */
/*  หน้าประวัติการใช้รถ                                                      */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useState } from 'react';
import { useTrips } from '@/hooks/useTrips';
import { useTripFilters } from '@/hooks/useTripFilters';
import { useTripExport } from '@/hooks/useTripExport';
import { PaginationControls } from '@/components/PaginationControls';
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

/* คอมโพเนนต์ย่อย */
import FilterForm from './TripHistory/FilterForm';
import TripTable from './TripHistory/TripTable';
import ToolbarHeader from './TripHistory/Toolbar';

export const TripHistory: React.FC = () => {
  /* ดึงข้อมูลทริปจากเซิร์ฟเวอร์ --------------------------------------- */
  const {
    trips,
    loading,
    error,
    fetchTrips,
    pagination,
    goToPage,
    changeLimit,
  } = useTrips();

  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ฮุกจัดการฟิลเตอร์ -------------------------------------------------- */
  const filters = useTripFilters({
    trips,
    onApplyFilters: (filterParams) =>
      fetchTrips(filterParams, { page: 1, limit: pagination.limit }),
  });

  /* ฮุกส่งออก / พิมพ์ --------------------------------------------------- */
  const export1 = useTripExport(trips);

  /* รีเฟรชข้อมูล ------------------------------------------------------- */
  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchTrips();
    setIsRefreshing(false);
  };

  /* ------------------------------- Loading / Error UI ------------------ */
  if (loading && !isRefreshing)
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-12 rounded-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </CardContent>
      </Card>
    );

  if (error)
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <CardContent className="py-12 text-center space-y-4">
          <CardTitle className="text-xl text-red-600 dark:text-red-400">
            ไม่สามารถโหลดข้อมูลทริป
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            {error}
          </CardDescription>
          <Button
            onClick={() => fetchTrips()}
            className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 rounded-md"
          >
            ลองใหม่
          </Button>
        </CardContent>
      </Card>
    );

  /* ------------------------------- Main UI ----------------------------- */
  return (
    <div className="space-y-8">
      {/* ทูลบาร์ด้านบน */}
      <ToolbarHeader
        isRefreshing={isRefreshing}
        isPrinting={export1.isPrinting}
        onRefresh={refreshData}
        onPrint={export1.handlePrint}
        onExport={export1.exportToCSV}
      />

      {/* ฟอร์มตัวกรอง */}
      <FilterForm
        searchTerm={filters.searchTerm}
        setSearchTerm={filters.setSearchTerm}
        carBrandFilter={filters.carBrandFilter}
        setCarBrandFilter={filters.setCarBrandFilter}
        statusFilter={filters.statusFilter}
        setStatusFilter={filters.setStatusFilter}
        startDateFilter={filters.startDateFilter}
        setStartDateFilter={filters.setStartDateFilter}
        endDateFilter={filters.endDateFilter}
        setEndDateFilter={filters.setEndDateFilter}
        departmentFilter={filters.departmentFilter}
        setDepartmentFilter={filters.setDepartmentFilter}
        onApplyFilters={filters.applyServerFilters}
        onClearFilters={filters.clearFilters}
        uniqueCarBrands={filters.uniqueCarBrands}
        uniqueDepartments={filters.uniqueDepartments}
      />

      {/* ตาราง */}
      <div ref={export1.printableContentRef}>
        <TripTable trips={filters.displayedTrips} isRefreshing={isRefreshing} />
      </div>

      {/* คอนโทรลแบ่งหน้า */}
      {pagination.totalPages > 1 && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <PaginationControls
              pagination={pagination}
              onPageChange={goToPage}
              onLimitChange={changeLimit}
              showLimitSelector
              limitOptions={[10, 25, 50, 100]}
            />
          </CardContent>
        </Card>
      )}

      {/* CSS สำหรับแอนิเมชันและโหมดพิมพ์ */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TripHistory;
