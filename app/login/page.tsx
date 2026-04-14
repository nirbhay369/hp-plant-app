"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 🔐 Hardcoded credentials
  const USER_EMAIL = process.env.NEXT_PUBLIC_USER_EMAIL;
const USER_PASSWORD = process.env.NEXT_PUBLIC_USER_PASSWORD;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();


    if (email === USER_EMAIL && password === USER_PASSWORD) {
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "/"; // 🔥 better than router.push for refresh
    } else {
      alert("Invalid email or password");
    }
  };

  return (
    <div className="flex flex-col flex-grow items-center justify-center w-full min-h-[calc(100vh-100px)]">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">
          🌿 Login
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}