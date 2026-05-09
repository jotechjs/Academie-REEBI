import { UserRole } from '@prisma/client';

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
