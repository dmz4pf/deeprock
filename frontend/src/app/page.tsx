"use client";

import { useRouter } from "next/navigation";
import { QGLandingPage } from "@/components/previews/quantum-grid/pages/QGLandingPage";

export default function LandingPage() {
  const router = useRouter();
  return (
    <div style={{
      color: "#F0EBE0",
      minHeight: "100vh",
    }}>
      <QGLandingPage
        onLaunch={() => router.push("/pools")}
        onDocs={() => router.push("/documents")}
      />
    </div>
  );
}
