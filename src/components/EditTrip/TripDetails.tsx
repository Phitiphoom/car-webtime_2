/* File: src/components/EditTrip/TripDetails.tsx */
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

export function TripDetails({
  carBrand,
  setCarBrand,
  department,
  setDepartment,
  date,
  setDate,
  time,
  setTime,
  purpose,
  setPurpose,
  purposeText,
  setPurposeText,
  remarks,
  setRemarks,
  approverEmail,
  setApproverEmail,
  carBrands,
  departments,
  options,
  approverEmails,
}: {
  carBrand: string;
  setCarBrand: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  purposeText: string;
  setPurposeText: (v: string) => void;
  remarks: string;
  setRemarks: (v: string) => void;
  approverEmail: string;
  setApproverEmail: (v: string) => void;
  carBrands: string[];
  departments: string[];
  options: string[];
  approverEmails: Array<{ id: string; email: string; name: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Details</CardTitle>
        <CardDescription>Vehicle, schedule, purpose, etc.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {/* Vehicle */}
        <div>
          <Label>Vehicle *</Label>
          <Select value={carBrand} onValueChange={setCarBrand}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
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
        {/* Department */}
        <div>
          <Label>Department *</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Date */}
        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {/* Time */}
        <div>
          <Label>Time</Label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        {/* Purpose */}
        <div>
          <Label>Purpose</Label>
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Approver */}
        <div>
          <Label>Approver</Label>
          <Select value={approverEmail} onValueChange={setApproverEmail}>
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {approverEmails.map((a) => (
                <SelectItem key={a.id} value={a.email}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Custom Purpose */}
        {purpose === 'Other' && (
          <div className="sm:col-span-2">
            <Label>Custom Purpose</Label>
            <Input
              value={purposeText}
              onChange={(e) => setPurposeText(e.target.value)}
            />
          </div>
        )}
        {/* Remarks */}
        <div className="sm:col-span-2">
          <Label>Remarks</Label>
          <Textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
