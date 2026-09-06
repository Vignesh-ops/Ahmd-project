"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Badge,
  Building2,
  Copy,
  History,
  KeyRound,
  LockKeyhole,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Trash2,
  User,
  UserCog
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ActionStatusMessage from "@/components/ui/ActionStatusMessage";

export default function UsersManager({ initialUsers = [], initialAdminAccount = null }) {
  const [adminAccount, setAdminAccount] = useState(initialAdminAccount);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminMessageTone, setAdminMessageTone] = useState("idle");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminResetting, setAdminResetting] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: initialAdminAccount?.username || "",
    currentPassword: "",
    newPassword: ""
  });
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("idle");
  const [copiedMessage, setCopiedMessage] = useState("");
  const [copiedMessageTone, setCopiedMessageTone] = useState("idle");
  const [editingId, setEditingId] = useState(null);
  const [resettingId, setResettingId] = useState(null);
  const [temporaryPasswordInfo, setTemporaryPasswordInfo] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    storeName: "",
    storeCode: ""
  });
  const [editForm, setEditForm] = useState({
    username: "",
    password: "",
    storeName: "",
    storeCode: "",
    isActive: true
  });

  async function loadUsers() {
    setLoading(true);
    const [usersResponse, adminResponse] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/account")
    ]);
    const usersPayload = await usersResponse.json();
    const adminPayload = await adminResponse.json();
    setUsers(usersPayload);
    setAdminAccount(adminPayload);
    setAdminForm((current) => ({
      ...current,
      username: adminPayload.username || "",
      currentPassword: "",
      newPassword: ""
    }));
    setLoading(false);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setMessage("");
    setMessageTone("idle");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newUser)
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not create user.");
      setMessageTone("error");
      return;
    }

    setNewUser({
      username: "",
      password: "",
      storeName: "",
      storeCode: ""
    });
    setMessage("Store user created.");
    setMessageTone("success");
    loadUsers();
  }

  async function handleAdminAccountUpdate(event) {
    event.preventDefault();
    setAdminSaving(true);
    setAdminMessage("");
    setAdminMessageTone("idle");

    const response = await fetch("/api/admin/account", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(adminForm)
    });

    const payload = await response.json();

    if (!response.ok) {
      setAdminMessage(payload.error || "Could not update admin account.");
      setAdminMessageTone("error");
      setAdminSaving(false);
      return;
    }

    setAdminAccount(payload.user);
    setAdminForm({
      username: payload.user?.username || adminForm.username,
      currentPassword: "",
      newPassword: ""
    });
    setAdminMessage("Admin account updated.");
    setAdminMessageTone("success");
    setAdminSaving(false);
  }

  async function handleResetAdminPassword() {
    const confirmed = window.confirm("Generate a new temporary password for the admin account?");

    if (!confirmed) {
      return;
    }

    setAdminMessage("");
    setAdminMessageTone("idle");
    setCopiedMessage("");
    setCopiedMessageTone("idle");
    setAdminResetting(true);

    const response = await fetch("/api/admin/account/reset-password", {
      method: "POST"
    });

    const payload = await response.json();

    if (!response.ok) {
      setAdminMessage(payload.error || "Could not reset admin password.");
      setAdminMessageTone("error");
      setAdminResetting(false);
      return;
    }

    setTemporaryPasswordInfo({
      userId: payload.user.id,
      username: payload.user.username,
      storeName: payload.user.storeName,
      password: payload.temporaryPassword
    });
    setAdminForm((current) => ({
      ...current,
      currentPassword: "",
      newPassword: ""
    }));
    setAdminMessage("Temporary admin password generated. Copy it now and keep it secure.");
    setAdminMessageTone("success");
    setAdminResetting(false);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({
      username: user.username,
      password: "",
      storeName: user.storeName || "",
      storeCode: user.storeCode || "",
      isActive: user.isActive
    });
  }

  async function handleUpdate(userId) {
    setMessage("");
    setMessageTone("idle");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(editForm)
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not update user.");
      setMessageTone("error");
      return;
    }

    setEditingId(null);
    setMessage("Store user updated.");
    setMessageTone("success");
    loadUsers();
  }
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteStoreName, setDeleteStoreName] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  function resetDeleteState() {
    setShowDeleteModal(false);
    setDeleteUserId(null);
    setDeleteStoreName(null);
    setDeletingId(null);
  }
  
  async function handleDelete(userId, storeName) {
    setDeleteUserId(userId);
    setDeleteStoreName(storeName);
    setShowDeleteModal(true);
  }
  
  async function confirmDelete() {
    if (!deleteUserId) return;
  
    try {
      setDeletingId(deleteUserId);
      setMessage("");
      setMessageTone("idle");
      const response = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: "DELETE"
      });
      const payload = await response.json();

      if (!response.ok) {
        setMessage(payload.error || "Could not delete user.");
        setMessageTone("error");
        resetDeleteState();
        return;
      }

      setUsers((current) => current.filter((user) => user.id !== deleteUserId));
      setMessage(`Store user "${deleteStoreName}" deleted successfully.`);
      setMessageTone("success");
      resetDeleteState();
    } catch (error) {
      setMessage("Error deleting user.");
      setMessageTone("error");
      resetDeleteState();
    }
  }


  async function handleResetPassword(user) {
    const confirmed = window.confirm(`Generate a new temporary password for ${user.storeName}?`);

    if (!confirmed) {
      return;
    }

    setMessage("");
    setMessageTone("idle");
    setCopiedMessage("");
    setCopiedMessageTone("idle");
    setResettingId(user.id);

    const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
      method: "POST"
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not reset password.");
      setMessageTone("error");
      setResettingId(null);
      return;
    }

    setTemporaryPasswordInfo({
      userId: user.id,
      username: payload.user.username,
      storeName: payload.user.storeName,
      password: payload.temporaryPassword
    });
    setMessage(`Temporary password generated for ${payload.user.storeName}. Copy it now and share it securely.`);
    setMessageTone("success");
    setResettingId(null);
  }

  async function copyTemporaryPassword() {
    if (!temporaryPasswordInfo?.password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(temporaryPasswordInfo.password);
      setCopiedMessage("Temporary password copied.");
      setCopiedMessageTone("success");
    } catch (error) {
      setCopiedMessage("Copy failed. Please copy it manually.");
      setCopiedMessageTone("error");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdminAccountUpdate} className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-light">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Admin Account</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Protect and manage the admin login</h2>
          </div>
        </div>

        <div className="grid-form two-col">
          <Input
            label="Admin Username"
            icon={UserCog}
            value={adminForm.username}
            onChange={(event) => setAdminForm((current) => ({ ...current, username: event.target.value }))}
          />
          <Input label="Account" icon={Building2} value={adminAccount?.storeName || "AHMAD Enterprises Admin"} disabled />
          <Input
            label="Current Password"
            icon={LockKeyhole}
            type="password"
            allowPasswordToggle
            autoComplete="current-password"
            value={adminForm.currentPassword}
            onChange={(event) => setAdminForm((current) => ({ ...current, currentPassword: event.target.value }))}
          />
          <Input
            label="New Secure Password"
            icon={KeyRound}
            type="password"
            hint="Optional. Min 8 chars with Aa1!"
            allowPasswordToggle
            autoComplete="new-password"
            value={adminForm.newPassword}
            onChange={(event) => setAdminForm((current) => ({ ...current, newPassword: event.target.value }))}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ActionStatusMessage tone={adminMessage ? adminMessageTone : "idle"}>
            {adminMessage || "Change the admin username anytime. Current password is required for all admin account changes."}
          </ActionStatusMessage>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              icon={History}
              href={`/history?storeCode=${adminAccount?.storeCode || "ADM"}`}
            >
              View Admin History
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={KeyRound}
              loading={adminResetting}
              onClick={handleResetAdminPassword}
            >
              Reset Admin Password
            </Button>
            <Button type="submit" loading={adminSaving}>
              Update Admin Account
            </Button>
          </div>
        </div>
      </form>

      <form onSubmit={handleCreate} className="glass-panel rounded-[32px] border border-white/5 p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-light">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/35">Add Store User</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create as many operators as you need</h2>
          </div>
        </div>

        <div className="grid-form two-col">
          <Input
            label="Username"
            icon={User}
            value={newUser.username}
            onChange={(event) => setNewUser((current) => ({ ...current, username: event.target.value }))}
          />
          <Input
            label="Password"
            icon={KeyRound}
            type="password"
            hint="Min 8 chars with Aa1!"
            allowPasswordToggle
            autoComplete="new-password"
            value={newUser.password}
            onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))}
          />
          <Input
            label="Store Name"
            icon={Store}
            value={newUser.storeName}
            onChange={(event) => setNewUser((current) => ({ ...current, storeName: event.target.value }))}
          />
          <Input
            label="Store Code"
            icon={Badge}
            value={newUser.storeCode}
            onChange={(event) => setNewUser((current) => ({ ...current, storeCode: event.target.value.toUpperCase() }))}
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ActionStatusMessage tone={message ? messageTone : "idle"}>
            {message || "Fresh setup now starts with zero store users. Add any number of store accounts with unique store codes."}
          </ActionStatusMessage>
          <Button type="submit" icon={Plus}>
            Add User
          </Button>
        </div>
      </form>

       {/* Fancy Delete Confirmation Modal */}
  {showDeleteModal && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="dialog-surface w-full max-w-sm rounded-xl border border-red-500/30 p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Delete Store User?</h3>
        </div>
  
        <p className="text-white/30 mb-6">
          Are you sure you want to delete <span className="font-semibold text-red-300">{deleteStoreName}</span>? This action cannot be undone.
        </p>
  
        <div className="flex gap-3">
          <button
            onClick={resetDeleteState}
            className="dialog-secondary-button flex-1 rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/15"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            disabled={deletingId === deleteUserId}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            {deletingId === deleteUserId ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )}

      {temporaryPasswordInfo ? (
        <div className="rounded-[28px] border border-gold/25 bg-gold/10 p-5 text-sm text-white/85">
          <p className="text-xs uppercase tracking-[0.22em] text-gold-light">Temporary Password</p>
          <p className="mt-2 text-base font-semibold text-white">
            {temporaryPasswordInfo.storeName} · {temporaryPasswordInfo.username}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="break-all rounded-2xl border border-gold/20 bg-black/15 px-4 py-3 font-mono text-base text-gold-light">
              {temporaryPasswordInfo.password}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" icon={Copy} onClick={copyTemporaryPassword}>
                Copy Password
              </Button>
              <Button type="button" variant="ghost" onClick={() => setTemporaryPasswordInfo(null)}>
                Hide
              </Button>
            </div>
          </div>
          <ActionStatusMessage tone={copiedMessage ? copiedMessageTone : "idle"} className="mt-3">
            {copiedMessage || "This password is shown only once. Share it securely and ask the store user to change it later."}
          </ActionStatusMessage>
        </div>
      ) : null}

      {loading ? (
       <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center">
       <div className="flex flex-col items-center gap-4">
         <div className="relative w-12 h-12">
           <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
           <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 animate-spin"></div>
         </div>
         <p className="text-white/55">Loading store users...</p>
       </div>
     </div>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="glass-panel rounded-[28px] border border-white/5 p-5">
              {editingId === user.id ? (
                <div className="grid-form two-col">
                  <Input
                    label="Username"
                    icon={User}
                    value={editForm.username}
                    onChange={(event) => setEditForm((current) => ({ ...current, username: event.target.value }))}
                  />
                  <Input
                    label="New Password"
                    icon={KeyRound}
                    type="password"
                    hint="Min 8 chars with Aa1!"
                    allowPasswordToggle
                    autoComplete="new-password"
                    placeholder="Leave blank to keep current password"
                    value={editForm.password}
                    onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
                  />
                  <Input
                    label="Store Name"
                    icon={Store}
                    value={editForm.storeName}
                    onChange={(event) => setEditForm((current) => ({ ...current, storeName: event.target.value }))}
                  />
                  <Input
                    label="Store Code"
                    icon={Badge}
                    value={editForm.storeCode}
                    onChange={(event) => setEditForm((current) => ({ ...current, storeCode: event.target.value.toUpperCase() }))}
                  />
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-dark-input px-4 py-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={editForm.isActive}
                      onChange={(event) => setEditForm((current) => ({ ...current, isActive: event.target.checked }))}
                    />
                    Active
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button icon={Save} onClick={() => handleUpdate(user.id)}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gold-light">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/35">{user.storeCode}</p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{user.storeName}</h3>
                      <p className="mt-1 text-sm text-white/55">
                        {user.username} · {user.isActive ? "Active" : "Inactive"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" icon={History} href={`/history?storeCode=${user.storeCode}`}>
                      View History
                    </Button>
                    <Button variant="secondary" icon={SlidersHorizontal} href="/admin/settings">
                      Rates
                    </Button>
                    <Button
                      variant="secondary"
                      icon={KeyRound}
                      loading={resettingId === user.id}
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset Password
                    </Button>
                    <Button variant="secondary" icon={Pencil} onClick={() => startEdit(user)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      icon={Trash2}
                      onClick={() => handleDelete(user.id, user.storeName)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!users.length ? (
            <div className="glass-panel rounded-[32px] border border-white/5 p-8 text-center text-white/55">
              No store users found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
