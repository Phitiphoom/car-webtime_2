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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

import { X, UserCheck, Users, PlusCircle } from 'lucide-react';
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
    const next = chosen
      ? approvers.additional.filter((e) => e !== email)
      : [...approvers.additional, email];
    if (!approvers.primary && !chosen) {
      onApproverChange(email, next);
    } else {
      onApproverChange(approvers.primary, next);
    }
  };
  const setPrimary = (email: string) =>
    onApproverChange(email, approvers.additional);
  const findName = (email: string) =>
    approverEmails.find((a) => a.email === email)?.name || email;

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
              <Select
                value={details.carBrand}
                onValueChange={(v) => onChange('carBrand', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกรถ…" />
                </SelectTrigger>
                <SelectContent>
                  {carBrands.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>แผนก *</Label>
              <Input
                placeholder="กรอกชื่อแผนก"
                value={details.department}
                onChange={(e) => onChange('department', e.target.value)}
              />
            </div>
            <div>
              <Label>วันที่ *</Label>
              <Input
                type="date"
                value={details.date}
                onChange={(e) => onChange('date', e.target.value)}
              />
            </div>
            <div>
              <Label>เวลา</Label>
              <Input
                type="time"
                value={details.time}
                onChange={(e) => onChange('time', e.target.value)}
              />
            </div>
          </div>
        </div>

        <hr className="my-6 border-t border-border" />

        {/* Purpose Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">วัตถุประสงค์</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>เลือกวัตถุประสงค์</Label>
              <Select
                value={details.purpose}
                onValueChange={(v) => onChange('purpose', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือก…" />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {details.purpose === 'อื่น ๆ' && (
              <div>
                <Label>ระบุ</Label>
                <Input
                  placeholder="กรุณาระบุ"
                  value={details.purposeText}
                  onChange={(e) => onChange('purposeText', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <hr className="my-6 border-t border-border" />

        {/* Approval Section */}
        <div>
          <h3 className="text-lg font-medium mb-1">การอนุมัติ</h3>
          <p className="text-sm text-muted-foreground mb-3">
            เลือกผู้ที่จะพิจารณาอนุมัติทริปนี้ อย่างน้อย 1 คน
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Approver */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <Label className="text-foreground font-semibold">
                  ผู้อนุมัติหลัก *
                </Label>
              </div>
              <Select value={approvers.primary} onValueChange={setPrimary}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="เลือกผู้อนุมัติ…" />
                </SelectTrigger>
                <SelectContent className="max-w-[22rem] max-h-64">
                  {approverEmails.map((a) => (
                    <SelectItem key={a.id} value={a.email}>
                      {a.name} ({a.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                ผู้ที่จะตัดสินใจอนุมัติหรือปฏิเสธทริปนี้
              </p>
            </div>

            {/* Additional Approvers */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label>ผู้อนุมัติเพิ่มเติม</Label>
                <span className="text-xs text-muted-foreground">
                  (ไม่บังคับ)
                </span>
              </div>

              {approvers.additional.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {approvers.additional.map((email) => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {findName(email)}
                      <button
                        type="button"
                        onClick={() => toggleAdditional(email)}
                        aria-label={`นำ ${findName(email)} ออกจากผู้อนุมัติเพิ่มเติม`}
                        className="rounded-full p-0.5 hover:bg-foreground/10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-muted-foreground font-normal"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    เพิ่มผู้อนุมัติเพิ่มเติม
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="ค้นหาชื่อหรืออีเมล…" />
                    <CommandList>
                      <CommandEmpty>ไม่พบผู้อนุมัติ</CommandEmpty>
                      <CommandGroup>
                        {approverEmails
                          .filter((a) => a.email !== approvers.primary)
                          .map((a) => (
                            <CommandItem
                              key={a.id}
                              onSelect={() => toggleAdditional(a.email)}
                              className="gap-2"
                            >
                              <Checkbox
                                checked={approvers.additional.includes(a.email)}
                              />
                              <span>
                                {a.name} ({a.email})
                              </span>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                จะถูกบันทึกไว้เป็นข้อมูลอ้างอิงร่วมกับทริปนี้
              </p>
            </div>
          </div>
        </div>

        <hr className="my-6 border-t border-border" />

        {/* Remarks Section */}
        <div>
          <h3 className="text-lg font-medium mb-3">หมายเหตุ</h3>
          <Textarea
            rows={4}
            placeholder="ระบุรายละเอียดเพิ่มเติม"
            value={details.remarks}
            onChange={(e) => onChange('remarks', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
