export interface JwtPayload {
  id: string;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
}
