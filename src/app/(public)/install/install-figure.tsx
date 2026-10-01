"use client";

import Image from "next/image";
import { useState } from "react";

interface InstallFigureProps {
  src: string;
  alt: string;
  caption: string;
}

/**
 * Screenshot slot for the install guide. The image files are optional:
 * if one is missing the whole figure hides rather than showing a broken image.
 */
export function InstallFigure({ src, alt, caption }: InstallFigureProps) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <figure className="space-y-2">
      <Image
        src={src}
        alt={alt}
        width={300}
        height={600}
        className="h-auto w-full max-w-[300px] rounded-[16px] border border-hairline"
        onError={() => setHidden(true)}
      />
      <figcaption className="text-sm text-ink-soft">{caption}</figcaption>
    </figure>
  );
}
