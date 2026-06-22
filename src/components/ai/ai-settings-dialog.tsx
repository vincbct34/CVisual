"use client";

import { useState } from "react";
import { useAI } from "@/hooks/use-ai";
import { useT } from "@/components/i18n/language-provider";
import { validateKey } from "@/lib/ai/ai-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { type AIProvider } from "@/lib/ai/types";

type KeyStatus = "idle" | "testing" | "valid" | "invalid";

const PROVIDER_INFO: Record<
  AIProvider,
  { name: string; keyPrefix: string; keyPlaceholder: string; keyUrl: string }
> = {
  gemini: {
    name: "Google Gemini",
    keyPrefix: "AIza",
    keyPlaceholder: "AIza...",
    keyUrl: "https://aistudio.google.com/apikey",
  },
  openai: {
    name: "OpenAI",
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    name: "Anthropic Claude",
    keyPrefix: "sk-ant-",
    keyPlaceholder: "sk-ant-...",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
};

export function AISettingsDialog({
  children,
  open,
  onOpenChange,
}: {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { apiKey, hasKey, setApiKey, removeApiKey, provider, setProvider } =
    useAI();
  const t = useT();
  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<KeyStatus>("idle");

  const info = PROVIDER_INFO[provider];

  async function handleTestKey() {
    const key = inputKey || apiKey;
    if (!key) return;

    setStatus("testing");
    try {
      const valid = await validateKey(provider, key);
      if (valid) {
        setStatus("valid");
        if (inputKey) {
          setApiKey(inputKey);
          setInputKey("");
        }
        toast.success(t("ai.keyValid"));
      } else {
        setStatus("invalid");
        toast.error(t("ai.keyInvalid"));
      }
    } catch {
      setStatus("invalid");
      toast.error(t("ai.connError", { provider: info.name }));
    }
  }

  function handleSaveKey() {
    const trimmed = inputKey.trim();
    if (!trimmed || trimmed.length < 10) {
      toast.error(t("ai.keyTooShort"));
      return;
    }
    setApiKey(trimmed);
    setInputKey("");
    setStatus("idle");
    toast.success(t("ai.keySaved"));
  }

  function handleRemoveKey() {
    removeApiKey();
    setInputKey("");
    setStatus("idle");
    toast.success(t("ai.keyRemoved"));
  }

  function handleProviderChange(p: AIProvider) {
    if (p === provider) return;
    setProvider(p);
    setInputKey("");
    setStatus("idle");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("ai.settingsTitle")}</DialogTitle>
          <DialogDescription>{t("ai.settingsDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Provider toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("ai.providerLabel")}
            </label>
            <div className="flex flex-wrap gap-2">
              {(["gemini", "openai", "anthropic"] as AIProvider[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={provider === p ? "default" : "outline"}
                  onClick={() => handleProviderChange(p)}
                >
                  {PROVIDER_INFO[p].name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {provider === "gemini"
                ? t("ai.providerGemini")
                : provider === "anthropic"
                  ? t("ai.providerAnthropic")
                  : t("ai.providerOpenai")}
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: hasKey ? "var(--accent-mint)" : "var(--fg-muted)",
              }}
            />
            <span style={{ color: "var(--fg-muted)" }}>
              {hasKey ? t("ai.keyConfigured") : t("ai.noKeyConfigured")}
            </span>
          </div>

          {/* Key input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("ai.apiKeyLabel", { provider: info.name })}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={
                    hasKey ? `${info.keyPrefix}••••••••` : info.keyPlaceholder
                  }
                  value={inputKey}
                  onChange={(e) => {
                    setInputKey(e.target.value);
                    setStatus("idle");
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? t("ai.hideKey") : t("ai.showKey")}
                </button>
              </div>
            </div>
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              {t("ai.getKey", { provider: info.name })}
            </a>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {inputKey && (
              <Button size="sm" onClick={handleSaveKey}>
                {t("common.save")}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestKey}
              disabled={status === "testing" || (!inputKey && !hasKey)}
            >
              {status === "testing" ? t("ai.testing") : t("ai.testKey")}
            </Button>
            {hasKey && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive"
                onClick={handleRemoveKey}
              >
                {t("common.delete")}
              </Button>
            )}
          </div>

          {/* Status feedback */}
          {status === "valid" && (
            <p className="text-sm" style={{ color: "var(--success)" }}>
              {t("ai.keyValidShort")}
            </p>
          )}
          {status === "invalid" && (
            <p className="text-sm" style={{ color: "var(--destructive)" }}>
              {t("ai.keyInvalidShort")}
            </p>
          )}

          {/* Model selection note */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground">{t("ai.modelNote")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
