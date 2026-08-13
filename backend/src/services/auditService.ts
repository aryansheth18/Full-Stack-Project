import { prisma } from '../config/db.js';

export class AuditService {
  static async logAction(
    adminId: string,
    action: 'CREATE_USER' | 'CREATE_STORE' | 'ROLE_CHANGE' | 'DELETE_USER',
    targetType: 'USER' | 'STORE',
    targetId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          details: details ? JSON.stringify(details) : null
        }
      });
    } catch (e) {
      console.error('Failed to write audit log entry:', e);
    }
  }
}
