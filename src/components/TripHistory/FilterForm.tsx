/* -------------------------------------------------------------------------- */
/*  File: src/components/FilterForm.tsx                                       */
/*  ฟอร์มตัวกรองทริป - รุ่นใหม่                                               */
/* -------------------------------------------------------------------------- */
'use client';

import React, { FormEvent, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Filter,
  Search,
  X,
  ChevronDown,
  Car,
  Users,
  CheckCircle,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface FilterFormProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  carBrandFilter: string;
  setCarBrandFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  startDateFilter: string;
  setStartDateFilter: (value: string) => void;
  endDateFilter: string;
  setEndDateFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  uniqueCarBrands: string[];
  uniqueDepartments: string[];
}

export const FilterForm: React.FC<FilterFormProps> = ({
  searchTerm,
  setSearchTerm,
  carBrandFilter,
  setCarBrandFilter,
  statusFilter,
  setStatusFilter,
  startDateFilter,
  setStartDateFilter,
  endDateFilter,
  setEndDateFilter,
  departmentFilter,
  setDepartmentFilter,
  onApplyFilters,
  onClearFilters,
  uniqueCarBrands,
  uniqueDepartments,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation variants
  const variants: Variants = {
    hidden: {
      opacity: 0,
      height: 0,
    },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        type: 'tween' as const,
        ease: 'easeInOut',
      },
    },
  };

  // Render filter tags
  const renderActiveTags = () => {
    const tags = [];

    if (carBrandFilter !== 'all_vehicles') {
      tags.push({
        label: `รถ: ${carBrandFilter}`,
        icon: <Car className="mr-1 h-4 w-4" />,
        onRemove: () => setCarBrandFilter('all_vehicles'),
      });
    }

    if (statusFilter !== 'all_status') {
      tags.push({
        label: `สถานะ: ${statusFilter}`,
        icon: <CheckCircle className="mr-1 h-4 w-4" />,
        onRemove: () => setStatusFilter('all_status'),
      });
    }

    if (departmentFilter !== 'all_departments') {
      tags.push({
        label: `แผนก: ${departmentFilter}`,
        icon: <Users className="mr-1 h-4 w-4" />,
        onRemove: () => setDepartmentFilter('all_departments'),
      });
    }

    return tags.map((tag, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-full text-xs mr-2 mb-2 hover:bg-primary/15 cursor-pointer"
        onClick={tag.onRemove}
      >
        {tag.icon}
        {tag.label}
        <X className="ml-1 h-3 w-3" />
      </motion.div>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-foreground">ตัวกรอง</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="mr-2 h-4 w-4" /> ล้างทั้งหมด
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground"
          >
            <Filter className="mr-2 h-4 w-4" />
            ตัวกรอง
            <ChevronDown
              className={`ml-2 h-4 w-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>
      </div>

      {/* Active Filter Tags */}
      {renderActiveTags().length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center mb-4"
        >
          {renderActiveTags()}
        </motion.div>
      )}

      {/* Expandable Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.form
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              onApplyFilters();
              setIsExpanded(false);
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Search Input */}
            <div className="relative md:col-span-full">
              <Input
                placeholder="ค้นหาทริป…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>

            {/* Car Brand Combobox */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <Car className="mr-2 h-4 w-4" />
                  {carBrandFilter === 'all_vehicles'
                    ? 'ทุกยี่ห้อรถ'
                    : carBrandFilter}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="ค้นหายี่ห้อรถ" />
                  <CommandList>
                    <CommandEmpty>ไม่พบยี่ห้อรถ</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all_vehicles"
                        onSelect={() => setCarBrandFilter('all_vehicles')}
                      >
                        ทุกยี่ห้อรถ
                      </CommandItem>
                      {uniqueCarBrands.map((brand) => (
                        <CommandItem
                          key={brand}
                          value={brand}
                          onSelect={() => setCarBrandFilter(brand)}
                        >
                          {brand}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Status */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {statusFilter === 'all_status' ? 'ทุกสถานะ' : statusFilter}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      <CommandItem
                        value="all_status"
                        onSelect={() => setStatusFilter('all_status')}
                      >
                        ทุกสถานะ
                      </CommandItem>
                      <CommandItem
                        value="Approve"
                        onSelect={() => setStatusFilter('Approve')}
                      >
                        อนุมัติแล้ว
                      </CommandItem>
                      <CommandItem
                        value="Pending"
                        onSelect={() => setStatusFilter('Pending')}
                      >
                        รออนุมัติ
                      </CommandItem>
                      <CommandItem
                        value="Rejected"
                        onSelect={() => setStatusFilter('Rejected')}
                      >
                        ถูกปฏิเสธ
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Department */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between">
                  <Users className="mr-2 h-4 w-4" />
                  {departmentFilter === 'all_departments'
                    ? 'ทุกแผนก'
                    : departmentFilter}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Command>
                  <CommandInput placeholder="ค้นหาแผนก" />
                  <CommandList>
                    <CommandEmpty>ไม่พบแผนก</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all_departments"
                        onSelect={() => setDepartmentFilter('all_departments')}
                      >
                        ทุกแผนก
                      </CommandItem>
                      {uniqueDepartments.map((dept) => (
                        <CommandItem
                          key={dept}
                          value={dept}
                          onSelect={() => setDepartmentFilter(dept)}
                        >
                          {dept}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1 text-muted-foreground">
                  วันที่เริ่มต้น
                </label>
                <Input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className=""
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-muted-foreground">
                  วันที่สิ้นสุด
                </label>
                <Input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className=""
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="col-span-full flex justify-end">
              <Button type="submit" className="">
                <Filter className="mr-2 h-4 w-4" />
                ใช้ตัวกรอง
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FilterForm;
