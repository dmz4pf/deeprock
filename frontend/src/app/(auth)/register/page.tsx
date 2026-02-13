"use client";

import { useRouter } from "next/navigation";
import { BiometricRegister } from "@/components/auth/BiometricRegister";
import { useAuthStore } from "@/stores/authStore";
import { QGPageEntrance } from "@/components/previews/quantum-grid/primitives";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleSuccess = (user: { id: string; email: string; walletAddress: string }) => {
    // After registration, the user needs to login
    // Redirect to login page with a success message
    router.push("/login?registered=true");
  };

  return (
    <QGPageEntrance>
      <BiometricRegister
        onSuccess={handleSuccess}
        onLoginClick={() => router.push("/login")}
      />
    </QGPageEntrance>
  );
}
