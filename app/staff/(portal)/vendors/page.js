"use client";

import { useRef, useState } from "react";
import FormModal from "@/components/FormModal";
import RegisterList from "@/components/RegisterList";
import { Alert, Button, Modal, StateBadge } from "@/components/ui";
import { staff } from "@/lib/api";
import { dateTime } from "@/lib/format";

const FIELDS = [
  { name: "name", label: "Company name", required: true },
  { name: "contact_person", label: "Contact person" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "gstin", label: "GSTIN" },
  { name: "address", label: "Address", type: "textarea" },
];

function Credentials({ result, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Username: ${result.username}\nTemporary password: ${result.temporary_password}`;
  return (
    <Modal title={`Portal login for ${result.vendor.name}`} onClose={onClose}>
      <div className="space-y-4">
        <Alert tone="amber">This password is shown only once. Give it to the vendor through a secure channel. They must change it the first time they sign in.</Alert>
        <pre className="whitespace-pre-wrap rounded-md bg-slate-900 p-4 text-sm text-emerald-300">{text}</pre>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard?.writeText(text).catch(() => {});
              setCopied(true);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={onClose}>I have noted it</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Page() {
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState("");
  const reloadRef = useRef(() => {});

  async function act(vendor, action) {
    setMessage("");
    try {
      const res = await staff(`vendors/${vendor.id}/${action}/`, { method: "POST" });
      if (action === "issue-credentials") setModal({ type: "credentials", res });
      reloadRef.current();
    } catch (e) {
      setMessage(e.message);
    }
  }

  return (
    <>
      {message && (
        <div className="mb-4">
          <Alert>{message}</Alert>
        </div>
      )}
      <RegisterList
        title="Vendors"
        subtitle="Vendors register here. A portal login can be issued only once the vendor has been awarded an order."
        path="vendors"
        searchable
        headerActions={<Button onClick={() => setModal({ type: "add" })}>Register vendor</Button>}
        columns={(reload) => {
          reloadRef.current = reload;
          return [
            { key: "code", label: "Code", nowrap: true },
            { key: "name", label: "Vendor", render: (v) => <div><p className="font-medium text-slate-800">{v.name}</p><p className="text-xs text-slate-500">{v.contact_person} {v.email}</p></div> },
            { key: "order_count", label: "Orders", align: "right" },
            { key: "status", label: "Portal access", render: (v) => <StateBadge state={v.status} label={v.status_label} /> },
            { key: "login_username", label: "Login", render: (v) => (v.login_username ? <span><span className="font-mono text-xs">{v.login_username}</span><p className="text-xs text-slate-500">issued {dateTime(v.credentials_issued_at)}</p></span> : "-") },
            {
              key: "do",
              label: "",
              render: (v) => (
                <div className="flex flex-wrap justify-end gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ type: "edit", v })}>Edit</Button>
                  {v.status !== "SUSPENDED" && (
                    <Button
                      size="sm"
                      disabled={v.order_count === 0}
                      title={v.order_count === 0 ? "Available once the vendor has been awarded an order" : undefined}
                      onClick={() => act(v, "issue-credentials")}
                    >
                      {v.login_username ? "Reset login" : "Issue login"}
                    </Button>
                  )}
                  {v.status === "SUSPENDED" ? (
                    <Button size="sm" variant="secondary" onClick={() => act(v, "reactivate")}>Reactivate</Button>
                  ) : (
                    <Button size="sm" variant="danger" onClick={() => window.confirm(`Suspend ${v.name}? Their portal login stops working immediately.`) && act(v, "suspend")}>Suspend</Button>
                  )}
                </div>
              ),
            },
          ];
        }}
      />

      {(modal?.type === "add" || modal?.type === "edit") && (
        <FormModal
          title={modal.type === "add" ? "Register vendor" : `Edit ${modal.v.name}`}
          fields={FIELDS}
          initial={modal.v}
          onClose={() => setModal(null)}
          onSubmit={async (values) => {
            if (modal.type === "add") await staff("vendors/", { method: "POST", body: values });
            else await staff(`vendors/${modal.v.id}/`, { method: "PATCH", body: values });
            setModal(null);
            reloadRef.current();
          }}
        />
      )}
      {modal?.type === "credentials" && (
        <Credentials
          result={modal.res}
          onClose={() => {
            setModal(null);
          }}
        />
      )}
    </>
  );
}
