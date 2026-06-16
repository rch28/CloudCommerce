"use client";

import { useEffect, useState } from "react";
import { getMe } from "@/services/auth";
import type { User } from "@/services/auth";

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe().then((res) => {
      if (res.loggedIn) setUser(res.user);
    });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {user && (
        <div className="bg-zinc-800 rounded-lg p-4 space-y-1">
          <p>
            <span className="text-zinc-400">Name:</span> {user.name}
          </p>
          <p>
            <span className="text-zinc-400">Email:</span> {user.email}
          </p>
          <p>
            <span className="text-zinc-400">Role:</span> {user.role}
          </p>
        </div>
      )}
    </div>
  );
}
