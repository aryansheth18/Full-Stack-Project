import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../services/storeService';
import { RatingService } from '../services/ratingService';
import { AppError } from '../errors/AppError';
import { QueryParamsInput } from '../validators/schemas';

export class StoreController {
  static async getUserStores(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const result = await StoreService.getUserStores(
        req.user.userId,
        req.query as unknown as QueryParamsInput
      );
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async submitRating(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const storeId = req.params.id;
      const result = await RatingService.submitOrUpdateRating(req.user.userId, storeId, req.body);
      return res.status(200).json({ message: 'Rating submitted successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getOwnerDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const dashboardData = await StoreService.getOwnerDashboard(req.user.userId);
      return res.status(200).json({ dashboard: dashboardData });
    } catch (error) {
      next(error);
    }
  }
}
