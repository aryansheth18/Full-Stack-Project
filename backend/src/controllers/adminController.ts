import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { UserService } from '../services/userService';
import { StoreService } from '../services/storeService';
import { QueryParamsInput } from '../validators/schemas';

export class AdminController {
  static async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getDashboardStats();
      return res.status(200).json({ stats });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.userId || 'system-admin';
      const user = await UserService.createUser(adminId, req.body);
      return res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getUsers(req.query as unknown as QueryParamsInput);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.getUserById(req.params.id);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  static async createStore(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.userId || 'system-admin';
      const store = await StoreService.createStore(adminId, req.body);
      return res.status(201).json({ message: 'Store created successfully', store });
    } catch (error) {
      next(error);
    }
  }

  static async getStores(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await StoreService.getAdminStores(req.query as unknown as QueryParamsInput);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.userId || 'system-admin';
      const result = await UserService.deleteUser(adminId, req.params.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
