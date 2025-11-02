"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function EnvioEcomConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [slug, setSlug] = useState("c4franquias");
  const [webhookToken, setWebhookToken] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [configId, setConfigId] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  const supabase = createBrowserClient();

  useEffect(() => {
    carregarConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarConfig() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("config_envioecom")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro:", error);
        return;
      }

      if (data) {
        setConfigId(data.id);
        setSlug(data.slug || "c4franquias");
        setWebhookToken(data.webhook_token || "");
        setWebhookUrl(data.webhook_url || gerarWebhookUrl());
      } else {
        setWebhookUrl(gerarWebhookUrl());
      }
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  }

  function gerarWebhookUrl() {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/webhook/envioecom`;
  }

  async function gerarNovoToken() {
    try {
      setGenerating(true);
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
      setWebhookToken(token);
      toast.success("Token gerado!");
    } catch {
      toast.error("Erro ao gerar token");
    } finally {
      setGenerating(false);
    }
  }

  async function salvarConfig() {
    try {
      setSaving(true);
      if (!slug.trim()) {
        toast.error("Slug obrigatório");
        return;
      }
      if (!webhookToken.trim()) {
        toast.error("Token obrigatório");
        return;
      }

      const configData = {
        slug: slug.trim(),
        webhook_token: webhookToken,
        webhook_url: webhookUrl || gerarWebhookUrl(),
        ativo: true,
      };

      let result;
      if (configId) {
        result = await supabase.from("config_envioecom").update(configData).eq("id", configId);
      } else {
        result = await supabase.from("config_envioecom").insert(configData).select().single();
        if (result.data) setConfigId(result.data.id);
      }

      if (result.error) throw result.error;
      toast.success("Salvo!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function copiarTexto(texto: string, tipo: string) {
    try {
      await navigator.clipboard.writeText(texto);
      if (tipo === "token") {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      } else if (tipo === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedSlug(true);
        setTimeout(() => setCopiedSlug(false), 2000);
      }
      toast.success("Copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2"> Integração EnvioEcom</h1>
        <p className="text-sm md:text-base text-gray-600">
          Configure o webhook para receber atualizações da EnvioEcom
        </p>
      </div>

      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Como funciona:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Gere um Token aqui</li>
            <li>Copie Slug, Token e URL</li>
            <li>Cole no painel EnvioEcom</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <Label>Slug</Label>
            <div className="relative mt-2">
              <Input
                value={slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="pr-20"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8"
                onClick={() => copiarTexto(slug, "slug")}
              >
                {copiedSlug ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label>Token</Label>
            <Button onClick={gerarNovoToken} disabled={generating} className="mt-2 mb-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Gerar Token
            </Button>
            {webhookToken && (
              <div className="relative">
                <Input value={webhookToken} readOnly className="pr-20 bg-gray-50" />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-8"
                  onClick={() => copiarTexto(webhookToken, "token")}
                >
                  {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label>URL Webhook</Label>
            <div className="relative mt-2">
              <Input value={webhookUrl} readOnly className="pr-20 bg-gray-50" />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-8"
                onClick={() => copiarTexto(webhookUrl, "url")}
              >
                {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={salvarConfig} disabled={saving || !webhookToken} className="w-full">
            {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
            Salvar
          </Button>
        </div>
      </Card>
    </div>
  );
}
