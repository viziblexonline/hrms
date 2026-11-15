"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function FormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  required,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <motion.label
      className="block space-y-1.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
        )}
        <input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`w-full rounded-2xl border border-primary/15 bg-white/90 py-2.5 text-sm text-ink outline-none transition duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 ${
            Icon ? "pl-10" : "pl-3.5"
          } ${isPassword ? "pr-10" : "pr-3.5"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-mute transition hover:text-primary"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </motion.label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ComponentType<{ className?: string }>;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full appearance-none rounded-2xl border border-primary/15 bg-white/90 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 ${
            Icon ? "pl-10" : "pl-3.5"
          } pr-8`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
