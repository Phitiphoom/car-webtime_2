'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DetailsProps {
  details: {
    carBrand: string;
    department: string;
    date: string;
    time: string;
    purpose: string;
    purposeText: string;
    remarks: string;
  };
  onChange: (field: string, value: string) => void;
  carBrands: string[];
  purposeOptions: string[];
  approverEmails: { id: string; email: string; name: string }[];
  approvers: { primary: string; additional: string[] };
  onApproverChange: (primary: string, additional: string[]) => void;
}

export function TripDetails({
  details,
  onChange,
  carBrands,
  purposeOptions,
  approverEmails,
  approvers,
  onApproverChange,
}: DetailsProps) {
  // Toggle additional approver selection
  const toggleAdditional = (email: string) => {
    const chosen = approvers.additional.includes(email);
    const next = chosen ? approvers.additional.filter(e => e !== email) : [...approvers.additional, email];
    if (!approvers.primary && !chosen) {
      onApproverChange(email, next);
    } else {
      onApproverChange(approvers.primary, next);
    }
  };
  const setPrimary = (email: string) => onApproverChange(email, approvers.additional);
  const findName = (email: string) => approverEmails.find(a => a.email === email)?.name || email;

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายละเอียดทริป</CardTitle>
        <CardDescription>จัดการข้อมูลการเดินทางและการอนุมัติ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trip Information Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">ข้อมูลการเดินทาง</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>รถที่ใช้ *</Label>
              <Select value={details.carBrand} onValueChange={v => onChange('carBrand', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรถ…" />
                </SelectTrigger>
                <SelectContent>
                  {carBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>แผนก *</Label>
              <Input
                placeholder="กรอกชื่อแผนก"
                value={details.department}
                onChange={e => onChange('department', e.target.value)}
              />
            </div>
            <div>
              <Label>วันที่ *</Label>
              <Input type="date" value={details.date} onChange={e => onChange('date', e.target.value)} />
            </div>
            <div>
              <Label>เวลา</Label>
              <Input type="time" value={details.time} onChange={e => onChange('time', e.target.value)} />
            </div>
          </div>
        </div>

        <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />

        {/* Purpose Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">วัตถุประสงค์</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>เลือกวัตถุประสงค์</Label>
              <Select value={details.purpose} onValueChange={v => onChange('purpose', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก…" />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {details.purpose === 'อื่น ๆ' && (
              <div>
                <Label>ระบุ</Label>
                <Input
                  placeholder="กรุณาระบุ"
                  value={details.purposeText}
                  onChange={e => onChange('purposeText', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />

        {/* Approval Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">การอนุมัติ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Primary Approver */}
            <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
              <Label className="text-blue-800 font-semibold">ผู้อนุมัติหลัก *</Label>
              <Select value={approvers.primary} onValueChange={setPrimary}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือก…" />
                </SelectTrigger>
                <SelectContent>
                  {approverEmails.map(a => (
                    <SelectItem key={a.id} value={a.email}>{a.name} ({a.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Additional Approvers */}
            <div>
              <Label className="mb-2">ผู้อนุมัติเพิ่มเติม</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {approvers.additional.map(email => (
                  <Badge key={email} className="flex items-center gap-1">
                    {findName(email)}
                    <button onClick={() => toggleAdditional(email)}>
                      <X className="h-4 w-4" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full text-left">
                    + เพิ่มผู้อนุมัติ
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Command>
                    <CommandInput placeholder="ค้นหา…" />
                    <CommandList>
                      <CommandEmpty>ไม่พบผู้อนุมัติ</CommandEmpty>
                      <CommandGroup>
                        {approverEmails
                          .filter(a => a.email !== approvers.primary)
                          .map(a => (
                            <CommandItem key={a.id} onSelect={() => toggleAdditional(a.email)}>
                              <Checkbox checked={approvers.additional.includes(a.email)} />
                              <span className="ml-2">{a.name} ({a.email})</span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />

        {/* Remarks Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">หมายเหตุ</h3>
          <Textarea
            rows={4}
            placeholder="ระบุรายละเอียดเพิ่มเติม"
            value={details.remarks}
            onChange={e => onChange('remarks', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
