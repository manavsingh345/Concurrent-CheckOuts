import type { ProductListItem } from "@/lib/data";

export type ProductMerch = {
  badge: string;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  benefits: string[];
  delivery: string;
  rating: string;
  reviewCount: number;
  monthlyBought: string;
  offerLabel: string;
  mrpMultiplier: number;
  detailBullets: string[];
};

const merchProfiles: ProductMerch[] = [
  {
    badge: "Bestseller",
    category: "Daily wellness",
    title: "Performance Gummies",
    subtitle:
      "Daily essentials built for repeat orders, crisp merchandising, and fast multi-hub dispatch.",
    image: "/images/performance-gummies.png",
    benefits: ["Sugar-free format", "2-day dispatch", "Doctor-reviewed"],
    delivery: "Popular in Delhi NCR and Chandigarh",
    rating: "4.8",
    reviewCount: 184,
    monthlyBought: "300+ bought in past month",
    offerLabel: "Great Summer Deal",
    mrpMultiplier: 1.24,
    detailBullets: [
      "Built for a clean D2C browsing experience with live price visibility.",
      "Inventory remains warehouse-aware only when the customer enters reserve flow.",
      "Short checkout holds protect stock without making the storefront feel operational.",
      "Best suited for fast-moving replenishment products and repeat orders.",
    ],
  },
  {
    badge: "New",
    category: "Connected care",
    title: "Smart Cycle Monitor",
    subtitle:
      "A premium connected device detail page feel, while checkout still uses the same hold logic underneath.",
    image: "/images/smart-monitor.png",
    benefits: ["App-enabled device", "Discrete packaging", "Regional dispatch"],
    delivery: "Fastest to Bengaluru and Hyderabad",
    rating: "4.7",
    reviewCount: 126,
    monthlyBought: "120+ bought in past month",
    offerLabel: "Limited launch offer",
    mrpMultiplier: 1.18,
    detailBullets: [
      "A richer product detail layout for a premium health hardware item.",
      "Clear specs, image-first merchandising, and a strong right-rail buy panel.",
      "Reserve actions use the same API contract already powering checkout holds.",
      "Availability is aggregated across hubs but chosen explicitly before reserve.",
    ],
  },
  {
    badge: "Top rated",
    category: "Sleep support",
    title: "Sleep Recovery Kit",
    subtitle:
      "A bundled D2C kit with clean product education, clear pricing, and live warehouse-aware availability.",
    image: "/images/sleep-kit.png",
    benefits: ["Starter bundle", "Night routine guide", "Easy re-order"],
    delivery: "Strong repeat purchase in metro cities",
    rating: "4.9",
    reviewCount: 241,
    monthlyBought: "450+ bought in past month",
    offerLabel: "Most loved combo",
    mrpMultiplier: 1.2,
    detailBullets: [
      "Designed to feel like a modern marketplace bundle page.",
      "Supports longer-form product education without leaking inventory internals.",
      "Lets shoppers reserve a chosen quantity directly from the detail screen.",
      "Good fit for curated wellness kits and giftable care products.",
    ],
  },
  {
    badge: "Editor's pick",
    category: "Home care",
    title: "Wellness Diffuser",
    subtitle:
      "Warm home-care merchandising with a marketplace-ready card layout and stock transparency at reserve time.",
    image: "/images/care-speaker.png",
    benefits: ["Clean aesthetic", "Giftable format", "Ready for dispatch"],
    delivery: "Ships reliably from both hubs",
    rating: "4.6",
    reviewCount: 98,
    monthlyBought: "90+ bought in past month",
    offerLabel: "Featured drop",
    mrpMultiplier: 1.15,
    detailBullets: [
      "Styled for a visual, image-heavy home wellness product page.",
      "Keeps pricing and delivery cues front and center like a retail marketplace.",
      "Reserve action remains the same protected stock hold underneath.",
      "Suitable for catalog sections that need a softer merchandising tone.",
    ],
  },
];

export const productCategories = [
  "All",
  "Daily wellness",
  "Connected care",
  "Sleep support",
  "Home care",
] as const;

export function getProductMerch(
  product: Pick<ProductListItem, "name">,
  index = 0,
): ProductMerch {
  const normalized = product.name.toLowerCase();

  if (normalized.includes("gummies") || normalized.includes("headphones")) {
    return merchProfiles[0];
  }

  if (normalized.includes("monitor") || normalized.includes("keyboard")) {
    return merchProfiles[1];
  }

  if (normalized.includes("sleep") || normalized.includes("speaker")) {
    return merchProfiles[2];
  }

  if (normalized.includes("diffuser")) {
    return merchProfiles[3];
  }

  return merchProfiles[index % merchProfiles.length];
}
