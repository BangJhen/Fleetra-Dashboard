"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "./shell";
import { Icon } from "./icons";
export function LoginForm({ mode = "login" }: { mode?: "login" | "register" }) {
  const registering = mode === "register";
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function login(demo = false) {
    setLoading(true);
    setError("");
    try {
      if (registering && password !== confirmPassword)
        throw Error("Konfirmasi kata sandi tidak cocok.");
      const res = await fetch(registering ? "/api/register" : "/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          registering
            ? { name, email, password, confirmPassword }
            : { email, password, demo },
        ),
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      if (registering) toast.success("Akun berhasil dibuat.");
      router.push("/dashboard");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Tidak dapat masuk. Periksa koneksi Anda.",
      );
      setLoading(false);
    }
  }
  return (
    <main
      className={registering ? "login-page register-page" : "login-page"}
      id="main-content"
    >
      <div className="login-brand">
        <Brand />
        <span>Fleet operations workspace</span>
      </div>
      <div className="login-content">
        <div className="login-intro">
          <span className="login-kicker">
            {registering
              ? "Workspace untuk tim operasional"
              : "Kendali yang lebih terarah"}
          </span>
          <h1>
            {registering ? (
              <>
                Mulai bersama.
                <br /> Bergerak terarah.
              </>
            ) : (
              <>
                Seluruh armada.
                <br /> Satu pandangan.
              </>
            )}
          </h1>
          <p>
            Dari penugasan pertama hingga pengantaran terakhir. Kelola
            perjalanan, keselamatan, dan pertumbuhan mitra dari satu pusat
            kendali.
          </p>
          <div className="auth-illustration">
            <Image
              src="/images/fleetra-auth-illustration.png"
              alt="Ilustrasi armada pengiriman FLEETRA di kawasan gudang dan perkotaan"
              width={1536}
              height={1024}
              sizes="(max-width: 560px) 350px, (max-width: 900px) 520px, 560px"
              priority
            />
          </div>
        </div>
        <section className="login-form">
          <h2>{registering ? "Buat akun FLEETRA" : "Masuk ke workspace"}</h2>
          <p>
            {registering
              ? "Daftarkan akun operator untuk memulai."
              : "Selamat datang kembali di FLEETRA."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
            {registering && (
              <div className="form-field">
                <Label htmlFor="register-name">Nama lengkap</Label>
                <Input
                  id="register-name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  disabled={loading}
                />
              </div>
            )}
            <div className="form-field">
              <Label htmlFor="email">Email operator</Label>
              <Input
                autoComplete="username"
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
              />
            </div>
            <div className="form-field">
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                autoComplete={registering ? "new-password" : "current-password"}
                minLength={registering ? 12 : undefined}
                maxLength={128}
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
              />
            </div>
            {registering && (
              <>
                <p className="password-help">
                  Gunakan 12 sampai 128 karakter untuk kata sandi.
                </p>
                <div className="form-field">
                  <Label htmlFor="confirm-password">
                    Konfirmasi kata sandi
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    disabled={loading}
                    placeholder="Ulangi kata sandi"
                  />
                </div>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="full-width">
              {loading
                ? registering
                  ? "Membuat akun"
                  : "Membuka workspace"
                : registering
                  ? "Daftar akun"
                  : "Masuk ke workspace"}
              <Icon name="arrow" />
            </Button>
          </form>
          <p className="auth-switch">
            {registering ? "Sudah punya akun" : "Belum punya akun"}
            <Link href={registering ? "/login" : "/register"}>
              {registering ? "Masuk sekarang" : "Daftar sekarang"}
            </Link>
          </p>
          {!registering && (
            <>
              <div className="login-or">atau jelajahi prototipe</div>
              <Button
                variant="outline"
                className="full-width"
                disabled={loading}
                onClick={() => login(true)}
              >
                Buka dashboard demo
                <Icon name="arrow" />
              </Button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
