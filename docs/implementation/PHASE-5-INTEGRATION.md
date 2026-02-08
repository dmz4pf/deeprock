# Phase 5: Integration & Testing (Days 29-35)


---

## Overview

**Duration:** Days 29-35 (Week 5)
**Complexity:** Medium-High
**Dependencies:** Phases 1-4 complete, all contracts deployed to Fuji, backend APIs functional, frontend core built

**Objectives:**
- Complete end-to-end integration flows
- Build DocumentSeal UI for document verification
- Implement portfolio tracking and analytics
- Ensure mobile responsiveness across all views
- Comprehensive error handling and edge cases

---

## Task 5.1: End-to-End Flow Integration

**Objective:** Wire up the complete user journey from registration to investment.

**Files:**
- Create: `frontend/app/(app)/invest/[poolId]/page.tsx`
- Create: `frontend/lib/flows/investment-flow.ts`
- Create: `frontend/lib/flows/registration-flow.ts`
- Create: `tests/e2e/flows/full-investment.spec.ts`
- Create: `tests/e2e/flows/registration.spec.ts`

### Step 1: Create Investment Flow Orchestrator

```typescript
// frontend/lib/flows/investment-flow.ts
import { useAuthStore } from '@/stores/auth-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { apiClient } from '@/lib/api-client';
import { startAuthentication } from '@simplewebauthn/browser';

export interface InvestmentFlowState {
  step: 'idle' | 'selecting' | 'authenticating' | 'signing' | 'submitting' | 'confirming' | 'complete' | 'error';
  poolId: string | null;
  amount: bigint | null;
  txHash: string | null;
  error: string | null;
}

export class InvestmentFlowOrchestrator {
  private state: InvestmentFlowState = {
    step: 'idle',
    poolId: null,
    amount: null,
    txHash: null,
    error: null,
  };

  private listeners: Set<(state: InvestmentFlowState) => void> = new Set();

  subscribe(listener: (state: InvestmentFlowState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  async startInvestment(poolId: string, amount: bigint): Promise<void> {
    try {
      // Step 1: Initialize
      this.state = { ...this.state, step: 'selecting', poolId, amount, error: null };
      this.notify();

      // Step 2: Request authentication challenge
      this.state.step = 'authenticating';
      this.notify();

      const { session } = useAuthStore.getState();
      if (!session?.credentialId) {
        throw new Error('No authenticated session');
      }

      const authOptions = await apiClient.auth.getLoginOptions(session.credentialId);

      // Step 3: Biometric sign
      this.state.step = 'signing';
      this.notify();

      const assertion = await startAuthentication(authOptions);

      // Step 4: Submit to relayer
      this.state.step = 'submitting';
      this.notify();

      const { txHash } = await apiClient.pools.invest({
        poolId,
        amount: amount.toString(),
        assertion,
      });

      // Step 5: Wait for confirmation
      this.state.step = 'confirming';
      this.state.txHash = txHash;
      this.notify();

      // Add to transaction store for tracking
      useTransactionStore.getState().addTransaction({
        hash: txHash,
        type: 'invest',
        status: 'pending',
        poolId,
        amount,
        timestamp: Date.now(),
      });

      // Poll for confirmation
      const confirmed = await this.waitForConfirmation(txHash);

      if (confirmed) {
        this.state.step = 'complete';
        useTransactionStore.getState().updateTransaction(txHash, { status: 'confirmed' });
      } else {
        throw new Error('Transaction failed');
      }

      this.notify();
    } catch (error) {
      this.state.step = 'error';
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.notify();

      if (this.state.txHash) {
        useTransactionStore.getState().updateTransaction(this.state.txHash, { status: 'failed' });
      }
    }
  }

  private async waitForConfirmation(txHash: string, maxAttempts = 30): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 2000)); // Poll every 2s

      const status = await apiClient.transactions.getStatus(txHash);
      if (status.confirmed) return true;
      if (status.failed) return false;
    }
    return false;
  }

  reset() {
    this.state = {
      step: 'idle',
      poolId: null,
      amount: null,
      txHash: null,
      error: null,
    };
    this.notify();
  }
}

export const investmentFlow = new InvestmentFlowOrchestrator();
```

### Step 2: Create Registration Flow Orchestrator

