"use client";

import { RecoveryFlow } from "@/components/features/auth";
import { QGPageEntrance } from "@/components/previews/quantum-grid/primitives";

export default function RecoverPage() {
  return (
    <QGPageEntrance>
      <RecoveryFlow />
    </QGPageEntrance>
  );
}
