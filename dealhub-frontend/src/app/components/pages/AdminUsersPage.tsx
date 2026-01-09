import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CreateUserRole, UserDto } from "../../api/contracts";
import {
  adminCreateUser,
  adminListUsers,
  adminResetUserPassword,
  adminSetUserEnabled,
} from "../../api/adminUsersApi";

export default function AdminUsersPage() {
  // Create form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<CreateUserRole>("AGENT");
  const [lenderId, setLenderId] = useState<string>("");

  const [busyCreate, setBusyCreate] = useState(false);

  // List
  const [busyList, setBusyList] = useState(false);
  const [users, setUsers] = useState<UserDto[]>([]);

  const lenderRequired = useMemo(() => role === "LENDER", [role]);

  const loadUsers = async () => {
    setBusyList(true);
    try {
      const data = await adminListUsers();
      setUsers(data ?? []);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load users", { description: e?.message ?? String(e) });
    } finally {
      setBusyList(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onCreate = async () => {
    const e = email.trim().toLowerCase();
    if (!e) return toast.error("Email is required");
    if (!password.trim()) return toast.error("Password is required");

    let lenderIdNum: number | null = null;
    if (lenderRequired) {
      const n = Number(lenderId);
      if (!Number.isFinite(n) || n <= 0) {
        return toast.error("lenderId is required for LENDER and must be a number > 0");
      }
      lenderIdNum = n;
    }

    setBusyCreate(true);
    try {
      const created = await adminCreateUser({
        email: e,
        password,
        role,
        lenderId: lenderIdNum ?? undefined,
      });

      toast.success("User created", { description: `${created.email} (${created.role})` });

      // reset
      setEmail("");
      setPassword("");
      setRole("AGENT");
      setLenderId("");

      await loadUsers();
    } catch (err: any) {
      console.error(err);
      toast.error("Create user failed", { description: err?.message ?? String(err) });
    } finally {
      setBusyCreate(false);
    }
  };

  const onToggleEnabled = async (u: UserDto) => {
    try {
      const next = !u.enabled;
      await adminSetUserEnabled(u.id, next);
      toast.success(next ? "User enabled" : "User disabled");
      await loadUsers();
    } catch (e: any) {
      console.error(e);
      toast.error("Update failed", { description: e?.message ?? String(e) });
    }
  };

  const onResetPassword = async (u: UserDto) => {
    const next = window.prompt(`Enter NEW password for ${u.email}`);
    if (!next) return;

    try {
      await adminResetUserPassword(u.id, next);
      toast.success("Password reset", { description: u.email });
    } catch (e: any) {
      console.error(e);
      toast.error("Password reset failed", { description: e?.message ?? String(e) });
    }
  };

  return (
    <main className="p-6 max-w-[1200px] mx-auto">
      <div className="text-white mb-6">
        <h1 className="text-3xl font-semibold">Admin — Users</h1>
        <p className="text-white/70 mt-1">Create users and manage access</p>
      </div>

      {/* Create */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#0B1F3B] mb-4">Create user</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
              placeholder="agent2@dealhub.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
              placeholder="Passw0rd!"
              type="password"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CreateUserRole)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
            >
              <option value="AGENT">AGENT</option>
              <option value="LENDER">LENDER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Lender ID</label>
            <input
              value={lenderId}
              onChange={(e) => setLenderId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
              placeholder="Required only for LENDER"
              disabled={!lenderRequired}
            />
            {!lenderRequired && (
              <p className="text-xs text-gray-500 mt-1">Not required for ADMIN/AGENT</p>
            )}
          </div>
        </div>

        <button
          onClick={onCreate}
          disabled={busyCreate}
          className="mt-4 rounded-xl px-5 py-3 text-sm bg-[#0B1F3B] text-white hover:bg-[#0B1F3B]/90 disabled:opacity-60"
        >
          {busyCreate ? "Creating..." : "Create user"}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {busyList ? "Loading..." : `${users.length} user(s)`}
          </div>
          <button
            onClick={loadUsers}
            className="rounded-xl px-4 py-2 text-sm border border-gray-200 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">EMAIL</th>
                <th className="text-left px-4 py-3">ROLE</th>
                <th className="text-left px-4 py-3">LENDER ID</th>
                <th className="text-left px-4 py-3">ENABLED</th>
                <th className="text-left px-4 py-3">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{u.lenderId ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={u.enabled ? "text-green-700" : "text-red-600"}>
                      {u.enabled ? "YES" : "NO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                        onClick={() => onToggleEnabled(u)}
                      >
                        {u.enabled ? "Disable" : "Enable"}
                      </button>

                      <button
                        className="rounded-full border border-[#0B1F3B] px-4 py-2 text-[#0B1F3B] hover:bg-[#0B1F3B]/5"
                        onClick={() => onResetPassword(u)}
                      >
                        Reset password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!busyList && users.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
