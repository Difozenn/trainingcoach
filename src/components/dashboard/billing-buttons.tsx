"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading}>
      {loading ? "Redirecting..." : "Upgrade to Pro — $9.99/mo"}
    </Button>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleManage} disabled={loading}>
      {loading ? "Redirecting..." : "Manage Subscription"}
    </Button>
  );
}
