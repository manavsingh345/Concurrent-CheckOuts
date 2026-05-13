"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return null;
  }

  const activeSrc =
    images[Math.min(activeIndex, images.length - 1)] ?? images[0];

  return (
    <>
      <div className="hidden gap-3 xl:grid">
        {images.map((image, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`cursor-pointer overflow-hidden rounded-lg border bg-[#f8fafc] text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] ${
                isActive
                  ? "border-[var(--accent-strong)] ring-2 ring-[var(--accent-strong)]/25"
                  : "border-[var(--border)] hover:border-slate-300"
              }`}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-pressed={isActive}
            >
              <Image
                src={image}
                alt=""
                width={92}
                height={92}
                className="h-[92px] w-[92px] cursor-pointer object-cover"
              />
            </button>
          );
        })}
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-6">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f8fafc]">
          <Image
            key={activeSrc}
            src={activeSrc}
            alt={productName}
            fill
            priority={activeIndex === 0}
            className="object-contain"
            sizes="(max-width: 1280px) 100vw, 45vw"
          />
        </div>
      </section>
    </>
  );
}
