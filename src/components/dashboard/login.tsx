"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User } from "lucide-react";
import { Brand } from "./shell";
import { Icon } from "./icons";
import { LoginHero3D } from "./login-hero-3d";
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
      {/* Ambient animated 3D atmosphere */}
      <div className="login-bg-glows" aria-hidden="true">
        <div className="login-glow-orb orb-primary" />
        <div className="login-glow-orb orb-cyan" />
        <div className="login-glow-orb orb-indigo" />
        <div className="login-grid-mesh" />

        {/* Floating 3D Isometric Tech Cubes & Particles (top-right background) */}
        <div className="login-tech-cubes">
          <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cubeTop1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#7dd3fc" />
              </linearGradient>
              <linearGradient id="cubeLeft1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="cubeRight1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="cubeWire" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Wireframe Cube */}
            <g transform="translate(180, 75) scale(0.95)" stroke="url(#cubeWire)" strokeWidth="1.5" fill="none" opacity="0.85">
              <polygon points="40,10 75,30 40,50 5,30" />
              <line x1="5" y1="30" x2="5" y2="70" />
              <line x1="75" y1="30" x2="75" y2="70" />
              <line x1="40" y1="50" x2="40" y2="90" />
              <polygon points="40,90 75,70 40,50 5,70" />
            </g>
            {/* Solid Isometric Cube 1 */}
            <g transform="translate(90, 25) scale(0.7)">
              <polygon points="30,5 55,20 30,35 5,20" fill="url(#cubeTop1)" />
              <polygon points="5,20 30,35 30,65 5,50" fill="url(#cubeLeft1)" />
              <polygon points="30,35 55,20 55,50 30,65" fill="url(#cubeRight1)" />
            </g>
            {/* Solid Isometric Cube 2 */}
            <g transform="translate(200, 170) scale(0.48)">
              <polygon points="30,5 55,20 30,35 5,20" fill="url(#cubeTop1)" />
              <polygon points="5,20 30,35 30,65 5,50" fill="url(#cubeLeft1)" />
              <polygon points="30,35 55,20 55,50 30,65" fill="url(#cubeRight1)" />
            </g>
            {/* Floating Diamond Particles */}
            <polygon points="65,95 71,101 65,107 59,101" fill="#38bdf8" opacity="0.85" />
            <polygon points="145,45 150,50 145,55 140,50" fill="#0284c7" opacity="0.75" />
            <polygon points="240,95 246,101 240,107 234,101" fill="#60a5fa" opacity="0.9" />
            <polygon points="225,35 230,40 225,45 220,40" fill="#0284c7" opacity="0.65" />
            <polygon points="125,120 129,124 125,128 121,124" fill="#38bdf8" opacity="0.8" />
            <polygon points="255,145 260,150 255,155 250,150" fill="#2563eb" opacity="0.75" />
            <polygon points="180,25 183,28 180,31 177,28" fill="#38bdf8" opacity="0.65" />
            <polygon points="95,145 99,149 95,153 91,149" fill="#0284c7" opacity="0.55" />
          </svg>
        </div>
      </div>
      <div className="login-brand">
        <Brand />
        <span>Fleet operations workspace</span>
      </div>
      <div className="login-content">
        <LoginHero3D registering={registering} />
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
                <div className="form-input-wrap">
                  <Input
                    id="register-name"
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    disabled={loading}
                    className="input-with-icon"
                  />
                  <User className="field-adornment-icon" aria-hidden="true" />
                </div>
              </div>
            )}
            <div className="form-field">
              <Label htmlFor="email">Email operator</Label>
              <div className="form-input-wrap">
                <Input
                  autoComplete="username"
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="input-with-icon"
                />
                <Mail className="field-adornment-icon" aria-hidden="true" />
              </div>
            </div>
            <div className="form-field">
              <Label htmlFor="password">Kata sandi</Label>
              <div className="form-input-wrap">
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
                  className="input-with-icon"
                />
                <Lock className="field-adornment-icon" aria-hidden="true" />
              </div>
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
                  <div className="form-input-wrap">
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
                      className="input-with-icon"
                    />
                    <Lock className="field-adornment-icon" aria-hidden="true" />
                  </div>
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
            {registering ? "Sudah punya akun? " : "Belum punya akun? "}
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
