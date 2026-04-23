// src/types/user.ts
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'approver' | 'user';
  department?: string;
};
export interface CreateUserDTO {
  USERNAME: string;
  NAME: string;
  PASSWORD: string;
  ROLE_ID: string;
  EMAIL: string;
  DEPARTMENT_ID: string;
  COMPANY_ID: string;
  MENU: string; // เปลี่ยนเป็น required property
  POSITION_NAME: string;
  IS_EDIT: boolean;
  IS_REVIEW: boolean;
  IS_APPROVE: boolean;
  IS_ACTIVE: boolean;
}

export type UserFields = {
  name: keyof CreateUserDTO;
  label: string;
  type: 'text' | 'textarea' | 'switch' | 'combobox' | 'email';
  placeholder?: string;
  description?: string;
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
};
