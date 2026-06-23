"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, authClient } from "@/lib/auth-client";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function PasswordInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <div style={{ position: "relative" }}>
        <input
          className="input" type={show ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ paddingRight: "2.5rem" }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: show ? "var(--gold)" : "var(--text-muted)",
            display: "flex", alignItems: "center", padding: 2,
            transition: "color 0.15s",
          }}
          tabIndex={-1}
          title={show ? "Hide password" : "Show password"}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </label>
  );
}

function LabelledInput({
  label, type = "text", value, onChange, placeholder, disabled,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--gold)", display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <input
        className="input" type={type} value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--navy-800)", border: "1px solid var(--border-strong)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ padding: "1.1rem 1.5rem", borderBottom: "1px solid var(--border-strong)", background: "var(--navy-900)" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</div>
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

function Alert({ msg, type }: { msg: string; type: "success" | "error" }) {
  const c = type === "success" ? "#34d399" : "#f87171";
  return (
    <div style={{ background: c + "12", border: `1px solid ${c}40`, borderRadius: 8, padding: "10px 14px", fontSize: "0.78rem", color: c, fontWeight: 600 }}>
      {msg}
    </div>
  );
}

export default function AccountClient() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Change Password
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Email verification
  const [verifyMsg, setVerifyMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Update name
  const [displayName, setDisplayName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [nameLoading, setNameLoading] = useState(false);

  if (isPending) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 600, textTransform: "uppercase" }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const user = session.user;
  const initName = displayName || user.name || "";

  async function handleChangeName(e: React.FormEvent) {
    e.preventDefault();
    if (!initName.trim()) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      const { error } = await authClient.updateUser({ name: initName.trim() });
      if (error) { setNameMsg({ text: error.message || "Failed to update name", type: "error" }); }
      else { setNameMsg({ text: "Display name updated!", type: "success" }); }
    } catch {
      setNameMsg({ text: "Something went wrong.", type: "error" });
    }
    setNameLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 8) { setPwdMsg({ text: "New password must be at least 8 characters.", type: "error" }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ text: "New passwords do not match.", type: "error" }); return; }
    setPwdLoading(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: curPwd,
        newPassword: newPwd,
        revokeOtherSessions: true,
      });
      if (error) { setPwdMsg({ text: error.message || "Incorrect current password.", type: "error" }); }
      else {
        setPwdMsg({ text: "Password changed successfully!", type: "success" });
        setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      }
    } catch {
      setPwdMsg({ text: "Something went wrong.", type: "error" });
    }
    setPwdLoading(false);
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail.trim() || !newEmail.includes("@")) {
      setEmailMsg({ text: "Enter a valid email address.", type: "error" });
      return;
    }
    if (newEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      setEmailMsg({ text: "That's already your current email.", type: "error" });
      return;
    }
    setEmailLoading(true);
    try {
      const { error } = await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL: "/account",
      });
      if (error) {
        setEmailMsg({ text: error.message || "Could not request email change.", type: "error" });
      } else {
        setEmailMsg({ text: `Confirmation link sent to ${newEmail.trim()}. Click it to complete the change.`, type: "success" });
        setNewEmail("");
      }
    } catch {
      setEmailMsg({ text: "Something went wrong.", type: "error" });
    }
    setEmailLoading(false);
  }

  async function handleSendVerification() {
    setVerifyLoading(true);
    setVerifyMsg(null);
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/",
      });
      if (error) { setVerifyMsg({ text: error.message || "Could not send verification email.", type: "error" }); }
      else { setVerifyMsg({ text: `Verification email sent to ${user.email}. Check your inbox!`, type: "success" }); }
    } catch {
      setVerifyMsg({ text: "Could not send email. Check server configuration.", type: "error" });
    }
    setVerifyLoading(false);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--cream)", textTransform: "uppercase", letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>Account Settings</h1>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Manage your profile and security</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Profile Info */}
        <Section title="Profile">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, var(--gold), var(--gold-dark))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 900, color: "var(--navy-900)", flexShrink: 0 }}>
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, color: "var(--cream)", fontSize: "0.95rem" }}>{user.name || "No name set"}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>{user.email}</div>
            </div>
          </div>
          <form onSubmit={handleChangeName} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <LabelledInput label="Display Name" value={initName} onChange={setDisplayName} placeholder="Your name" />
            {nameMsg && <Alert msg={nameMsg.text} type={nameMsg.type} />}
            <button type="submit" className="btn" disabled={nameLoading} style={{ alignSelf: "flex-start" }}>
              {nameLoading ? "Saving…" : "Update Name"}
            </button>
          </form>
        </Section>

        {/* Change Email */}
        <Section title="Change Email">
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.6 }}>
            A confirmation link will be sent to your new email. Click it to complete the change.
          </p>
          <form onSubmit={handleChangeEmail} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <LabelledInput label="Current Email" value={user.email} onChange={() => {}} disabled />
            <LabelledInput label="New Email" type="email" value={newEmail} onChange={setNewEmail} placeholder="Enter new email address" />
            {emailMsg && <Alert msg={emailMsg.text} type={emailMsg.type} />}
            <button type="submit" className="btn" disabled={emailLoading} style={{ alignSelf: "flex-start" }}>
              {emailLoading ? "Sending…" : "Send Confirmation Link"}
            </button>
          </form>
        </Section>

        {/* Email Verification */}
        <Section title="Email Verification">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.82rem", color: "var(--cream)", fontWeight: 600 }}>{user.email}</div>
              <div style={{ marginTop: 5 }}>
                {user.emailVerified ? (
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 5, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    ✓ Verified
                  </span>
                ) : (
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#fb923c", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 5, padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    ⚠ Not verified
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn"
              onClick={handleSendVerification}
              disabled={verifyLoading || !!user.emailVerified}
              style={{ whiteSpace: "nowrap" }}
            >
              {verifyLoading ? "Sending…" : user.emailVerified ? "Already Verified" : "Send Verification Email"}
            </button>
          </div>
          {verifyMsg && <div style={{ marginTop: "1rem" }}><Alert msg={verifyMsg.text} type={verifyMsg.type} /></div>}
        </Section>

        {/* Change Password */}
        <Section title="Change Password">
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <PasswordInput label="Current Password" value={curPwd} onChange={setCurPwd} placeholder="Enter current password" />
            <PasswordInput label="New Password" value={newPwd} onChange={setNewPwd} placeholder="Minimum 8 characters" />
            <PasswordInput label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Repeat new password" />
            {pwdMsg && <Alert msg={pwdMsg.text} type={pwdMsg.type} />}
            <button type="submit" className="btn" disabled={pwdLoading} style={{ alignSelf: "flex-start" }}>
              {pwdLoading ? "Updating…" : "Change Password"}
            </button>
          </form>
        </Section>

      </div>
    </div>
  );
}
