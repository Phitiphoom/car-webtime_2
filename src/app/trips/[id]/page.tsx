// src/app/trips/[id]/page.tsx
//
// The trip as a paper permit slip: form number, route, fields ruled with
// dashed lines, signature blocks, and an ink stamp once it has been decided.
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Stamp } from '@/components/shared/Stamp';
import { DocNumber } from '@/components/shared/DocNumber';
import { DeleteConfirmDialog } from '@/components/TripDetailsPage/DeleteConfirmDialog';
import { EmailApprovalDialog } from '@/components/TripDetailsPage/EmailApprovalDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import {
  useTrip,
  useDeleteTrip,
  useUpdateTripStatus,
  useSendApproval,
} from '@/hooks/queries/useTrips';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Edit,
  Printer,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function Field({
  label,
  children,
  mono,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`border-b border-dashed border-foreground/25 pb-2 ${wide ? 'sm:col-span-2' : ''}`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 ${mono ? 'font-mono text-sm' : 'font-medium'}`}>
        {children}
      </p>
    </div>
  );
}

export default function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const tripId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const { data: trip, isLoading, error } = useTrip(tripId);
  const deleteTrip = useDeleteTrip();
  const updateStatus = useUpdateTripStatus();
  const sendApproval = useSendApproval();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [approverEmail, setApproverEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const decide = (status: 'APPROVED' | 'REJECTED') =>
    updateStatus.mutate(
      { id: tripId, status },
      {
        onSuccess: () =>
          toast.success(
            status === 'APPROVED' ? 'อนุมัติทริปแล้ว' : 'ปฏิเสธทริปแล้ว'
          ),
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : 'ดำเนินการไม่สำเร็จ'
          ),
      }
    );

  return (
    <AuthGuard>
      <AppShell title="ใบขออนุญาตใช้รถ">
        {isLoading && (
          <div className="max-w-3xl mx-auto space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="max-w-3xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
            <AlertDescription>ไม่พบข้อมูลทริปนี้</AlertDescription>
          </Alert>
        )}

        {trip && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/trips')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับ
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  พิมพ์
                </Button>
                {trip.recordBy.id === Number(user?.id) &&
                  trip.status === 'PENDING' && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/trips/${trip.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        แก้ไข
                      </Link>
                    </Button>
                  )}
                {trip.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailDialog(true)}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    ส่งคำขออนุมัติ
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  ลบ
                </Button>
              </div>
            </div>

            <article className="relative rounded-[3px] border border-foreground/30 bg-card px-4 py-5 sm:px-6 shadow-[3px_3px_0_0_hsl(var(--foreground)/0.08)]">
              <div className="flex items-baseline justify-between border-b border-dashed border-foreground/40 pb-2">
                <DocNumber id={trip.id} />
                <span className="font-mono text-xs text-muted-foreground">
                  ยื่นเมื่อ {formatDate(trip.createdAt)}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-medium sm:text-2xl">
                {trip.startPoint} → {trip.endPoint}
              </h2>

              <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <Field label="วันที่เดินทาง">{formatDate(trip.date)}</Field>
                <Field label="ทะเบียนรถ" mono>
                  {trip.car.plateNumber}
                </Field>
                <Field label="ยี่ห้อ / รุ่น">
                  {trip.car.brand} {trip.car.model}
                </Field>
                <Field label="แผนก">{trip.department}</Field>
                {(trip.purposeText || trip.purpose) && (
                  <Field label="วัตถุประสงค์" wide>
                    {trip.purposeText || trip.purpose}
                  </Field>
                )}
                {trip.remark && (
                  <Field label="หมายเหตุ" wide>
                    {trip.remark}
                  </Field>
                )}
              </div>

              {trip.items.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground">
                    จุดแวะเพิ่มเติม
                  </p>
                  <ol className="mt-1 space-y-1 text-sm">
                    {trip.items.map((item, i) => (
                      <li
                        key={item.id}
                        className="border-b border-dashed border-foreground/20 pb-1"
                      >
                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                          {i + 1}.
                        </span>
                        {item.startPoint} → {item.endPoint}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {trip.drivers.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground">คนขับ</p>
                  <p className="mt-1 text-sm font-medium">
                    {trip.drivers.map((d) => d.name).join(', ')}
                  </p>
                </div>
              )}

              {trip.approvers.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs text-muted-foreground">
                    ผู้อนุมัติ (คนใดคนหนึ่งตัดสินก็เพียงพอ)
                  </p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {trip.approvers.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-dashed border-foreground/20 pb-1"
                      >
                        <span>
                          {a.name ? `${a.name} ` : ''}
                          <span className="font-mono text-xs text-muted-foreground">
                            {a.email}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {a.decision === 'APPROVED'
                            ? 'อนุมัติแล้ว'
                            : a.decision === 'REJECTED'
                              ? 'ปฏิเสธ'
                              : trip.status === 'PENDING'
                                ? 'รอตัดสิน'
                                : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="relative mt-10 grid grid-cols-1 gap-8 pb-12 text-sm sm:grid-cols-2 sm:pb-0">
                <div>
                  <div className="h-8 border-b border-foreground/70" />
                  <p className="mt-1 font-medium">{trip.recordBy.name}</p>
                  <p className="text-xs text-muted-foreground">ผู้ขอใช้รถ</p>
                </div>
                <div>
                  <div className="h-8 border-b border-foreground/70" />
                  <p className="mt-1 font-medium">
                    {trip.approvedBy?.name ?? ' '}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ผู้อนุมัติ
                    {trip.approvedAt && (
                      <span className="ml-2 font-mono">
                        {new Date(trip.approvedAt).toLocaleDateString('th-TH')}
                      </span>
                    )}
                  </p>
                </div>
                <Stamp
                  status={trip.status}
                  size="lg"
                  className="absolute -bottom-2 right-4 bg-card/60"
                />
              </div>
            </article>

            {(user?.role === 'ADMIN' || user?.role === 'APPROVER') &&
              trip.status === 'PENDING' && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={updateStatus.isPending}
                    onClick={() => decide('REJECTED')}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    ปฏิเสธ
                  </Button>
                  <Button
                    disabled={updateStatus.isPending}
                    onClick={() => decide('APPROVED')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    ประทับอนุมัติ
                  </Button>
                </div>
              )}

            <DeleteConfirmDialog
              open={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              loading={deleteTrip.isPending}
              onDelete={() =>
                deleteTrip.mutate(trip.id, {
                  onSuccess: () => {
                    toast.success('ลบทริปแล้ว');
                    router.push('/trips');
                  },
                  onError: (err) =>
                    toast.error(
                      err instanceof Error ? err.message : 'ลบไม่สำเร็จ'
                    ),
                })
              }
            />

            <EmailApprovalDialog
              open={showEmailDialog}
              onClose={() => {
                setShowEmailDialog(false);
                setEmailSent(false);
              }}
              email={approverEmail}
              setEmail={setApproverEmail}
              loading={sendApproval.isPending}
              sent={emailSent}
              error={
                sendApproval.error instanceof Error
                  ? sendApproval.error.message
                  : null
              }
              onSend={() =>
                sendApproval.mutate(
                  { id: trip.id, input: { approverEmails: [approverEmail] } },
                  { onSuccess: () => setEmailSent(true) }
                )
              }
            />
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
