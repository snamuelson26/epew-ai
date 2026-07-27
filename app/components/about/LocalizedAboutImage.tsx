"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

type SupportedImageLocale = "en" | "fr" | "ht" | "es";

type LocalizedAboutImageProps = {
  fileName: string;
  fallbackPath: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

function normalizeImageLocale(locale: string): SupportedImageLocale {
  switch (locale.toLowerCase()) {
    case "fr":
    case "fr-fr":
    case "fr-ca":
      return "fr";

    case "ht":
    case "ht-ht":
      return "ht";

    case "es":
    case "es-es":
    case "es-us":
      return "es";

    case "en":
    case "en-us":
    default:
      return "en";
  }
}

export default function LocalizedAboutImage({
  fileName,
  fallbackPath,
  alt,
  width = 1400,
  height = 900,
  priority = false,
  className = "",
  sizes = "(max-width: 768px) 100vw, 1400px",
}: LocalizedAboutImageProps) {
  const { locale } = useLanguage();

  const imageLocale = useMemo(
    () => normalizeImageLocale(locale),
    [locale],
  );

  const localizedPath = useMemo(
    () => `/images/about/${imageLocale}/${fileName}`,
    [fileName, imageLocale],
  );

  const englishPath = useMemo(
    () => `/images/about/en/${fileName}`,
    [fileName],
  );

  const [source, setSource] = useState(localizedPath);
  const [fallbackStage, setFallbackStage] = useState(0);

  useEffect(() => {
    setSource(localizedPath);
    setFallbackStage(0);
  }, [localizedPath]);

  function handleError() {
    if (fallbackStage === 0 && imageLocale !== "en") {
      setSource(englishPath);
      setFallbackStage(1);
      return;
    }

    if (fallbackStage <= 1 && source !== fallbackPath) {
      setSource(fallbackPath);
      setFallbackStage(2);
    }
  }

  return (
    <Image
      src={source}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      onError={handleError}
      className={className}
    />
  );
}