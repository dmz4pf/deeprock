"use client";

import { useState } from "react";
import { DocumentUpload } from "./DocumentUpload";
import { useDocumentSeal } from "@/hooks/useDocumentSeal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { getExplorerTxUrl } from "@/lib/chain";

interface SealFormProps {
  onSuccess?: (result: { txHash: string; documentHash: string }) => void;
}

export function SealForm({ onSuccess }: SealFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState("");
  const [result, setResult] = useState<{ txHash: string; documentHash: string } | null>(null);
  const [previewHash, setPreviewHash] = useState<string | null>(null);

  const { sealDocument, computeHash, isSealing, error } = useDocumentSeal();

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    const hash = await computeHash(selectedFile);
    setPreviewHash(hash);
  };

  const handleFileRemove = () => {
    setFile(null);
    setPreviewHash(null);
    setResult(null);
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

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setPreviewHash(null);
    setMetadata("");
  };

  if (result) {
    return (
      <Card className="border-[rgba(232,180,184,0.08)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forge-success">
            <CheckCircle className="h-5 w-5" />
            Document Sealed Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-forge-text-3">Document Hash</Label>
            <p className="font-mono text-xs break-all mt-1 text-forge-text-1 bg-[rgba(232,180,184,0.04)] p-2 rounded">
              {result.documentHash}
            </p>
          </div>
          <div>
            <Label className="text-forge-text-3">Transaction Hash</Label>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono text-xs break-all text-forge-text-1 bg-[rgba(232,180,184,0.04)] p-2 rounded flex-1">
                {result.txHash}
              </p>
              <a
                href={getExplorerTxUrl(result.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-forge-copper hover:text-forge-copper/80 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-[rgba(232,180,184,0.08)] text-forge-text-3 hover:bg-[rgba(232,180,184,0.04)]"
          >
            Seal Another Document
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[rgba(232,180,184,0.08)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-forge-text-1">
          <Shield className="h-5 w-5 text-forge-copper" />
          Seal Document
        </CardTitle>
        <CardDescription className="text-forge-text-3">
          Create an immutable on-chain record of your document
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-forge-text-1">Document</Label>
            <DocumentUpload
              selectedFile={file}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              disabled={isSealing}
            />
            {previewHash && (
              <p className="text-xs text-forge-text-3 font-mono break-all">
                SHA-256: {previewHash}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metadata" className="text-forge-text-1">
              Metadata (Optional)
            </Label>
            <Input
              id="metadata"
              placeholder="e.g., Contract v1.0, Invoice #12345"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              maxLength={256}
              disabled={isSealing}
              className="border-[rgba(232,180,184,0.08)] bg-[rgba(232,180,184,0.04)] text-forge-text-1 placeholder:text-forge-text-3"
            />
            <p className="text-xs text-forge-text-3">
              Optional description stored on-chain ({256 - metadata.length} chars remaining)
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-forge-danger/10 border border-forge-danger/30">
              <p className="text-sm text-forge-danger">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!file || isSealing}
            variant="glow"
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