```typescript
// frontend/lib/flows/registration-flow.ts
import { apiClient } from '@/lib/api-client';
import { startRegistration } from '@simplewebauthn/browser';
import { useAuthStore } from '@/stores/auth-store';

export interface RegistrationFlowState {
  step: 'idle' | 'email' | 'webauthn' | 'verifying' | 'complete' | 'error';
  email: string | null;
  credentialId: string | null;
  error: string | null;
}

export class RegistrationFlowOrchestrator {
  private state: RegistrationFlowState = {
    step: 'idle',
    email: null,
    credentialId: null,
    error: null,
  };

  private listeners: Set<(state: RegistrationFlowState) => void> = new Set();

  subscribe(listener: (state: RegistrationFlowState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l({ ...this.state }));
  }

  async startRegistration(email: string): Promise<void> {
    try {
      this.state = { ...this.state, step: 'email', email, error: null };
      this.notify();

      // Get registration options from server
      const regOptions = await apiClient.auth.getRegisterOptions(email);

      // Start WebAuthn registration
      this.state.step = 'webauthn';
      this.notify();

      const credential = await startRegistration(regOptions);

      // Verify registration on server
      this.state.step = 'verifying';
      this.notify();

      const { session, user } = await apiClient.auth.verifyRegistration({
        email,
        credential,
      });

      // Store session
      useAuthStore.getState().setSession(session);
      useAuthStore.getState().setUser(user);

      this.state.step = 'complete';
      this.state.credentialId = credential.id;
      this.notify();
    } catch (error) {
      this.state.step = 'error';
      this.state.error = error instanceof Error ? error.message : 'Registration failed';
      this.notify();
    }
  }

  reset() {
    this.state = {
      step: 'idle',
      email: null,
      credentialId: null,
      error: null,
    };
    this.notify();
  }
}

export const registrationFlow = new RegistrationFlowOrchestrator();
```

### Step 3: Create E2E Test for Full Investment Flow

```typescript
// tests/e2e/flows/full-investment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Full Investment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock WebAuthn for testing
    await page.addInitScript(() => {
      (window as any).__MOCK_WEBAUTHN__ = true;
    });
  });

  test('user can complete investment from pool selection to confirmation', async ({ page }) => {
    // Login with test credentials
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in with passkey/i }).click();

    // Navigate to pools
    await page.waitForURL('/dashboard');
    await page.getByRole('link', { name: /pools/i }).click();

    // Select a pool
    await page.waitForURL('/pools');
    const poolCard = page.locator('[data-testid="pool-card"]').first();
    await poolCard.getByRole('button', { name: /invest/i }).click();

    // Enter investment amount
    await page.getByLabel(/amount/i).fill('1000');
    await page.getByRole('button', { name: /continue/i }).click();

    // Confirm investment (triggers WebAuthn)
    await page.getByRole('button', { name: /confirm.*biometric/i }).click();

    // Wait for confirmation
    await expect(page.getByText(/investment successful/i)).toBeVisible({ timeout: 30000 });

    // Verify portfolio updated
    await page.getByRole('link', { name: /portfolio/i }).click();
    await expect(page.getByText(/1,000/)).toBeVisible();
  });

  test('handles investment error gracefully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in with passkey/i }).click();
    await page.waitForURL('/dashboard');

    // Navigate to pool with insufficient balance mock
    await page.goto('/pools/test-pool-insufficient');

    // Attempt investment
    await page.getByLabel(/amount/i).fill('999999999');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should show error
    await expect(page.getByText(/insufficient/i)).toBeVisible({ timeout: 10000 });

    // Retry button should be available
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });
});
```

### Step 4: Run Integration Tests

```bash
# Run E2E tests
npx playwright test tests/e2e/flows/

# Expected: All tests pass
```

### Step 5: Commit

```bash
git add frontend/lib/flows/ tests/e2e/flows/
git commit -m "feat: add investment and registration flow orchestrators with E2E tests

- Investment flow handles full journey from selection to confirmation
- Registration flow manages WebAuthn credential creation
- E2E tests verify happy path and error handling

```

---

## Task 5.2: DocumentSeal UI

**Objective:** Build the interface for sealing and verifying documents.

**Files:**
- Create: `frontend/app/(app)/documents/page.tsx`
- Create: `frontend/app/(app)/documents/[hash]/page.tsx`
- Create: `frontend/components/documents/document-upload.tsx`
- Create: `frontend/components/documents/seal-form.tsx`
- Create: `frontend/components/documents/verification-result.tsx`
- Create: `frontend/hooks/use-document-seal.ts`

