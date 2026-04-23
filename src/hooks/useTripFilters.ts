'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trip, TripFilters } from '@/types/trip';
import { fetchWithAuth } from '@/lib/api';

interface UseTripFiltersProps {
  trips: Trip[];
  onApplyFilters: (filters: TripFilters) => void;
}

export function useTripFilters({ trips, onApplyFilters }: UseTripFiltersProps) {
  // สถานะสำหรับการค้นหา
  const [searchTerm, setSearchTerm] = useState('');

  // สถานะฟิลเตอร์
  const [carBrandFilter, setCarBrandFilter] = useState('all_vehicles');
  const [statusFilter, setStatusFilter] = useState('all_status');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all_departments');

  // Refs สำหรับตัวเลือกฟิลเตอร์
  const [uniqueCarBrands, setUniqueCarBrands] = useState<string[]>([]);
  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);

  // สถานะการกรอง
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // ดึงข้อมูลตัวเลือกฟิลเตอร์
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [brandsData, deptsData] = await Promise.all([
          fetchWithAuth('/api/car-brands'),
          fetchWithAuth('/api/departments'),
        ]);

        setUniqueCarBrands(Array.isArray(brandsData) ? brandsData : []);
        setUniqueDepartments(Array.isArray(deptsData) ? deptsData : []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchOptions();
  }, []);

  // กรองข้อมูลตาม searchTerm
  useEffect(() => {
    if (!trips || !Array.isArray(trips)) {
      setFilteredTrips([]);
      setIsFiltering(false);
      return;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = trips.filter((trip) =>
        [
          trip.START_POINT,
          trip.END_POINT,
          trip.PURPOSE,
          trip.CARBARND,
          trip.RECORD_BY,
          trip.DEPARTMENT,
        ]
          .map((val) => val?.toString().toLowerCase() || '')
          .some((val) => val.includes(term))
      );

      setFilteredTrips(filtered);
      setIsFiltering(true);
    } else {
      setFilteredTrips(trips);
      setIsFiltering(false);
    }
  }, [trips, searchTerm]);

  // คำนวณข้อมูลที่จะแสดง
  const displayedTrips = useMemo(() => {
    return isFiltering ? filteredTrips : trips;
  }, [trips, filteredTrips, isFiltering]);

  // ฟังก์ชันส่งฟิลเตอร์ไปยัง API
  const applyServerFilters = () => {
    const filters: TripFilters = {
      search: searchTerm || '',
    };

    // เพิ่มฟิลเตอร์ตามเงื่อนไข
    if (carBrandFilter !== 'all_vehicles') {
      filters.carBrand = carBrandFilter;
    }

    if (statusFilter !== 'all_status') {
      filters.status = statusFilter;
    }

    if (startDateFilter) {
      filters.startDate = startDateFilter;
    }

    if (endDateFilter) {
      filters.endDate = endDateFilter;
    }

    if (departmentFilter !== 'all_departments') {
      filters.department = departmentFilter;
    }

    // เรียกฟังก์ชันส่งฟิลเตอร์
    onApplyFilters(filters);
  };

  // ฟังก์ชันล้างฟิลเตอร์
  const clearFilters = () => {
    setCarBrandFilter('all_vehicles');
    setStatusFilter('all_status');
    setStartDateFilter('');
    setEndDateFilter('');
    setDepartmentFilter('all_departments');
    setSearchTerm('');

    // ส่งฟิลเตอร์ว่างกลับไป
    onApplyFilters({ search: '' });
  };

  // คืนค่าสถานะและฟังก์ชันต่างๆ
  return {
    // สถานะฟิลเตอร์
    searchTerm,
    carBrandFilter,
    statusFilter,
    startDateFilter,
    endDateFilter,
    departmentFilter,
    filteredTrips,
    isFiltering,
    uniqueCarBrands,
    uniqueDepartments,
    displayedTrips,

    // Setters สำหรับอัปเดตค่าฟิลเตอร์
    setSearchTerm,
    setCarBrandFilter,
    setStatusFilter,
    setStartDateFilter,
    setEndDateFilter,
    setDepartmentFilter,

    // ฟังก์ชันสำหรับใช้งานฟิลเตอร์
    applyServerFilters,
    clearFilters,
  };
}

export default useTripFilters;
