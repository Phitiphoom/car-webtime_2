// src/app/api/trips/approve/route.ts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { EmailService } from '@/services/email-service';

/**
 * This endpoint handles approving or rejecting trips via email links
 * It uses a simple token approach for security (base64 encoded trip ID and action)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from query string
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return new Response('Invalid request: Missing token', {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Decode token (format: base64(tripId:action))
    let decoded;
    try {
      decoded = Buffer.from(token, 'base64').toString('utf-8');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return new Response('Invalid token format', {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Parse tripId and action
    const [tripIdStr, action] = decoded.split(':');
    const tripId = parseInt(tripIdStr, 10);

    if (isNaN(tripId) || !['approve', 'reject'].includes(action)) {
      return new Response('Invalid token data', {
        status: 400,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Verify trip exists and is pending approval
    const trip = await prisma.tRAVEL_DETAIL.findFirst({
      where: {
        TID: tripId,
        is_deleted: false,
        APPROVE_STATUS: 'Pending',
      },
    });

    if (!trip) {
      return new Response(
        renderStatusPage({
          success: false,
          message: 'Trip not found or already processed',
          details:
            'This trip may not exist, has already been approved/rejected, or has been deleted.',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }

    // Update trip status based on action
    const newStatus = action === 'approve' ? 'Approve' : 'Rejected';

    const updatedTrip = await prisma.tRAVEL_DETAIL.update({
      where: { TID: tripId },
      data: {
        APPROVE_STATUS: newStatus,
        APPROVED_AT: new Date(),
        APPROVED_BY: 'Email Approval', // Can be enhanced to include approver info
      },
    });

    // Send notification to the trip requestor if email exists
    if (trip.RECORD_BY) {
      // Find user to get their email
      const user = await prisma.tV_USERNAME.findFirst({
        where: {
          USERNAME: trip.RECORD_BY,
        },
        select: {
          EMAIL: true,
        },
      });

      // Send notification email if user has an email
      if (user?.EMAIL) {
        await EmailService.sendTripStatusNotification(
          updatedTrip,
          user.EMAIL,
          action === 'approve' ? 'approved' : 'rejected'
        );
      }
    }

    // Return success response with HTML
    return new Response(
      renderStatusPage({
        success: true,
        message: `Trip ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        details: `The trip request has been ${action === 'approve' ? 'approved' : 'rejected'} and the requestor has been notified.`,
        tripId: tripId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error processing approval:', error);

    return new Response(
      renderStatusPage({
        success: false,
        message: 'Error processing request',
        details:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  }
}

// Helper function to render HTML response
interface StatusPageProps {
  success: boolean;
  message: string;
  details: string;
  tripId?: number;
}

function renderStatusPage({
  success,
  message,
  details,
  tripId,
}: StatusPageProps): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const viewUrl = tripId
    ? `${baseUrl}/trips/${tripId}`
    : `${baseUrl}/dashboard`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Car Webtime - ${success ? 'Success' : 'Error'}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-top: 50px;
        }
        .status-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .success { color: #4CAF50; }
        .error { color: #F44336; }
        .message {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        .details {
          margin-bottom: 30px;
          color: #555;
        }
        .button {
          display: inline-block;
          background-color: #2196F3;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #0b7dda;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-icon ${success ? 'success' : 'error'}">
          ${success ? '✓' : '✗'}
        </div>
        <div class="message">${message}</div>
        <div class="details">${details}</div>
        <a href="${viewUrl}" class="button">
          ${tripId ? 'View Trip Details' : 'Go to Dashboard'}
        </a>
      </div>
    </body>
    </html>
  `;
}