### Step 1: Create Document Seal Hook

```typescript
// frontend/hooks/use-document-seal.ts
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuthStore } from '@/stores/auth-store';

interface SealResult {
  txHash: string;
  documentHash: string;
  sealedAt: number;
}

interface VerifyResult {
  isSealed: boolean;
  sealer: string | null;
  sealedAt: number | null;
  metadata: string | null;
}

export function useDocumentSeal() {
  const [isSealing, setIsSealing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeHash = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const sealDocument = useCallback(async (
    file: File,
    metadata?: string
  ): Promise<SealResult> => {
    setIsSealing(true);
    setError(null);

    try {
      // Compute document hash
      const documentHash = await computeHash(file);

      // Check if already sealed
      const existing = await apiClient.documents.verify(documentHash);
      if (existing.isSealed) {
        throw new Error('Document is already sealed');
      }

      // Get authentication options
      const { session } = useAuthStore.getState();
      if (!session?.credentialId) {
        throw new Error('Not authenticated');
      }

      const authOptions = await apiClient.auth.getLoginOptions(session.credentialId);

      // Authenticate with biometrics
      const assertion = await startAuthentication(authOptions);

      // Submit seal request
      const result = await apiClient.documents.seal({
        documentHash,
        metadata: metadata || '',
        assertion,
      });

      return {
        txHash: result.txHash,
        documentHash,
        sealedAt: Date.now(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to seal document';
      setError(message);
      throw err;
    } finally {
      setIsSealing(false);
    }
  }, [computeHash]);

  const verifyDocument = useCallback(async (
    fileOrHash: File | string
  ): Promise<VerifyResult> => {
    setIsVerifying(true);
    setError(null);

    try {
      const documentHash = typeof fileOrHash === 'string'
        ? fileOrHash
        : await computeHash(fileOrHash);

      const result = await apiClient.documents.verify(documentHash);

      return {
        isSealed: result.isSealed,
        sealer: result.sealer,
        sealedAt: result.sealedAt,
        metadata: result.metadata,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify document';
      setError(message);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, [computeHash]);

  return {
    sealDocument,
    verifyDocument,
    computeHash,
    isSealing,
    isVerifying,
    error,
  };
}
```

### Step 2: Create Document Upload Component

```typescript
// frontend/components/documents/document-upload.tsx
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  accept?: Record<string, string[]>;
  maxSize?: number;
  disabled?: boolean;
}

export function DocumentUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg'],
    'application/json': ['.json'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      } else {
        setError('Invalid file type');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled,
  });

  if (selectedFile) {
    return (
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-sm">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onFileRemove}
            className="p-1 hover:bg-muted rounded"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-sm">Drop the file here...</p>
        ) : (
          <div>
            <p className="text-sm font-medium">
              Drag & drop a file here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, images, or JSON up to {maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
```

### Step 3: Create Seal Form Component

```typescript
// frontend/components/documents/seal-form.tsx
'use client';

import { useState } from 'react';
import { DocumentUpload } from './document-upload';
import { useDocumentSeal } from '@/hooks/use-document-seal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, CheckCircle } from 'lucide-react';

interface SealFormProps {
  onSuccess?: (result: { txHash: string; documentHash: string }) => void;
}

export function SealForm({ onSuccess }: SealFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState('');
  const [result, setResult] = useState<{ txHash: string; documentHash: string } | null>(null);

  const { sealDocument, computeHash, isSealing, error } = useDocumentSeal();
  const [previewHash, setPreviewHash] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    const hash = await computeHash(selectedFile);
    setPreviewHash(hash);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      const sealResult = await sealDocument(file, metadata);
      setResult(sealResult);
      onSuccess?.(sealResult);
    } catch {
      // Error handled by hook
    }
  };

  if (result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Document Sealed Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Document Hash</Label>
            <p className="font-mono text-xs break-all mt-1">{result.documentHash}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Transaction Hash</Label>
            <p className="font-mono text-xs break-all mt-1">{result.txHash}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setFile(null);
              setResult(null);
              setPreviewHash(null);
              setMetadata('');
            }}
          >
            Seal Another Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Seal Document
        </CardTitle>
        <CardDescription>
          Create an immutable on-chain record of your document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Document</Label>
            <DocumentUpload
              selectedFile={file}
              onFileSelect={handleFileSelect}
              onFileRemove={() => {
                setFile(null);
                setPreviewHash(null);
              }}
              disabled={isSealing}
            />
            {previewHash && (
              <p className="text-xs text-muted-foreground font-mono break-all">
                SHA-256: {previewHash}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata (Optional)</Label>
            <Input
              id="metadata"
              placeholder="e.g., Contract v1.0, Invoice #12345"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              maxLength={256}
              disabled={isSealing}
            />
            <p className="text-xs text-muted-foreground">
              Optional description stored on-chain ({256 - metadata.length} chars remaining)
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!file || isSealing}
            className="w-full"
          >
            {isSealing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sealing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Seal with Biometrics
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Create Verification Result Component

```typescript
// frontend/components/documents/verification-result.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VerificationResultProps {
  documentHash: string;
  isSealed: boolean;
  sealer: string | null;
  sealedAt: number | null;
  metadata: string | null;
}

