import type { ProductListItem } from "@/lib/data";

export type ProductMerch = {
  badge: string;
  category: string;
  title: string;
  subtitle: string;
  image: string;
  images: string[];
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
    images: ["/images/performance-gummies.png"],
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
    images: ["/images/smart-monitor.png"],
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
    images: ["/images/sleep-kit.png"],
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
    images: ["/images/care-speaker.png"],
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

  if (normalized.includes("smart pulse massager")) {
    return {
      ...merchProfiles[1],
      image: "https://m.media-amazon.com/images/I/71XKCFA12RL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/71XKCFA12RL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71dqjXtOphL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/716dFV0ilqL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71V-1z6R29L._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("aromatherapy sleep mist")) {
    return {
      ...merchProfiles[2],
      image: "https://m.media-amazon.com/images/I/61prqhScQvL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61prqhScQvL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/81Ugjsc1BDL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/81widQt-x5L._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71J8ZMqoSjL._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("gut balance probiotic")) {
    return {
      ...merchProfiles[0],
      image: "https://m.media-amazon.com/images/I/61oJWB3pL2L._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61oJWB3pL2L._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61dYEdGjaZL._SL1000_.jpg",
        "https://m.media-amazon.com/images/I/61k5TXhnqXL._SL1000_.jpg",
        "https://m.media-amazon.com/images/I/714lXPNAhgL._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("hydration support tablets")) {
    return {
      ...merchProfiles[0],
      image: "https://m.media-amazon.com/images/I/51norNbDRRL._SL1080_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/51norNbDRRL._SL1080_.jpg",
        "https://m.media-amazon.com/images/I/71-++RkJ7rL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61i6VvjS+nL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/718tTjDt8SL._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("performance gummies")) {
    return {
      ...merchProfiles[0],
      image: "https://m.media-amazon.com/images/I/712qRArwBeL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/712qRArwBeL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/716rpEziQkL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71I5Exf3rdL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/51KMUiaaW4L.jpg",
      ],
    };
  }

  if (
    normalized.includes("gummies") ||
    normalized.includes("hydration") ||
    normalized.includes("probiotic")
  ) {
    return merchProfiles[0];
  }

  if (normalized.includes("posture relief wrap")) {
    return {
      ...merchProfiles[1],
      image: "https://m.media-amazon.com/images/I/81++cpOO0ZL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/81++cpOO0ZL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71aFK4z1TeL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71NSIZhf+eL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71bz-CSjJML._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("smart cycle monitor")) {
    return {
      ...merchProfiles[1],
      image: "https://m.media-amazon.com/images/I/61ryxDMqRUL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/61ryxDMqRUL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61CSVZXNecL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/614LO0DhAmL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61s7VzotLoL._SL1500_.jpg",
      ],
    };
  }

  if (
    normalized.includes("monitor") ||
    normalized.includes("massager") ||
    normalized.includes("posture")
  ) {
    return merchProfiles[1];
  }

  if (normalized.includes("sleep recovery kit")) {
    return {
      ...merchProfiles[2],
      image: "https://m.media-amazon.com/images/I/71G8SZWCXLL._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/71G8SZWCXLL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/81gv9uEJ5UL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/71sj9FqqieL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/712iNzYz2EL._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("thermal recovery bottle")) {
    return {
      ...merchProfiles[2],
      image: "https://m.media-amazon.com/images/I/51wMHB2Zi3L._SL1500_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/51wMHB2Zi3L._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61rWQnFCHqL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/61owPyjm8IL._SL1500_.jpg",
        "https://m.media-amazon.com/images/I/81OSACg42xL._SL1500_.jpg",
      ],
    };
  }

  if (
    normalized.includes("sleep") ||
    normalized.includes("mist") ||
    normalized.includes("thermal")
  ) {
    return merchProfiles[2];
  }

  if (normalized.includes("wellness diffuser")) {
    return {
      ...merchProfiles[3],
      image: "https://m.media-amazon.com/images/I/51x0ucQEruL._SL1024_.jpg",
      images: [
        "https://m.media-amazon.com/images/I/51x0ucQEruL._SL1024_.jpg",
        "https://m.media-amazon.com/images/I/61DKnKfoJkL._SL1080_.jpg",
        "https://m.media-amazon.com/images/I/612YX5lwhmL._SL1000_.jpg",
        "https://m.media-amazon.com/images/I/71x4aLioeBL._SL1500_.jpg",
      ],
    };
  }

  if (normalized.includes("diffuser") || normalized.includes("aroma")) {
    return merchProfiles[3];
  }

  return merchProfiles[index % merchProfiles.length];
}
