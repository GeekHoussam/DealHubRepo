import { httpJson } from "./http";
import type { CreateUserRequest, UserDto } from "./contracts";

export async function adminCreateUser(
  req: CreateUserRequest
): Promise<UserDto> {
  const payload = {
    email: req.email,
    password: req.password,
    role: String(req.role).toUpperCase(),
    lenderId: req.role === "LENDER" ? req.lenderId ?? null : null,
  };
  return httpJson("POST", "/admin/users", payload);
}

export async function adminListUsers(): Promise<UserDto[]> {
  return httpJson("GET", "/admin/users");
}

export async function adminSetUserEnabled(
  userId: number,
  enabled: boolean
): Promise<UserDto> {
  return httpJson("PATCH", `/admin/users/${userId}/enabled`, { enabled });
}

export async function adminResetUserPassword(
  userId: number,
  password: string
): Promise<void> {
  await httpJson("PATCH", `/admin/users/${userId}/password`, { password });
}
