import { CanActivate, ExecutionContext, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt from 'jsonwebtoken';

/**
 * Guard that accepts only HS256 JWTs signed with `API_SECRET`.
 * On success attaches `req.user = { id, payload }` where `id` is `sub`.
 * Returns JSON responses:
 * - 401 Unauthorized: missing/invalid/expired token or missing `sub` claim
 * - 503 service_unavailable: when verification cannot be performed (missing secret)
 */
@Injectable()
export class VerifyJwtGuard implements CanActivate {
  constructor(@Optional() private configService?: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const auth = req.headers?.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return false;
    }

    const token = auth.slice(7);
    const secret = this.configService?.get<string>('API_SECRET');

    if (!secret) {
      // Do not log or expose the secret value. Log a safe error for operators.
      // Authentication cannot proceed without the API secret configured.
      // Return 503 to indicate a configuration/service issue.

      console.error('API_SECRET is not configured; authentication unavailable');
      res.status(503).json({ message: 'service_unavailable' });
      return false;
    }

    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as Record<
        string,
        unknown
      >;
      if (!payload || !payload.sub) {
        res.status(401).json({ message: 'Unauthorized' });
        return false;
      }

      const sub = payload.sub as string | number;
      const id = typeof sub === 'string' && /^[0-9]+$/.test(sub) ? Number(sub) : sub;
      // attach for downstream handlers
      req.user = { id, payload };
      return true;
    } catch {
      // jwt.verify throws for invalid signature, expired, etc.
      res.status(401).json({ message: 'Unauthorized' });
      return false;
    }
  }
}
