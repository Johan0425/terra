"use client";

// Tactical-HUD CTA button: diagonal-cut corners + a brief scanline sweep on
// hover, matching the RDR2/GTA-inventory visual language used across TERRA.
import type { ComponentProps } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type GlitchButtonProps = {
  children: React.ReactNode;
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: undefined } & Omit<ComponentProps<"button">, "className">)
);

export function GlitchButton({
  children,
  className = "",
  ...props
}: GlitchButtonProps) {
  const base =
    "group relative inline-flex items-center justify-center overflow-hidden border border-amber-500/60 bg-amber-500/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-amber-400 transition-colors hover:bg-amber-500/20";
  const clipStyle = {
    clipPath:
      "polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)",
  };

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      <motion.span
        aria-hidden
        initial={{ x: "-120%" }}
        whileHover={{ x: "120%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/3 skew-x-[-20deg] bg-amber-300/25"
      />
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...rest } = props;
    return (
      <Link
        href={href}
        className={`${base} ${className}`}
        style={clipStyle}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  const buttonProps = props as ComponentProps<"button">;
  return (
    <button
      className={`${base} ${className}`}
      style={clipStyle}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
