"use client";

import { Check, Languages } from "lucide-react";
import { useLanguage, type Language } from "@/providers/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES: Array<{ code: Language; label: string }> = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Language: ${language.toUpperCase()}`}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 data-[state=open]:bg-slate-100"
      >
        <Languages size={15} aria-hidden />
        {language.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-slate-500">Language</DropdownMenuLabel>
        {LANGUAGES.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLanguage(item.code)} className="cursor-pointer">
            {item.label}
            {language === item.code && <Check size={14} className="ml-auto text-teal-700" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
