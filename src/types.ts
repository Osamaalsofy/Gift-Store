export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: "Gourmet & Sweets" | "Wellness & Comfort" | "Tech & Gadgets" | "Home & Decor" | "Creative & Lifestyle";
  image: string;
  secondaryImage: string;
  hoverEffect?: string;
  stock: number;
  tags: string[];
  features: string[];
  dimensions?: string;
  materials?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface GiftFinderRequest {
  recipientProfile: {
    ageGroup: "Child" | "Teenager" | "Young Adult" | "Adult" | "Senior";
    genderPreference: "Any" | "Feminine" | "Masculine" | "Neutral";
    hobbies: string; // comma separated or single string
  };
  occasion: "Birthday" | "Anniversary" | "Graduation" | "Wedding" | "Mother's/Father's Day" | "Thank You" | "Just Because" | "Holiday";
  relationship: string; // e.g. Mother, Partner, Friend, Colleague
  budget: number; // max budget
  giftStyle: "Sentimental" | "Practical" | "Funny" | "Elegant" | "Sensory & Cozy";
}

export interface BespokeGiftIdea {
  title: string;
  description: string;
  estimatedCost: string;
  reasoning: string;
}

export interface GiftFinderResponse {
  analysis: string;
  suggestedCatalogProductIds: string[]; // matching IDs from our database
  bespokeSuggestions: BespokeGiftIdea[]; // custom creative suggestions
  giftWrappingRecommendation: string;
  curatedGreetingMessage: string;
}

export interface RegistryItem {
  productId: string;
  quantityRequested: number;
  quantityReceived: number;
}

export interface GiftRegistry {
  id: string;
  name: string;
  occasion: string;
  date: string;
  items: RegistryItem[];
  notes?: string;
  registrantName?: string;
  email?: string;
}