export function VerificationResult({
  documentHash,
  isSealed,
  sealer,
  sealedAt,
  metadata,
}: VerificationResultProps) {
  return (
    <Card className={isSealed ? 'border-green-500/50' : 'border-yellow-500/50'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isSealed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-500" />
            )}
            Verification Result
          </span>
          <Badge variant={isSealed ? 'default' : 'secondary'}>
            {isSealed ? 'Verified' : 'Not Sealed'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Document Hash</p>
          <p className="font-mono text-xs break-all mt-1">{documentHash}</p>
        </div>

        {isSealed && sealer && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Sealed By</p>
              <p className="font-mono text-xs break-all mt-1">{sealer}</p>
            </div>
          </div>
        )}

        {isSealed && sealedAt && (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Sealed</p>
              <p className="text-sm mt-1">
                {formatDistanceToNow(sealedAt * 1000, { addSuffix: true })}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(sealedAt * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {metadata && (
          <div>
            <p className="text-sm text-muted-foreground">Metadata</p>
            <p className="text-sm mt-1">{metadata}</p>
          </div>
        )}

        {!isSealed && (
          <p className="text-sm text-yellow-600">
            This document has not been sealed on the blockchain.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Step 5: Create Documents Page

```typescript
// frontend/app/(app)/documents/page.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SealForm } from '@/components/documents/seal-form';
import { DocumentUpload } from '@/components/documents/document-upload';
import { VerificationResult } from '@/components/documents/verification-result';
import { useDocumentSeal } from '@/hooks/use-document-seal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';

export default function DocumentsPage() {
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const { verifyDocument, isVerifying, error } = useDocumentSeal();

  const handleVerifyByFile = async () => {
    if (!verifyFile) return;
    const result = await verifyDocument(verifyFile);
    const hash = await new Promise<string>(async (resolve) => {
      const buffer = await verifyFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      resolve('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
    });
    setVerifyResult({ ...result, documentHash: hash });
  };

  const handleVerifyByHash = async () => {
    if (!verifyHash) return;
    const result = await verifyDocument(verifyHash);
    setVerifyResult({ ...result, documentHash: verifyHash });
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-2">Document Seal</h1>
      <p className="text-muted-foreground mb-8">
        Create immutable on-chain records of your documents
      </p>

      <Tabs defaultValue="seal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="seal">Seal Document</TabsTrigger>
          <TabsTrigger value="verify">Verify Document</TabsTrigger>
        </TabsList>

        <TabsContent value="seal">
          <SealForm />
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Verify Document
              </CardTitle>
              <CardDescription>
                Check if a document has been sealed on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Upload File to Verify</Label>
                <DocumentUpload
                  selectedFile={verifyFile}
                  onFileSelect={setVerifyFile}
                  onFileRemove={() => {
                    setVerifyFile(null);
                    setVerifyResult(null);
                  }}
                  disabled={isVerifying}
                />
                <Button
                  onClick={handleVerifyByFile}
                  disabled={!verifyFile || isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify File
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="hash">Enter Document Hash</Label>
                <Input
                  id="hash"
                  placeholder="0x..."
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  disabled={isVerifying}
                />
                <Button
                  onClick={handleVerifyByHash}
                  disabled={!verifyHash || isVerifying}
                  variant="outline"
                  className="w-full"
                >
                  {isVerifying ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Verify Hash
                </Button>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </CardContent>
          </Card>

          {verifyResult && (
            <VerificationResult
              documentHash={verifyResult.documentHash}
              isSealed={verifyResult.isSealed}
              sealer={verifyResult.sealer}
              sealedAt={verifyResult.sealedAt}
              metadata={verifyResult.metadata}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 6: Commit

```bash
git add frontend/app/\(app\)/documents/ frontend/components/documents/ frontend/hooks/use-document-seal.ts
git commit -m "feat: add DocumentSeal UI for sealing and verifying documents

- Document upload with drag-and-drop support
- Seal form with biometric authentication
- Verification result display with seal details
- Client-side SHA-256 hash computation

```

---

## Task 5.3: Portfolio Tracking & Analytics

**Objective:** Build comprehensive portfolio view with investment tracking and analytics.

**Files:**
- Create: `frontend/app/(app)/portfolio/page.tsx`
- Create: `frontend/components/portfolio/portfolio-summary.tsx`
- Create: `frontend/components/portfolio/investment-list.tsx`
- Create: `frontend/components/portfolio/performance-chart.tsx`
- Create: `frontend/hooks/use-portfolio.ts`

### Step 1: Create Portfolio Hook

```typescript
// frontend/hooks/use-portfolio.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

export interface Investment {
  id: string;
  poolId: string;
  poolName: string;
  amount: bigint;
  shares: bigint;
  investedAt: number;
  currentValue: bigint;
  unrealizedPnL: bigint;
  unrealizedPnLPercent: number;
  status: 'active' | 'redeemed' | 'pending';
}

export interface PortfolioSummary {
  totalValue: bigint;
  totalInvested: bigint;
  totalPnL: bigint;
  totalPnLPercent: number;
  activeInvestments: number;
  lastUpdated: number;
}

export interface PortfolioData {
  summary: PortfolioSummary;
  investments: Investment[];
  history: { date: number; value: bigint }[];
}

export function usePortfolio() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['portfolio', user?.id],
    queryFn: async (): Promise<PortfolioData> => {
      if (!user?.id) throw new Error('Not authenticated');

      const response = await apiClient.portfolio.get();
      return response;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

export function useInvestmentHistory(investmentId: string) {
  return useQuery({
    queryKey: ['investment-history', investmentId],
    queryFn: async () => {
      return apiClient.portfolio.getInvestmentHistory(investmentId);
    },
    enabled: !!investmentId,
  });
}
```

### Step 2: Create Portfolio Summary Component

```typescript
// frontend/components/portfolio/portfolio-summary.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/format';
import type { PortfolioSummary as PortfolioSummaryType } from '@/hooks/use-portfolio';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const isProfitable = summary.totalPnL >= 0n;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Invested: {formatCurrency(summary.totalInvested)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {isProfitable ? '+' : ''}{formatCurrency(summary.totalPnL)}
          </div>
          <p className={`text-xs ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {isProfitable ? '+' : ''}{formatPercent(summary.totalPnLPercent)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Positions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.activeInvestments}</div>
          <p className="text-xs text-muted-foreground">
            Across multiple pools
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Date(summary.lastUpdated).toLocaleTimeString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(summary.lastUpdated).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 3: Create Investment List Component

```typescript
// frontend/components/portfolio/investment-list.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatPercent } from '@/lib/format';
import { formatDistanceToNow } from 'date-fns';
import type { Investment } from '@/hooks/use-portfolio';
import Link from 'next/link';

interface InvestmentListProps {
  investments: Investment[];
  onRedeem?: (investmentId: string) => void;
}

export function InvestmentList({ investments, onRedeem }: InvestmentListProps) {
  if (investments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">No investments yet</p>
          <Link href="/pools">
            <Button>Explore Pools</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Investments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pool</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => {
              const isProfitable = investment.unrealizedPnL >= 0n;

              return (
                <TableRow key={investment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{investment.poolName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(investment.investedAt * 1000, { addSuffix: true })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(investment.amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(investment.currentValue)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                    <div>
                      {isProfitable ? '+' : ''}{formatCurrency(investment.unrealizedPnL)}
                    </div>
                    <div className="text-xs">
                      ({isProfitable ? '+' : ''}{formatPercent(investment.unrealizedPnLPercent)})
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        investment.status === 'active'
                          ? 'default'
                          : investment.status === 'pending'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {investment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {investment.status === 'active' && onRedeem && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRedeem(investment.id)}
                      >
                        Redeem
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Create Performance Chart Component

```typescript
// frontend/components/portfolio/performance-chart.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/format';

interface PerformanceChartProps {
  history: { date: number; value: bigint }[];
}

export function PerformanceChart({ history }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    return history.map((point) => ({
      date: new Date(point.date * 1000).toLocaleDateString(),
      value: Number(point.value) / 1e6, // Convert from USDC decimals
    }));
  }, [history]);

  if (chartData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            Not enough data to display chart
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-background border rounded-lg p-2 shadow-lg">
                    <p className="text-sm font-medium">
                      {formatCurrency(BigInt(Math.round(payload[0].value as number * 1e6)))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payload[0].payload.date}
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="url(#colorValue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Create Portfolio Page

```typescript
// frontend/app/(app)/portfolio/page.tsx
'use client';

import { usePortfolio } from '@/hooks/use-portfolio';
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { InvestmentList } from '@/components/portfolio/investment-list';
import { PerformanceChart } from '@/components/portfolio/performance-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function PortfolioPage() {
  const { data, isLoading, error } = usePortfolio();

  if (isLoading) {
    return (
      <div className="container py-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load portfolio data. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const handleRedeem = async (investmentId: string) => {
    // TODO: Implement redeem flow
    console.log('Redeem:', investmentId);
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        <p className="text-muted-foreground">
          Track your investments and performance
        </p>
      </div>

      <PortfolioSummary summary={data.summary} />

      <PerformanceChart history={data.history} />

      <InvestmentList
        investments={data.investments}
        onRedeem={handleRedeem}
      />
    </div>
  );
}
```

### Step 6: Commit

```bash
git add frontend/app/\(app\)/portfolio/ frontend/components/portfolio/ frontend/hooks/use-portfolio.ts
git commit -m "feat: add portfolio tracking with analytics and performance charts

- Portfolio summary cards with P&L tracking
- Investment list with redeem actions
- Performance chart using Recharts
- Real-time data with React Query

```

---

## Task 5.4: Mobile Responsiveness

**Objective:** Ensure all views work perfectly on mobile devices.

**Files:**
- Modify: `frontend/components/layout/mobile-nav.tsx`
- Modify: `frontend/components/layout/header.tsx`
- Create: `frontend/components/ui/bottom-nav.tsx`
- Modify: Various component files for responsive adjustments

### Step 1: Create Bottom Navigation Component

```typescript
// frontend/components/ui/bottom-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Building2,
  User,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/pools', label: 'Pools', icon: Building2 },
  { href: '/portfolio', label: 'Portfolio', icon: Wallet },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/settings', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Step 2: Create Mobile Navigation Sheet

```typescript
// frontend/components/layout/mobile-nav.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pools', label: 'Investment Pools' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/documents', label: 'Documents' },
  { href: '/settings', label: 'Settings' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>RWA Gateway</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2 mt-6">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

### Step 3: Update Layout for Mobile

```typescript
// frontend/app/(app)/layout.tsx
import { BottomNav } from '@/components/ui/bottom-nav';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 border-r min-h-[calc(100vh-64px)] sticky top-16">
          <Sidebar />
        </aside>

        {/* Main content with bottom padding for mobile nav */}
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
```

### Step 4: Add Responsive Utilities

```typescript
// frontend/lib/hooks/use-media-query.ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
```

### Step 5: Update Investment Form for Mobile

```typescript
// frontend/components/investment/mobile-investment-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/lib/hooks/use-media-query';
import { InvestmentForm } from './investment-form';

interface MobileInvestmentFormProps {
  poolId: string;
  poolName: string;
  minInvestment: bigint;
  maxInvestment: bigint;
  trigger?: React.ReactNode;
}

export function MobileInvestmentForm({
  poolId,
  poolName,
  minInvestment,
  maxInvestment,
  trigger,
}: MobileInvestmentFormProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <InvestmentForm
        poolId={poolId}
        poolName={poolName}
        minInvestment={minInvestment}
        maxInvestment={maxInvestment}
      />
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || <Button className="w-full">Invest Now</Button>}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Invest in {poolName}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <InvestmentForm
            poolId={poolId}
            poolName={poolName}
            minInvestment={minInvestment}
            maxInvestment={maxInvestment}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

### Step 6: Test Responsive Breakpoints

```bash
# Run development server
cd frontend && npm run dev

# Test manually at breakpoints:
# - Mobile: 375px, 414px
# - Tablet: 768px, 1024px
# - Desktop: 1280px, 1440px+
```

### Step 7: Commit

```bash
git add frontend/components/layout/ frontend/components/ui/bottom-nav.tsx frontend/lib/hooks/use-media-query.ts
git commit -m "feat: add mobile responsiveness with bottom nav and drawer forms

- Bottom navigation for mobile devices
- Mobile navigation sheet
- Responsive hooks (useIsMobile, useIsTablet, useIsDesktop)
- Drawer-based investment form for mobile

```

---

## Task 5.5: Error Handling & Edge Cases

**Objective:** Implement comprehensive error handling across the application.

**Files:**
- Create: `frontend/components/error-boundary.tsx`
- Create: `frontend/lib/errors.ts`
- Create: `frontend/components/ui/error-state.tsx`
- Create: `frontend/components/ui/loading-state.tsx`
- Modify: `frontend/app/error.tsx`

### Step 1: Create Error Types

```typescript
// frontend/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  static fromResponse(response: Response, body?: any): AppError {
    const message = body?.message || response.statusText || 'An error occurred';
    const code = body?.code || 'UNKNOWN_ERROR';

    return new AppError(message, code, response.status, body?.meta);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, { fields });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error. Please check your connection.') {
    super(message, 'NETWORK_ERROR', 0);
    this.name = 'NetworkError';
  }
}

export class TransactionError extends AppError {
  constructor(
    message: string,
    public txHash?: string,
    public reason?: string
  ) {
    super(message, 'TRANSACTION_ERROR', 500, { txHash, reason });
    this.name = 'TransactionError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Common WebAuthn errors
    if (error.name === 'NotAllowedError') {
      return 'Biometric authentication was cancelled or denied';
    }
    if (error.name === 'NotSupportedError') {
      return 'Biometric authentication is not supported on this device';
    }
    if (error.name === 'SecurityError') {
      return 'Security error during authentication';
    }

    return error.message;
  }

  return 'An unexpected error occurred';
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof AppError) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  return false;
}
```

### Step 2: Create Error Boundary Component

```typescript
// frontend/components/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { getErrorMessage, isRetryableError } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const message = getErrorMessage(this.state.error);
      const canRetry = isRetryableError(this.state.error);

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
          {canRetry && (
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 3: Create Error State Component

```typescript
// frontend/components/ui/error-state.tsx
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  showHomeButton = false,
}: ErrorStateProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center py-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-4">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {showHomeButton && (
            <Link href="/dashboard">
              <Button>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Create Loading State Component

```typescript
// frontend/components/ui/loading-state.tsx
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'minimal';
}

export function LoadingState({
  message = 'Loading...',
  variant = 'spinner',
}: LoadingStateProps) {
  if (variant === 'minimal') {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
```

### Step 5: Create Global Error Page

```typescript
// frontend/app/error.tsx
'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <ErrorState
        title="Application Error"
        message={error.message || 'An unexpected error occurred'}
        onRetry={reset}
        showHomeButton
      />
    </div>
  );
}
```

### Step 6: Commit

```bash
git add frontend/lib/errors.ts frontend/components/error-boundary.tsx frontend/components/ui/error-state.tsx frontend/components/ui/loading-state.tsx frontend/app/error.tsx
git commit -m "feat: add comprehensive error handling with error boundaries

- Custom error types (AuthError, ValidationError, NetworkError, etc.)
- Error boundary component with retry support
- Error and loading state components
- Global error page

```

---

## Phase 5 Definition of Done

- [ ] End-to-end flow from registration to investment working
- [ ] DocumentSeal UI complete (seal + verify)
- [ ] Portfolio page with summary, list, and charts
- [ ] Mobile responsive across all views
- [ ] Error handling implemented at all levels
- [ ] E2E tests passing for critical flows
- [ ] All components accessible (keyboard nav, screen readers)
- [ ] No console errors in development
- [ ] Performance: LCP < 2.5s on 3G

---

## Testing Checklist

```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Run accessibility audit
npm run a11y

# Run lighthouse audit
npx lighthouse http://localhost:3000 --only-categories=performance,accessibility
```

---

## Next Phase

Proceed to **Phase 6: Hardening & Demo Preparation** for security audit, performance optimization, and competition submission preparation.
