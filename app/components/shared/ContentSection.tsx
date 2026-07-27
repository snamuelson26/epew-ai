"use client";

import Image from "next/image";
import Link from "next/link";
import type {
  ReactNode,
} from "react";

type ContentSectionAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline";
};

type ContentSectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imagePriority?: boolean;
  background?: "white" | "soft" | "navy";
  textAlign?: "left" | "center";
  imagePosition?: "before" | "after";
  actions?: ContentSectionAction[];
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  imageClassName?: string;
};

function getBackgroundClass(
  background: ContentSectionProps["background"],
): string {
  switch (background) {
    case "soft":
      return "bg-[#f5f7fb]";

    case "navy":
      return "bg-[#06245c]";

    case "white":
    default:
      return "bg-white";
  }
}

function getActionClass(
  variant: ContentSectionAction["variant"],
): string {
  switch (variant) {
    case "secondary":
      return [
        "bg-green-600",
        "text-white",
        "hover:bg-green-700",
      ].join(" ");

    case "outline":
      return [
        "border-2",
        "border-[#06245c]",
        "bg-transparent",
        "text-[#06245c]",
        "hover:bg-[#06245c]",
        "hover:text-white",
      ].join(" ");

    case "primary":
    default:
      return [
        "bg-[#06245c]",
        "text-white",
        "hover:bg-[#0a347d]",
      ].join(" ");
  }
}

export default function ContentSection({
  id,
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt = "",
  imageWidth = 1400,
  imageHeight = 900,
  imagePriority = false,
  background = "white",
  textAlign = "center",
  imagePosition = "before",
  actions = [],
  children,
  className = "",
  contentClassName = "",
  imageClassName = "",
}: ContentSectionProps) {
  const isDark = background === "navy";
  const isCentered = textAlign === "center";

  const image = imageSrc ? (
    <div className="w-full">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={imageWidth}
        height={imageHeight}
        priority={imagePriority}
        className={[
          "mx-auto h-auto w-full rounded-3xl shadow-2xl",
          imageClassName,
        ].join(" ")}
      />
    </div>
  ) : null;

  const content = (
    <div
      className={[
        isCentered ? "text-center" : "text-left",
        contentClassName,
      ].join(" ")}
    >
      {eyebrow ? (
        <p
          className={[
            "mb-5 text-lg font-bold uppercase tracking-[0.18em]",
            isDark
              ? "text-green-300"
              : "text-green-700",
          ].join(" ")}
        >
          {eyebrow}
        </p>
      ) : null}

      {title ? (
        <h2
          className={[
            "text-4xl font-bold leading-tight md:text-6xl",
            isDark
              ? "text-white"
              : "text-[#06245c]",
          ].join(" ")}
        >
          {title}
        </h2>
      ) : null}

      {description ? (
        <p
          className={[
            "mx-auto mt-10 max-w-6xl text-2xl leading-relaxed md:text-3xl",
            isCentered ? "mx-auto" : "mx-0",
            isDark
              ? "text-gray-100"
              : "text-gray-700",
          ].join(" ")}
        >
          {description}
        </p>
      ) : null}

      {children ? (
        <div className={title || description ? "mt-12" : ""}>
          {children}
        </div>
      ) : null}

      {actions.length > 0 ? (
        <div
          className={[
            "mt-12 flex flex-col gap-5 sm:flex-row sm:flex-wrap",
            isCentered
              ? "justify-center"
              : "justify-start",
          ].join(" ")}
        >
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={[
                "inline-flex min-h-14 items-center justify-center",
                "rounded-2xl px-9 py-4",
                "text-center text-xl font-bold",
                "shadow-lg transition-colors",
                "focus-visible:outline-none",
                "focus-visible:ring-4",
                "focus-visible:ring-green-300",
                getActionClass(action.variant),
              ].join(" ")}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <section
      id={id}
      className={[
        getBackgroundClass(background),
        "py-24",
        className,
      ].join(" ")}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="space-y-16">
          {imagePosition === "before" ? image : null}
          {content}
          {imagePosition === "after" ? image : null}
        </div>
      </div>
    </section>
  );
}