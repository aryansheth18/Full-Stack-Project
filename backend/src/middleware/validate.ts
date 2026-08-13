import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!fields[path]) {
            fields[path] = [];
          }
          fields[path].push(issue.message);
        }
        return next(
          new AppError('Validation failed on request body', 400, 'VALIDATION_ERROR', fields)
        );
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join('.');
          if (!fields[path]) {
            fields[path] = [];
          }
          fields[path].push(issue.message);
        }
        return next(
          new AppError('Validation failed on query parameters', 400, 'VALIDATION_ERROR', fields)
        );
      }
      next(error);
    }
  };
};
