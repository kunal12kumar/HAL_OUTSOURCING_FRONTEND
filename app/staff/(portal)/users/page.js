"use client";

import { useRef, useState } from "react";
import FormModal from "@/components/FormModal";
import RegisterList from "@/components/RegisterList";
import { useUser } from "@/components/Shell";
import { Alert, Badge, Button } from "@/components/ui";
import { staff } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/format";

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

export default function Page() {
  const me = useUser();
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("");
  const reloadRef = useRef(() => {});

  if (me.role !== "ADMIN") return <Alert tone="amber">Only the HAL Administrator manages users.</Alert>;

  return (
    <>
      {message && (
        <div className="mb-4">
          <Alert tone="green">{message}</Alert>
        </div>
      )}
      <RegisterList
        title="Users"
        subtitle="HAL staff accounts. The administrator manages access but cannot approve, estimate or inspect on anyone's behalf."
        path="users"
        searchable={false}
        headerActions={<Button onClick={() => setModal({ type: "add" })}>Add user</Button>}
        columns={(reload) => {
          reloadRef.current = reload;
          return [
            { key: "username", label: "Username", render: (u) => <span className="font-mono text-xs">{u.username}</span> },
            { key: "name", label: "Name", render: (u) => `${u.first_name} ${u.last_name}`.trim() || "-" },
            { key: "role_label", label: "Role" },
            { key: "employee_id", label: "Employee ID", render: (u) => u.employee_id || "-" },
            { key: "is_active", label: "Status", render: (u) => <Badge tone={u.is_active ? "green" : "red"}>{u.is_active ? "Active" : "Disabled"}</Badge> },
            {
              key: "do",
              label: "",
              render: (u) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "reset", u })}>Reset password</Button>
                  {u.id !== me.id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        await staff(`users/${u.id}/`, { method: "PATCH", body: { is_active: !u.is_active } });
                        reloadRef.current();
                      }}
                    >
                      {u.is_active ? "Disable" : "Enable"}
                    </Button>
                  )}
                </div>
              ),
            },
          ];
        }}
      />

      {modal?.type === "add" && (
        <FormModal
          title="Add user"
          hint="The user must change this password at first sign-in."
          fields={[
            { name: "username", label: "Username", required: true },
            { name: "first_name", label: "First name" },
            { name: "last_name", label: "Last name" },
            { name: "email", label: "Email", type: "email" },
            { name: "employee_id", label: "Employee ID" },
            { name: "role", label: "Role", type: "select", required: true, options: ROLE_OPTIONS },
            { name: "password", label: "Temporary password", type: "password", required: true, help: "At least 10 characters." },
          ]}
          onClose={() => setModal(null)}
          onSubmit={async (values) => {
            await staff("users/", { method: "POST", body: values });
            setModal(null);
            reloadRef.current();
          }}
        />
      )}
      {modal?.type === "reset" && (
        <FormModal
          title={`Reset password for ${modal.u.username}`}
          fields={[{ name: "new_password", label: "New temporary password", type: "password", required: true }]}
          onClose={() => setModal(null)}
          onSubmit={async (values) => {
            await staff(`users/${modal.u.id}/reset-password/`, { method: "POST", body: values });
            setModal(null);
            setMessage(`Password reset for ${modal.u.username}. They must change it at next sign-in.`);
          }}
        />
      )}
    </>
  );
}
