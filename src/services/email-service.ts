// src/services/email-service.ts
import { Trip } from '@/types/trip';
import { createTransport } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static transporter = createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || '',
    },
  });

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!options.to || !options.subject || !options.html) {
        console.error('Invalid email options');
        return false;
      }

      // Send email
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'Car Webtime <carwebtime@example.com>',
        ...options,
      });

      console.log('Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send approval request email for a new trip
   * Using Outlook-compatible HTML table-based layout
   */
  static async sendApprovalRequest(
    trip: Trip,
    approverEmail: string,
    approverName?: string
  ): Promise<boolean> {
    // Generate approval URL with token
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const approveToken = Buffer.from(`${trip.TID}:approve`).toString('base64');
    const rejectToken = Buffer.from(`${trip.TID}:reject`).toString('base64');

    const approveUrl = `${baseUrl}/api/trips/approve?token=${approveToken}`;
    const rejectUrl = `${baseUrl}/api/trips/approve?token=${rejectToken}`;
    const viewUrl = `${baseUrl}/trips/${trip.TID}`;

    const formattedDate = new Date(trip.DATE).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const greeting = approverName
      ? `เรียน ${approverName}`
      : 'เรียนผู้เกี่ยวข้อง';

    // Using table-based layout for better Outlook compatibility
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
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-top: 5px solid #3b82f6; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #3b82f6; font-size: 28px; font-weight: bold;">
                    🚗 ระบบจองรถยนต์
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 0 30px 30px 30px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 16px; line-height: 24px; padding-bottom: 10px;">
                    <h2 style="margin: 0; color: #333333; font-size: 22px; margin-bottom: 15px;">คำขออนุมัติการใช้รถยนต์</h2>
                    <p style="margin: 0 0 20px 0;">${greeting}</p>
                    <p style="margin: 0 0 20px 0;">มีคำขอใช้รถยนต์รอการอนุมัติจากท่าน:</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Trip Details -->
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
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.CARBARND}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">เส้นทาง:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.START_POINT} → ${trip.END_POINT}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">วัตถุประสงค์:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.PURPOSE || 'ไม่ได้ระบุ'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">แผนก:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.DEPARTMENT || 'ไม่ได้ระบุ'}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">ผู้ขอใช้งาน:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.RECORD_BY_NAME || trip.RECORD_BY || 'ไม่ทราบ'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Additional Stops Section (if any) -->
          ${
            trip.items && trip.items.length > 0
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
                        <td width="90%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 5px 0;">${item.START_POINT || ''} → ${item.END_POINT || ''}</td>
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
          
          <!-- Drivers Section (if any) -->
          ${
            trip.drivers && trip.drivers.length > 0
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
                        <td width="90%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 5px 0;">${driver.DRIVER_NAME || ''}</td>
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
          
          <!-- Action Buttons -->
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
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f5f7fa; border-top: 1px solid #e1e5ea;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #777777; font-size: 12px; line-height: 18px; text-align: center;">
                    <p style="margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบจองรถยนต์</p>
                    <p style="margin: 5px 0 0 0;">กรุณาอย่าตอบกลับอีเมลนี้</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 0 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="100%" style="color: #777777; font-size: 12px; line-height: 18px; text-align: center;">
                          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #3b82f6;">ระบบจองรถยนต์</p>
                          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} บริษัทของคุณ สงวนลิขสิทธิ์</p>
                        </td>
                      </tr>
                    </table>
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
      subject: `[ระบบจองรถยนต์] คำขออนุมัติการใช้รถยนต์ #${trip.TID}`,
      html,
    });
  }

  /**
   * Send notification about trip status change
   * Using Outlook-compatible HTML table-based layout
   */
  static async sendTripStatusNotification(
    trip: Trip,
    recipientEmail: string,
    status: 'approved' | 'rejected'
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const viewUrl = `${baseUrl}/trips/${trip.TID}`;
    const formattedDate = new Date(trip.DATE).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const statusText = status === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว';
    const statusColor = status === 'approved' ? '#4CAF50' : '#f44336';
    const headerBgColor = status === 'approved' ? '#ebf7ee' : '#feeeee';
    const headerBorderColor = status === 'approved' ? '#4CAF50' : '#f44336';

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
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; border-top: 5px solid ${headerBorderColor}; background-color: ${headerBgColor};">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 28px; font-weight: bold;">
                    🚗 ระบบจองรถยนต์
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
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
          
          <!-- Status Badge -->
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
          
          <!-- Trip Details -->
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
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.CARBARND}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">เส้นทาง:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.START_POINT} → ${trip.END_POINT}</td>
                      </tr>
                      <tr>
                        <td width="30%" style="color: #555555; font-size: 14px; line-height: 20px; padding: 8px 0; font-weight: bold;">วัตถุประสงค์:</td>
                        <td width="70%" style="color: #333333; font-size: 14px; line-height: 20px; padding: 8px 0;">${trip.PURPOSE || 'ไม่ได้ระบุ'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- View Details Button -->
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
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f5f7fa; border-top: 1px solid #e1e5ea;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #777777; font-size: 12px; line-height: 18px; text-align: center;">
                    <p style="margin: 0;">นี่เป็นอีเมลอัตโนมัติจากระบบจองรถยนต์</p>
                    <p style="margin: 5px 0 0 0;">กรุณาอย่าตอบกลับอีเมลนี้</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 0 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="100%" style="color: #777777; font-size: 12px; line-height: 18px; text-align: center;">
                          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #3b82f6;">ระบบจองรถยนต์</p>
                          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} บริษัทของคุณ สงวนลิขสิทธิ์</p>
                        </td>
                      </tr>
                    </table>
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
      subject: `[ระบบจองรถยนต์] คำขอใช้รถยนต์ ${status === 'approved' ? 'ได้รับการอนุมัติ' : 'ถูกปฏิเสธ'} #${trip.TID}`,
      html,
    });
  }
}
