import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export function getAuthUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = getAuthUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}
