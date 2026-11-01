"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "./shell";
import { Icon } from "./icons";
export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function login(demo = false) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, demo }),
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      router.push("/dashboard");
      router.refresh();
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
    <main className="login-page" id="main-content">
      <div className="login-brand">
        <Brand />
        <span>Fleet operations workspace</span>
      </div>
      <div className="login-content">
        <div className="login-intro">
          <span className="login-kicker">Kendali yang lebih terarah</span>
          <h1>
            Seluruh armada.
            <br />
            Satu pandangan.
          </h1>
          <p>
            Dari penugasan pertama hingga pengantaran terakhir. Kelola
            perjalanan, keselamatan, dan pertumbuhan mitra dari satu pusat
            kendali.
          </p>
          <div className="login-route">
            <span className="route-node" />
            <div />
            <span className="route-node hollow" />
            <div />
            <span className="route-node" />
          </div>
          <div className="login-features">
            <span>Pelacakan armada</span>
            <span>Dispatch terencana</span>
            <span>Ekuitas transparan</span>
          </div>
        </div>
        <section className="login-form">
          <h2>Masuk ke workspace</h2>
          <p>Selamat datang kembali di FLEETRA.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login();
            }}
          >
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
                autoComplete="current-password"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
              />
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="full-width">
              {loading ? "Membuka workspace" : "Masuk ke workspace"}
              <Icon name="arrow" />
            </Button>
          </form>
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
          <p className="login-note">
            Akses demo sebagai Fleet Manager. Semua data operasional merupakan
            simulasi.
          </p>
        </section>
      </div>
      <footer>
        FLEETRA Intelligent Fleet Management<span>ADIKARA 2026</span>
      </footer>
    </main>
  );
}
