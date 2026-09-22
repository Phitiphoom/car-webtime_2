// src/services/email-service.ts
import { createTransport } from 'nodemailer';
import { env } from '@/env';
import { logger } from '@/lib/logger';
import { TripDTO } from '@/server/trips/trip.mapper';
import { issueApprovalToken } from '@/server/auth/approval-token';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static transporter = createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
  });

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!options.to || !options.subject || !options.html) {
        logger.error({ options }, 'Invalid email options');
        return false;
      }

      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        ...options,
      });
      logger.info({ messageId: info.messageId }, 'Email sent');
      return true;
    } catch (error) {
      logger.error({ err: error }, 'Error sending email');
      return false;
    }
  }

  /**
   * Send approval request email for a new trip. Approve/reject links now
   * carry a signed, expiring, single-use token (src/server/auth/approval-token.ts)
   * instead of the old unsigned base64 `tripId:action` string.
   */
  static async sendApprovalRequest(
    trip: TripDTO,
    approverEmail: string,
    approverName?: string
  ): Promise<boolean> {
    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const [approveToken, rejectToken] = await Promise.all([
      issueApprovalToken(trip.id, 'APPROVE', approverEmail),
      issueApprovalToken(trip.id, 'REJECT', approverEmail),
    ]);

    const approveUrl = `${baseUrl}/api/trips/approve?token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/trips/approve?token=${rejectToken}`;
    const viewUrl = `${baseUrl}/trips/${trip.id}`;

    const formattedDate = new Date(trip.date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const greeting = approverName
      ? `เรียน ${approverName}`
      : 'เรียนผู้เกี่ยวข้อง';

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>ขออนุมัติการใช้รถยนต์</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f7f9fc;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-top: 5px solid #3b82f6; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #3b82f6; font-size: 28px; font-weight: bold;">
                    ระบบจองรถยนต์
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 24px; padding-bottom: 10px;">
                    <h2 style="margin: 0; color: #333333; font-size: 22px; margin-bottom: 15px;">คำขออนุมัติการใช้รถยนต์</h2>
                    <p style="margin: 0 0 20px 0;">${greeting}</p>
                    <p style="margin: 0 0 20px 0;">มีคำขอใช้รถยนต์รอการอนุมัติจากท่าน:</p>
                    <p style="margin: 0 0 20px 0; color: #777777; font-size: 13px;">ผู้อนุมัติท่านใดท่านหนึ่งตัดสินก็เพียงพอ หากมีท่านอื่นตัดสินไปแล้ว ลิงก์ในอีเมลนี้จะใช้ไม่ได้</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f7fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">วันที่:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">รถยนต์:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.car.brand} ${trip.car.model} (${trip.car.plateNumber})</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">เส้นทาง:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.startPoint} → ${trip.endPoint}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">วัตถุประสงค์:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.purpose || 'ไม่ได้ระบุ'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">แผนก:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.department || 'ไม่ได้ระบุ'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">ผู้ขอใช้งาน:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.recordBy.name}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            trip.items.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 24px; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #333333; font-size: 18px; margin-bottom: 15px;">จุดแวะเพิ่มเติม:</h3>
                  </td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f7fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      ${trip.items
                        .map(
                          (item, index) => `
                      <tr>
                        <td width="10%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 5px 0; font-weight: bold;">${index + 1}.</td>
                        <td width="90%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 5px 0;">${item.startPoint} → ${item.endPoint}</td>
                      </tr>
                      `
                        )
                        .join('')}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }

          ${
            trip.drivers.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 24px; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #333333; font-size: 18px; margin-bottom: 15px;">คนขับรถ:</h3>
                  </td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f7fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      ${trip.drivers
                        .map(
                          (driver, index) => `
                      <tr>
                        <td width="10%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 5px 0; font-weight: bold;">${index + 1}.</td>
                        <td width="90%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 5px 0;">${driver.name}</td>
                      </tr>
                      `
                        )
                        .join('')}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ''
          }

          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 24px; padding-bottom: 20px;">
                    <p style="margin: 0;">กรุณาตรวจสอบและดำเนินการอนุมัติหรือปฏิเสธคำขอนี้:</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="33%">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border-radius: 4px;" bgcolor="#4CAF50">
                                <a href="${approveUrl}" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; border: 1px solid #4CAF50; display: inline-block; font-weight: bold;">
                                  อนุมัติ
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="33%">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border-radius: 4px;" bgcolor="#f44336">
                                <a href="${rejectUrl}" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; border: 1px solid #f44336; display: inline-block; font-weight: bold;">
                                  ปฏิเสธ
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="33%">
                          <table border="0" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center" style="border-radius: 4px;" bgcolor="#2196F3">
                                <a href="${viewUrl}" target="_blank" style="font-size: 14px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 4px; border: 1px solid #2196F3; display: inline-block; font-weight: bold;">
                                  ดูรายละเอียด
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 30px; background-color: #f5f7fa; border-top: 1px solid #e1e5ea;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #777777; font-size: 12px; line-height: 18px; text-align: center;">
                    <p style="margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบจองรถยนต์</p>
                    <p style="margin: 5px 0 0 0;">กรุณาอย่าตอบกลับอีเมลนี้</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: approverEmail,
      subject: `[ระบบจองรถยนต์] คำขออนุมัติการใช้รถยนต์ #${trip.id}`,
      html,
    });
  }

  /** Send notification about trip status change. */
  static async sendTripStatusNotification(
    trip: TripDTO,
    recipientEmail: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<boolean> {
    const baseUrl = env.NEXT_PUBLIC_APP_URL;
    const viewUrl = `${baseUrl}/trips/${trip.id}`;
    const formattedDate = new Date(trip.date).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const statusText = status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
    const statusColor = status === 'APPROVED' ? '#4CAF50' : '#f44336';
    const headerBgColor = status === 'APPROVED' ? '#ebf7ee' : '#feeeee';
    const headerBorderColor = status === 'APPROVED' ? '#4CAF50' : '#f44336';

    const html = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>ผลการอนุมัติการใช้รถยนต์</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f7f9fc;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-top: 5px solid ${headerBorderColor}; background-color: ${headerBgColor};">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 28px; font-weight: bold;">
                    ระบบจองรถยนต์
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 20px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 24px; padding: 20px 0;">
                    <h2 style="margin: 0; color: #333333; font-size: 22px; margin-bottom: 15px;">ผลการอนุมัติการใช้รถยนต์</h2>
                    <p style="margin: 0 0 20px 0;">เรียนผู้เกี่ยวข้อง,</p>
                    <p style="margin: 0 0 20px 0;">คำขอใช้รถยนต์ของคุณได้รับการ <span style="font-weight: bold; color: ${statusColor};">${statusText}</span>:</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 20px 30px; background-color: #ffffff; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: ${statusColor}; border-radius: 20px; padding: 8px 16px;">
                    <span style="color: #ffffff; font-size: 16px; font-weight: bold;">${statusText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f7fa; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">วันที่:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">รถยนต์:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.car.brand} ${trip.car.model} (${trip.car.plateNumber})</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">เส้นทาง:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.startPoint} → ${trip.endPoint}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">วัตถุประสงค์:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.purpose || 'ไม่ได้ระบุ'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 4px;" bgcolor="#2196F3">
                    <a href="${viewUrl}" target="_blank" style="font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 4px; border: 1px solid #2196F3; display: inline-block; font-weight: bold;">
                      ดูรายละเอียดทริป
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 20px 30px; background-color: #f5f7fa; border-top: 1px solid #e1e5ea;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #777777; font-size: 12px; line-height: 18px; text-align: center;">
                    <p style="margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบจองรถยนต์</p>
                    <p style="margin: 5px 0 0 0;">กรุณาอย่าตอบกลับอีเมลนี้</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: `[ระบบจองรถยนต์] คำขอใช้รถยนต์ ${status === 'APPROVED' ? 'ได้รับการอนุมัติ' : 'ถูกปฏิเสธ'} #${trip.id}`,
      html,
    });
  }
}
