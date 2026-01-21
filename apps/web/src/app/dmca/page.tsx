"use client";

import { useState } from "react";
import { FileWarning, ShieldCheck, Scale, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

const MAX_TEXT_LENGTH = 2000;
const MAX_NAME_LENGTH = 140;
const MAX_ADDRESS_LENGTH = 300;
const MAX_SIGNATURE_LENGTH = 140;
const MAX_URL_LENGTH = 500;

export default function DmcaPage() {
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    claimantName: "",
    claimantEmail: "",
    claimantAddress: "",
    copyrightedWorkDescription: "",
    copyrightedWorkUrl: "",
    infringingContentUrl: "",
    goodFaithStatement: false,
    accuracyStatement: false,
    ownershipStatement: false,
    signature: "",
    signatureDate: "",
  });

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const validate = () => {
    if (!form.claimantName || !form.claimantEmail || !form.claimantAddress) {
      return "Please provide your name, email, and address.";
    }
    if (!form.copyrightedWorkDescription || !form.infringingContentUrl) {
      return "Please describe the copyrighted work and provide the infringing URL.";
    }
    if (!form.signature) {
      return "Signature is required.";
    }
    if (!form.goodFaithStatement || !form.accuracyStatement || !form.ownershipStatement) {
      return "All legal attestations must be accepted.";
    }
    if (form.claimantName.length > MAX_NAME_LENGTH || form.signature.length > MAX_SIGNATURE_LENGTH) {
      return "Name or signature is too long.";
    }
    if (form.claimantAddress.length > MAX_ADDRESS_LENGTH) {
      return "Address is too long.";
    }
    if (
      form.copyrightedWorkDescription.length > MAX_TEXT_LENGTH ||
      form.copyrightedWorkUrl.length > MAX_URL_LENGTH ||
      form.infringingContentUrl.length > MAX_URL_LENGTH
    ) {
      return "One or more fields exceed the maximum length.";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/dmca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimantName: form.claimantName.trim(),
          claimantEmail: form.claimantEmail.trim(),
          claimantAddress: form.claimantAddress.trim(),
          copyrightedWorkDescription: form.copyrightedWorkDescription.trim(),
          copyrightedWorkUrl: form.copyrightedWorkUrl.trim() || undefined,
          infringingContentUrl: form.infringingContentUrl.trim(),
          goodFaithStatement: form.goodFaithStatement,
          accuracyStatement: form.accuracyStatement,
          ownershipStatement: form.ownershipStatement,
          signature: form.signature.trim(),
          signatureDate: form.signatureDate || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { requestId?: string; error?: string }
        | null;

      if (!response.ok) {
        error(payload?.error ?? "Unable to submit DMCA request.");
        return;
      }

      setRequestId(payload?.requestId ?? null);
      success("DMCA request received", "We will review within 48 hours.");
      setForm((prev) => ({
        ...prev,
        copyrightedWorkDescription: "",
        copyrightedWorkUrl: "",
        infringingContentUrl: "",
        signature: "",
        signatureDate: "",
        goodFaithStatement: false,
        accuracyStatement: false,
        ownershipStatement: false,
      }));
    } catch {
      error("Unable to submit DMCA request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-white dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <div className="border-b border-border/60">
        <div className="container-wide py-12">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/30 px-3 py-1 rounded-full w-fit">
              <Gavel className="h-4 w-4" />
              DMCA takedown request
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
              Submit a DMCA notice
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
              Use this form to report alleged copyright infringement. Requests are reviewed by a
              human within 48 hours.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Safe harbor compliance
              </span>
              <span>•</span>
              <span>Counter-notices accepted</span>
              <span>•</span>
              <span>Repeat infringer tracking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle>DMCA request form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="claimant-name" required>
                    Claimant name
                  </Label>
                  <Input
                    id="claimant-name"
                    value={form.claimantName}
                    onChange={(event) => updateField("claimantName", event.target.value)}
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claimant-email" required>
                    Claimant email
                  </Label>
                  <Input
                    id="claimant-email"
                    type="email"
                    value={form.claimantEmail}
                    onChange={(event) => updateField("claimantEmail", event.target.value)}
                    maxLength={MAX_NAME_LENGTH}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimant-address" required>
                  Claimant address
                </Label>
                <Textarea
                  id="claimant-address"
                  value={form.claimantAddress}
                  onChange={(event) => updateField("claimantAddress", event.target.value)}
                  maxLength={MAX_ADDRESS_LENGTH}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copyrighted-work" required>
                  Describe the copyrighted work
                </Label>
                <Textarea
                  id="copyrighted-work"
                  value={form.copyrightedWorkDescription}
                  onChange={(event) => updateField("copyrightedWorkDescription", event.target.value)}
                  maxLength={MAX_TEXT_LENGTH}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="copyrighted-work-url" optional>
                    URL to the original work
                  </Label>
                  <Input
                    id="copyrighted-work-url"
                    value={form.copyrightedWorkUrl}
                    onChange={(event) => updateField("copyrightedWorkUrl", event.target.value)}
                    maxLength={MAX_URL_LENGTH}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="infringing-url" required>
                    Infringing content URL
                  </Label>
                  <Input
                    id="infringing-url"
                    value={form.infringingContentUrl}
                    onChange={(event) => updateField("infringingContentUrl", event.target.value)}
                    maxLength={MAX_URL_LENGTH}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label required>Legal attestations</Label>
                <label className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={form.goodFaithStatement}
                    onChange={(event) => updateField("goodFaithStatement", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-amber-600 accent-amber-600"
                  />
                  I have a good faith belief that the disputed use is not authorized by the
                  copyright owner, its agent, or the law.
                </label>
                <label className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={form.accuracyStatement}
                    onChange={(event) => updateField("accuracyStatement", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-amber-600 accent-amber-600"
                  />
                  The information in this notice is accurate, and I am authorized to act on behalf
                  of the copyright owner.
                </label>
                <label className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={form.ownershipStatement}
                    onChange={(event) => updateField("ownershipStatement", event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-neutral-300 text-amber-600 accent-amber-600"
                  />
                  I understand that a false claim may result in liability for damages.
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="signature" required>
                    Electronic signature
                  </Label>
                  <Input
                    id="signature"
                    value={form.signature}
                    onChange={(event) => updateField("signature", event.target.value)}
                    maxLength={MAX_SIGNATURE_LENGTH}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature-date" required>
                    Signature date
                  </Label>
                  <Input
                    id="signature-date"
                    type="date"
                    value={form.signatureDate}
                    onChange={(event) => updateField("signatureDate", event.target.value)}
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {formError}
                </div>
              )}

              {requestId && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                  Request received. Reference ID: <span className="font-semibold">{requestId}</span>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting}
                className="w-full"
              >
                Submit DMCA request
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  What happens next
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>We review DMCA requests within 48 hours and notify the content owner.</p>
                <p>Content may be removed while we validate the claim.</p>
                <p>Counter-notices can be filed by the owner within 10-14 days.</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">48 hour review</Badge>
                  <Badge variant="outline">Counter-notice window</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  Before you submit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Make sure you are the copyright owner or authorized agent.</li>
                  <li>Provide direct links to the allegedly infringing content.</li>
                  <li>Include accurate contact details so we can follow up.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
