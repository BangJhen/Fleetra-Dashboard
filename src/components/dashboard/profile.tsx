"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFleet } from "./provider";
import { PageHeading, Initials } from "./common";
import { Icon } from "./icons";
import type { OperatorProfile } from "@/lib/types";
import { defaultOperatorProfile } from "@/lib/operator-profile";
function ProfileEditor({
  profile,
  onClose,
}: {
  profile: OperatorProfile;
  onClose: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mutate = useFleet((s) => s.mutate);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await mutate({
        action: "update-profile",
        name,
        email,
        phone,
        version: profile.version,
      });
      toast.success("Profil berhasil diperbarui.");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profil gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profil</DialogTitle>
          <DialogDescription>
            Perbarui identitas dan informasi kontak operator.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="form-field">
            <Label htmlFor="profile-name">Nama lengkap</Label>
            <Input
              id="profile-name"
              autoComplete="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-field">
            <Label htmlFor="profile-email">Email kontak</Label>
            <Input
              id="profile-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <small>
              Email kontak tidak mengubah email yang digunakan untuk login.
            </small>
          </div>
          <div className="form-field">
            <Label htmlFor="profile-phone">Nomor telepon</Label>
            <Input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              maxLength={25}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opsional"
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan" : "Simpan profil"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function Profile() {
  const workspace = useFleet((s) => s.data.workspace);
  const profile = useFleet(
    (s) => s.data.operatorProfile || defaultOperatorProfile,
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const res = await fetch("/api/auth", { method: "DELETE" });
      if (!res.ok) throw Error();
      window.location.replace("/login");
    } catch {
      toast.error("Tidak dapat keluar. Coba lagi.");
      setBusy(false);
    }
  }
  return (
    <div className="page">
      <PageHeading
        title="Profil"
        description="Kelola identitas dan informasi kontak Anda."
      >
        <Button onClick={() => setEditing(true)}>Edit profil</Button>
      </PageHeading>
      <section className="profile-surface" aria-label="Informasi profil">
        <div className="settings-profile">
          <Initials name={profile.name} />
          <div>
            <h3>{profile.name}</h3>
            <p>{profile.email}</p>
          </div>
        </div>
        <div className="profile-sections">
        <section className="profile-section">
          <h2>Informasi kontak</h2>
          <dl className="profile-details">
          <div>
            <dt>Nama lengkap</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Email kontak</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Nomor telepon</dt>
            <dd>{profile.phone || "Belum diisi"}</dd>
          </div>
          </dl>
        </section>
        <section className="profile-section">
          <h2>Ruang kerja</h2>
          <dl className="profile-details">
          <div>
            <dt>Workspace</dt>
            <dd>{workspace.name}</dd>
          </div>
          <div>
            <dt>Wilayah operasi</dt>
            <dd>{workspace.region}</dd>
          </div>
          <div>
            <dt>Zona waktu</dt>
            <dd>Waktu Indonesia Barat</dd>
          </div>
          </dl>
        </section>
        </div>
        <div className="profile-actions"><Button variant="outline" disabled={busy} onClick={logout}>
          <Icon name="logout" />
          {busy ? "Keluar dari workspace" : "Keluar dari akun"}
        </Button></div>
      </section>
      {editing && (
        <ProfileEditor profile={profile} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
