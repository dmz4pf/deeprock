"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useBiometric } from "@/hooks/useBiometric";
import { useAuthStore } from "@/stores/authStore";
import { ArrowLeft, Fingerprint, Trash2, Plus, Smartphone, Laptop, Key } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { QGScrollReveal } from "@/components/previews/quantum-grid/primitives/QGScrollReveal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface Passkey {
  id: string;
  credentialIdPreview: string;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function PasskeysPage() {
  const { user, csrfToken } = useAuthStore();
  const { addPasskey, isRegistering, error: registerError } = useBiometric();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPasskeys = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/auth/passkeys`, { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setPasskeys(data.passkeys);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Failed to load passkeys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passkey?")) return;

    try {
      setDeleting(id);
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
      const res = await fetch(`${API_URL}/auth/passkeys/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setPasskeys((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Failed to delete passkey");
    } finally {
      setDeleting(null);
    }
  };

  const handleAddPasskey = async () => {
    const result = await addPasskey();
    if (result.success) {
      fetchPasskeys(); // Refresh the list
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === "singleDevice") return Smartphone;
    if (deviceType === "multiDevice") return Key;
    return Laptop;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="container py-6 space-y-6 max-w-3xl">
        {/* Back link */}
        <div className="page-enter-up">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-forge-text-3 hover:text-forge-text-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Link>
        </div>

        <QGScrollReveal staggerIndex={1} direction="scale">
        <Card className="border-forge-copper/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-forge-text-1">
                  <Fingerprint className="h-5 w-5" />
                  Your Passkeys
                </CardTitle>
                <CardDescription className="text-forge-text-3">
                  Manage your registered passkeys for biometric login
                </CardDescription>
              </div>
              <Button
                onClick={handleAddPasskey}
                disabled={isRegistering}
                className="bg-forge-copper hover:bg-forge-copper/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isRegistering ? "Adding..." : "Add Passkey"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {registerError && (
              <p className="text-sm text-forge-danger bg-forge-danger/10 p-3 rounded-lg">{registerError}</p>
            )}

            {error && (
              <p className="text-sm text-forge-danger bg-forge-danger/10 p-3 rounded-lg">{error}</p>
            )}

            {loading ? (
              <div className="text-center py-8 text-forge-text-3">Loading passkeys...</div>
            ) : passkeys.length === 0 ? (
              <div className="text-center py-8 text-forge-text-3">
                <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No passkeys registered yet.</p>
                <p className="text-sm">Click "Add Passkey" to register your first one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passkeys.map((passkey) => {
                  const DeviceIcon = getDeviceIcon(passkey.deviceType);
                  return (
                    <div
                      key={passkey.id}
                      className="flex items-center justify-between rounded-lg border border-forge-copper/10 p-4 hover:border-forge-copper/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "rounded-lg p-2",
                          passkey.backedUp ? "bg-forge-copper/10" : "bg-forge-copper/5"
                        )}>
                          <DeviceIcon className={cn(
                            "h-5 w-5",
                            passkey.backedUp ? "text-forge-copper" : "text-forge-text-3"
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-forge-text-1">
                            {passkey.deviceType === "multiDevice" ? "Synced Passkey" : "Device Passkey"}
                            {passkey.backedUp && (
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-forge-copper/10 text-forge-copper">
                                Backed up
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-forge-text-3">
                            Added {formatDate(passkey.createdAt)}
                          </p>
                          {passkey.lastUsedAt && (
                            <p className="text-xs text-forge-text-3">
                              Last used {formatDate(passkey.lastUsedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-forge-text-3 hover:text-forge-danger hover:bg-forge-danger/10"
                        onClick={() => handleDelete(passkey.id)}
                        disabled={deleting === passkey.id || passkeys.length <= 1}
                        title={passkeys.length <= 1 ? "Cannot delete your only passkey" : "Delete passkey"}
                      >
                        {deleting === passkey.id ? (
                          <span className="animate-spin">...</span>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {passkeys.length === 1 && (
              <p className="text-xs text-forge-text-3 text-center">
                You cannot delete your only passkey. Add another one first.
              </p>
            )}
          </CardContent>
        </Card>
        </QGScrollReveal>
      </div>
    </>
  );
}
