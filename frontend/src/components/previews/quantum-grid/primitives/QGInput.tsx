"use client";

import React from "react";

interface QGInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function QGInput({ placeholder, value, onChange, type = "text", label, icon, disabled }: QGInputProps) {
  return (
    <div>
      {label && (
        <label className="text-xs text-[#5A5347] tracking-[0.1em] uppercase block mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5347]">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full bg-[var(--elevation-0)] border border-[var(--border-default)] rounded-lg
            text-[#F0EBE0] text-[15px] outline-none
            transition-[border-color] duration-[var(--duration-normal)] ease-out
            focus:border-[var(--forge-copper)]
            placeholder:text-[#5A5347]
            ${icon ? "pl-9 pr-3 py-2.5" : "px-3 py-2.5"}
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>
    </div>
  );
}
