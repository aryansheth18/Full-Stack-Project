import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
