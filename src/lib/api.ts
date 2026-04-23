// src/lib/api.ts
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // เรียกใช้ token จาก localStorage
  const token = localStorage.getItem('carWebtime_token');

  // สร้าง headers ใหม่จาก options ที่ส่งมา
  const headers = new Headers(options.headers || {});

  // ถ้าไม่มี Content-Type ใน headers ให้เพิ่มเข้าไป
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // ถ้ามี token ให้เพิ่ม Authorization header
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    console.warn('No auth token found when calling:', url);
  }

  try {
    // ส่ง request พร้อม headers ที่ปรับแล้ว
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // ตรวจสอบสถานะ response
    if (!response.ok) {
      // ถ้าเป็น 401 ให้นำไปที่หน้า login
      if (response.status === 401) {
        console.warn('Authentication required, redirecting to login');
        localStorage.removeItem('carWebtime_user');
        localStorage.removeItem('carWebtime_token');

        // ถ้าไม่ใช่ server-side ให้ redirect ไปที่หน้า login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        throw new Error('Authentication required');
      }

      // ถ้าเป็น 403 ให้แจ้งว่าไม่มีสิทธิ์
      if (response.status === 403) {
        throw new Error('You do not have permission to perform this action');
      }

      // อ่านข้อความ error จาก response
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    // ส่งคืนข้อมูลเป็น JSON object
    return response.json();
  } catch (error) {
    // แสดง error ใน console
    console.error(`API request failed for ${url}:`, error);

    // ส่งต่อ error ให้ส่วนที่เรียกใช้จัดการต่อ
    throw error;
  }
}
