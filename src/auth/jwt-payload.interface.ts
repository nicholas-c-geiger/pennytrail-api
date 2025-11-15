export interface JwtPayload {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
}
