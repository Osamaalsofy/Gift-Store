import React, { useState, useEffect, useRef } from "react";
import {
  Gift,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  X,
  Trash2,
  ChevronRight,
  Plus,
  Minus,
  Info,
  Calendar,
  Filter,
  Check,
  Loader2,
  Share2,
  Copy,
  ExternalLink,
  BookOpen,
  Truck,
  RotateCcw,
  Sparkle,
  Menu,
  Mail,
  ArrowRightCircle,
  Zap,
  LockKeyhole,
  Fingerprint,
  Pause,
  Play,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CATALOG } from "./data";
import { Product, CartItem, GiftFinderRequest, GiftFinderResponse, GiftRegistry } from "./types";
import { safeStorage } from "./lib/storage";
import { copyToClipboard } from "./lib/clipboard";
import { t, Language } from "./lib/translate";
import { isSupabaseConfigured, saveOrderToSupabase, saveRegistryToSupabase, saveInquiryToSupabase } from "./lib/supabase";
import GildedSilkWaves from "./components/GildedSilkWaves";
import InteractiveCard from "./components/InteractiveCard";
import { HeroSection } from "./components/ui/hero-section-2";

const UKFlag = () => (
  <svg className="w-5 h-5 rounded-full inline-block border border-gray-200 shrink-0" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="uk-clip">
      <circle cx="15" cy="15" r="15" />
    </clipPath>
    <g clipPath="url(#uk-clip)">
      <rect width="30" height="30" fill="#00247D" />
      <path d="M0,0 L30,30 M30,0 L0,30" stroke="#fff" strokeWidth="4" />
      <path d="M0,0 L30,30 M30,0 L0,30" stroke="#CF142B" strokeWidth="2" />
      <path d="M15,0 L15,30 M0,15 L30,15" stroke="#fff" strokeWidth="6" />
      <path d="M15,0 L15,30 M0,15 L30,15" stroke="#CF142B" strokeWidth="3" />
    </g>
  </svg>
);

const SAFlag = () => (
  <svg className="w-5 h-5 rounded-full inline-block border border-[#3CA35F] shrink-0" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="sa-clip">
      <circle cx="15" cy="15" r="15" />
    </clipPath>
    <g clipPath="url(#sa-clip)">
      <rect width="30" height="30" fill="#006C35" />
      <path d="M7 13 C 10 10, 20 10, 23 13 C 20 12, 10 12, 7 13" fill="#fff" />
      <path d="M10 11 L 20 11" stroke="#fff" strokeWidth="1" strokeLinecap="round" />
      <path d="M11 15 L19 15 M 12 14 L 12 16" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </svg>
);

const SUGGESTED_HOBBIES_PRESETS = [
  { label: "Specialty Coffee", emoji: "☕", category: "Gastronomy" },
  { label: "Sourdough Baking", emoji: "🥖", category: "Gastronomy" },
  { label: "Artisanal Chocolate", emoji: "🍫", category: "Gastronomy" },
  { label: "Inner Mindfulness", emoji: "🧘", category: "Mindfulness" },
  { label: "Aromatherapy Oils", emoji: "🌱", category: "Mindfulness" },
  { label: "Greenhouse Moss", emoji: "🪴", category: "Mindfulness" },
  { label: "Vinyl Soundtracks", emoji: "📻", category: "Design" },
  { label: "Raw Brass Crafts", emoji: "🪵", category: "Design" },
  { label: "Epic Literature", emoji: "📖", category: "Design" },
  { label: "35mm Film Photos", emoji: "📷", category: "Adventure" },
  { label: "Alpine Hiking", emoji: "🌲", category: "Adventure" },
  { label: "Wild Flower Pressed", emoji: "🌸", category: "Adventure" },
];

export default function App() {
  // Language & Translation State
  const [lang, setLang] = useState<Language>(() => {
    try {
      const stored = safeStorage.getItem("presentperfect_lang");
      return (stored === "ar" || stored === "en") ? stored : "en";
    } catch {
      return "en";
    }
  });

  const translate = (key: string) => t(key, lang);

  const translateBubble = (str: string) => {
    if (!str) return "";
    const match = str.match(/^([\s\S]*?)\s+([\s\S]+)$/u);
    if (match && match[1] && /[\p{Emoji}\u200d\u2600-\u27BF]/u.test(match[1])) {
      return `${match[1]} ${translate(match[2])}`;
    }
    return translate(str);
  };

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    try {
      safeStorage.setItem("presentperfect_lang", newLang);
    } catch {}
  };

  useEffect(() => {
    try {
      safeStorage.setItem("presentperfect_lang", lang);
    } catch {}
    
    // Smooth layout adjustment for RTL Arabic typography
    const root = document.getElementById("root");
    const appRoot = document.getElementById("app-root");
    if (lang === "ar") {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
      if (root) {
        root.style.fontFamily = "'Alexandria', 'Cairo', 'Almarai', sans-serif";
      }
      if (appRoot) {
        appRoot.style.fontFamily = "'Alexandria', 'Cairo', 'Almarai', sans-serif";
      }
      document.body.style.fontFamily = "'Alexandria', 'Cairo', 'Almarai', sans-serif";
    } else {
      document.documentElement.dir = "ltr";
      document.documentElement.lang = "en";
      if (root) {
        root.style.fontFamily = "";
      }
      if (appRoot) {
        appRoot.style.fontFamily = "";
      }
      document.body.style.fontFamily = "";
    }
  }, [lang]);

  // Navigation & Tabs
  const [activeTab, setActiveTab ] = useState<"shop" | "registry" | "journal" | "about" | "shipping" | "carbon" | "inquiry">("shop");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vaultMenuOpen, setVaultMenuOpen] = useState(false);
  
  // Footer scroll-linked cinematic opacity
  const [footerVisibleRatio, setFooterVisibleRatio] = useState<number>(0.25);
  const footerRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleManualScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };
  
  // Catalog states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "rating" | "default">("default");
  const [marqueeSpeed, setMarqueeSpeed] = useState<number>(40); // speed in seconds
  const [marqueeDirection, setMarqueeDirection] = useState<"left" | "right">("left");
  const [marqueeIsPlaying, setMarqueeIsPlaying] = useState<boolean>(true);
  
  // Product Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  
  // Cart state (stored in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = safeStorage.getItem("presentperfect_cart");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string>("");

  // Inquiries State
  const [userInquiries, setUserInquiries] = useState<any[]>(() => {
    try {
      const stored = safeStorage.getItem("presentperfect_inquiries");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Registry state
  const [registries, setRegistries] = useState<GiftRegistry[]>(() => {
    try {
      const stored = safeStorage.getItem("presentperfect_registries");
      return stored ? JSON.parse(stored) : [
        {
          id: "demo-wedding",
          name: "Charlotte & Julian's Autumn Wedding",
          occasion: "Wedding",
          date: "2026-10-17",
          notes: "Thank you all so much for celebrating our new beginnings with us. We curated this list with mindfulness.",
          items: [
            { productId: "organic-tea-set", quantityRequested: 1, quantityReceived: 0 },
            { productId: "lavender-blanket", quantityRequested: 2, quantityReceived: 1 },
            { productId: "essential-diffuser", quantityRequested: 1, quantityReceived: 1 },
            { productId: "gourmet-cheese-board", quantityRequested: 1, quantityReceived: 0 }
          ]
        }
      ];
    } catch {
      return [];
    }
  });
  
  // Registry Creator states
  const [newRegistryName, setNewRegistryName] = useState<string>("");
  const [newRegistryOccasion, setNewRegistryOccasion] = useState<string>("Wedding");
  const [newRegistryDate, setNewRegistryDate] = useState<string>("");
  const [newRegistryNotes, setNewRegistryNotes] = useState<string>("");
  const [newRegistryItems, setNewRegistryItems] = useState<string[]>([]); // product IDs
  const [newRegistryEmail, setNewRegistryEmail] = useState<string>("");
  const [newRegistryRegistrant, setNewRegistryRegistrant] = useState<string>("");

  // AI Finder state
  const [aiFinderRequest, setAiFinderRequest] = useState<GiftFinderRequest>({
    recipientProfile: {
      ageGroup: "Adult",
      genderPreference: "Neutral",
      hobbies: ""
    },
    occasion: "Birthday",
    relationship: "Friend",
    budget: 100,
    giftStyle: "Elegant"
  });
  const [customHobbyInput, setCustomHobbyInput] = useState<string>("");
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>(["☕ Specialty Coffee", "🧘 Inner Mindfulness"]);
  const [hobbySearchQuery, setHobbySearchQuery] = useState<string>("");
  const [internetHobbyBubbles, setInternetHobbyBubbles] = useState<string[]>([]);
  const [isHobbySearching, setIsHobbySearching] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<GiftFinderResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Inquiry form states
  const [inquiryName, setInquiryName] = useState<string>("");
  const [inquiryEmail, setInquiryEmail] = useState<string>("");
  const [inquirySpecialty, setInquirySpecialty] = useState<string>("Hand-Carved Red Sandalwood Chests");
  const [inquiryMessage, setInquiryMessage] = useState<string>("");
  const [inquiryCallback, setInquiryCallback] = useState<boolean>(false);
  const [inquirySealEnvelope, setInquirySealEnvelope] = useState<boolean>(true);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);

  // General Notification / Alert
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null);

  // Gift Mixer states
  const [mixerItems, setMixerItems] = useState<Array<{ id: string; name: string; price: number; icon: string; quantity: number }>>([
    { id: "flora-peonies", name: "Fresh Coral Peonies", price: 18.00, icon: "🌸", quantity: 1 },
    { id: "taste-truffles", name: "Artisanal Dark Truffles", price: 24.00, icon: "🍫", quantity: 1 }
  ]);
  const [mixerCustomName, setMixerCustomName] = useState<string>("");
  const [mixerCustomPrice, setMixerCustomPrice] = useState<number>(35);
  const [mixerCustomIcon, setMixerCustomIcon] = useState<string>("🎁");
  const [mixerWrapStyle, setMixerWrapStyle] = useState<string>("Matte Emerald Silk Fabric Wrap");
  const [mixerTieStyle, setMixerTieStyle] = useState<string>("Emerald Silk Velvet Ribbon");
  const [mixerAccent, setMixerAccent] = useState<string>("Pressed Fresh Pine Sprig");
  const [mixerGreetingText, setMixerGreetingText] = useState<string>("");
  const [mixerIncludeCard, setMixerIncludeCard] = useState<boolean>(true);
  const [mixerResponse, setMixerResponse] = useState<any>(null);
  const [isMixerLoading, setIsMixerLoading] = useState<boolean>(false);
  const [mixerLoadingStep, setMixerLoadingStep] = useState<number>(0);

  // Gift Mixer Ceremony / Introduction & Rubbing state
  const [isCeremonyOpen, setIsCeremonyOpen] = useState<boolean>(false);
  const [ceremonyStep, setCeremonyStep] = useState<"details" | "rubbing" | "ready">("details");
  const [ceremonyName, setCeremonyName] = useState<string>("");
  const [ceremonyAddress, setCeremonyAddress] = useState<string>("");
  const [ceremonyEmail, setCeremonyEmail] = useState<string>("");
  const [ceremonyPhone, setCeremonyPhone] = useState<string>("");
  const [rubProgress, setRubProgress] = useState<number>(0);
  const [rubbedSuccessfully, setRubbedSuccessfully] = useState<boolean>(false);

  const generateGiftMixNarrative = async () => {
    if (mixerItems.length === 0) {
      triggerAlert("Please add at least one item to your mix tray.", "info");
      return;
    }
    setIsMixerLoading(true);
    setMixerResponse(null);
    setMixerLoadingStep(0);

    // Rapid loading step simulation to keep user engaged and showcase high speed
    const stepInterval = setInterval(() => {
      setMixerLoadingStep(prev => (prev < 4 ? prev + 1 : 4));
    }, 350);

    try {
      const itemNames = mixerItems.flatMap(item => Array(item.quantity).fill(`${item.icon} ${item.name}`));
      
      const getClientFallbackData = () => {
        const cleanItems = itemNames.map(it => it.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim());
        const leadItem = cleanItems[0] || "Custom Selection";
        const secondItem = cleanItems[1] || "Bespoke Keepsake";
        const listStr = cleanItems.join(", ").replace(/, ([^,]*)$/, ", and $1");
        return {
          title: `The ${leadItem} & ${secondItem} Composition`,
          narrative: `A singular, tailored curation uniting ${listStr} into a striking sensory dialogue. The physical contrast between these objects—ranging from botanical delicacy to modern design—creates a rich conversation of form and texture. Arranged with meticulous spacing inside a signature wooden tray, the collection offers an immediate feeling of premium discovery and personal care.`,
          ceremonyInstructions: `Gently sever the hand-wound ${mixerTieStyle}, allowing the delicate tension to release. Inhale the refreshing scent of the ${mixerAccent} before peeling back the protective wrap to uncover the bespoke treasures nestled inside.`,
          craftsmanSignOff: "Master Curator Lin, House of PresentPerfect",
          simulatedVibeProfile: "Artisanal Synergy & Innovation",
          estimatedPrepareTime: "1.5 hours of styling"
        };
      };

      try {
        const res = await fetch("/api/ai/mix-gift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: itemNames,
            wrapStyle: mixerWrapStyle,
            tieStyle: mixerTieStyle,
            accent: mixerAccent,
            greetingText: mixerGreetingText
          })
        });
        if (res.ok) {
          const data = await res.json();
          setMixerResponse(data);
          triggerAlert("Cinematic curation narrative successfully crafted!", "success");
        } else {
          setMixerResponse(getClientFallbackData());
          triggerAlert("Bespoke curation crafted locally.", "success");
        }
      } catch (fetchErr) {
        setMixerResponse(getClientFallbackData());
        triggerAlert("Bespoke curation crafted locally.", "success");
      }
    } catch (err) {
      console.error(err);
      triggerAlert("Curation error. Utilizing backup styling guidelines.", "error");
    } finally {
      clearInterval(stepInterval);
      setIsMixerLoading(false);
    }
  };

  const openCurationCeremony = () => {
    if (mixerItems.length === 0) {
      triggerAlert("Add items to your mix first!", "info");
      return;
    }
    setIsCeremonyOpen(true);
    setCeremonyStep("details");
    setRubProgress(0);
    setRubbedSuccessfully(false);
  };

  const finalizeCeremonyCuration = () => {
    // Calculate custom gift total price (items + boutique tray & custom wrap = base tray price $20.00)
    const itemsTotal = mixerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalPrice = itemsTotal + 20.00 + (mixerIncludeCard ? 5.00 : 0); // Base tray + wrap premium, plus card if included
    
    // Generate description based on items
    const itemSummaries = mixerItems.map(item => `${item.quantity}x ${item.icon} ${item.name}`).join(", ");
    const customTitle = mixerResponse?.title || "Bespoke Artisanal Gift Mix";
    
    const customProduct: Product = {
      id: "custom-mix-" + Date.now(),
      name: customTitle,
      description: `Bespoke hand-crafted creation containing: ${itemSummaries}. Elegantly wrapped in ${mixerWrapStyle} with a ${mixerTieStyle} and a ${mixerAccent} accent.${mixerIncludeCard ? ` Accompanied by a hand-written calligraphy card.` : ""}`,
      price: totalPrice,
      rating: 5.0,
      reviewCount: 1,
      category: "Creative & Lifestyle",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600",
      secondaryImage: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80&w=600",
      stock: 100,
      tags: ["Custom", "Bespoke", "Mixer"],
      features: [
        `Uniquely combined: ${itemSummaries}`,
        `Packaged in ${mixerWrapStyle}`,
        `Finished with ${mixerTieStyle} and ${mixerAccent}`,
        `Sourced for client: ${ceremonyName || "Anonymous"} (${ceremonyEmail || "No Email"})`,
        mixerIncludeCard 
          ? `Includes handwritten calligraphy card: "${mixerGreetingText || "Warmest wishes"}"`
          : "No calligraphy card selected"
      ],
      materials: "Organic unbleached fibers, sustainably forested wood, fresh botanicals",
      dimensions: "Varies depending on curation density"
    };

    addToCart(customProduct, 1);
  };

  // Persist state updates to localStorage
  useEffect(() => {
    try {
      safeStorage.setItem("presentperfect_cart", JSON.stringify(cart));
    } catch (err) {
      console.warn("Storage write blocked:", err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      safeStorage.setItem("presentperfect_registries", JSON.stringify(registries));
    } catch (err) {
      console.warn("Storage write blocked:", err);
    }
  }, [registries]);

  useEffect(() => {
    try {
      safeStorage.setItem("presentperfect_inquiries", JSON.stringify(userInquiries));
    } catch (err) {
      console.warn("Storage write blocked:", err);
    }
  }, [userInquiries]);

  // Temporary automatic notification fade out
  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Intersection Observer to smoothly calculate visible ratio of the footer card
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        // smooth ratio of visibility
        setFooterVisibleRatio(entry.intersectionRatio);
      },
      {
        threshold: Array.from({ length: 41 }, (_, i) => i / 40),
        rootMargin: "0px 0px -10px 0px"
      }
    );

    const currentFooter = footerRef.current;
    if (currentFooter) {
      observer.observe(currentFooter);
    }

    return () => {
      if (currentFooter) {
        observer.unobserve(currentFooter);
      }
    };
  }, []);



  const triggerAlert = (text: string, type: "success" | "info" | "error" = "success") => {
    setAlertMessage({ type, text });
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryMessage.trim()) {
      triggerAlert("Please fill in all the traditional registry inquiries parchment spaces.", "error");
      return;
    }
    
    const newInquiry = {
      id: "inq-" + Date.now(),
      name: inquiryName,
      email: inquiryEmail,
      specialty: inquirySpecialty,
      message: inquiryMessage,
      callback: inquiryCallback,
      sealed: inquirySealEnvelope,
      date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
    };

    setUserInquiries(prev => [newInquiry, ...prev]);
    setInquirySuccess(true);
    triggerAlert("Your handwritten inquiry has been inscribed in our lacquer seal indices!", "success");

    // Supabase Integration
    if (isSupabaseConfigured()) {
      const res = await saveInquiryToSupabase({
        inquiry_id: newInquiry.id,
        name: newInquiry.name,
        email: newInquiry.email,
        specialty: newInquiry.specialty,
        message: newInquiry.message,
        callback: newInquiry.callback,
        sealed: newInquiry.sealed,
        date: newInquiry.date
      });
      if (res.success) {
        triggerAlert("Inquiry saved securely to your Supabase database!", "success");
      } else {
        triggerAlert(`Supabase connection error: ${res.error || "Unknown database error"}`, "error");
      }
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    triggerAlert(`Added ${product.name} to your styling bag.`, "success");
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    triggerAlert("Item removed from your styling bag.", "info");
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    const formData = new FormData(formEl);
    const notecard = formData.get("notecard")?.toString() || "";
    const address = formData.get("address")?.toString() || "";

    const generatedOrder = "PP-" + Math.floor(100000 + Math.random() * 900000);
    const cartSnapshot = [...cart];

    setOrderId(generatedOrder);
    setIsCheckoutSuccess(true);
    setCart([]);
    setIsCartOpen(false);
    triggerAlert("Your order was placed beautifully. Thank you!", "success");

    // Supabase Integration
    if (isSupabaseConfigured()) {
      const itemsToSave = cartSnapshot.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      }));
      const res = await saveOrderToSupabase({
        order_id: generatedOrder,
        items: itemsToSave,
        total: cartSnapshot.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
        address: address || "Pre-arranged Pickup",
        notes: notecard
      });
      if (res.success) {
        triggerAlert("Order logged securely to your Supabase database!", "success");
      } else {
        triggerAlert(`Supabase connection error: ${res.error || "Unknown database error"}`, "error");
      }
    }
  };

  // Registry operations
  const createRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegistryName.trim() || !newRegistryDate || !newRegistryRegistrant.trim()) {
      triggerAlert("Please fill in the Registrant Name, Registry Title, and celebration date.", "error");
      return;
    }
    if (newRegistryItems.length === 0) {
      triggerAlert("Please select at least one item to pre-populate your registry list.", "error");
      return;
    }

    const newRegistry: GiftRegistry = {
      id: "reg-" + Date.now(),
      name: newRegistryName,
      occasion: newRegistryOccasion,
      date: newRegistryDate,
      notes: newRegistryNotes,
      registrantName: newRegistryRegistrant,
      email: newRegistryEmail,
      items: newRegistryItems.map(prodId => ({
        productId: prodId,
        quantityRequested: 1,
        quantityReceived: 0
      }))
    };

    setRegistries(prev => [newRegistry, ...prev]);
    
    // Reset form
    setNewRegistryName("");
    setNewRegistryDate("");
    setNewRegistryNotes("");
    setNewRegistryRegistrant("");
    setNewRegistryEmail("");
    setNewRegistryItems([]);
    
    triggerAlert(`Successfully published "${newRegistry.name}"!`, "success");

    // Supabase Integration
    if (isSupabaseConfigured()) {
      const res = await saveRegistryToSupabase({
        registry_id: newRegistry.id,
        name: newRegistry.name,
        occasion: newRegistry.occasion,
        date: newRegistry.date,
        notes: newRegistry.notes,
        registrant_name: newRegistry.registrantName,
        email: newRegistry.email,
        items: newRegistry.items
      });
      if (res.success) {
        triggerAlert("Registry synchronized to your Supabase cloud database!", "success");
      } else {
        triggerAlert(`Supabase connection error: ${res.error || "Unknown database error"}`, "error");
      }
    }
  };

  const toggleProductForNewRegistry = (productId: string) => {
    setNewRegistryItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const contributeToRegistryItem = (registryId: string, productId: string) => {
    setRegistries(prev => {
      return prev.map(reg => {
        if (reg.id === registryId) {
          return {
            ...reg,
            items: reg.items.map(item => {
              if (item.productId === productId) {
                const targetProd = CATALOG.find(p => p.id === productId);
                triggerAlert(`You have beautifully gifted an item from this registry: ${targetProd?.name || 'Selected Item'}!`, "success");
                return { ...item, quantityReceived: Math.min(item.quantityRequested + 2, item.quantityReceived + 1) };
              }
              return item;
            })
          };
        }
        return reg;
      });
    });
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev => {
      const exists = prev.includes(hobby);
      if (exists) {
        return prev.filter(h => h !== hobby);
      } else {
        return [...prev, hobby];
      }
    });
  };

  const searchHobbyTrends = async (queryTerm: string) => {
    const term = queryTerm.trim();
    if (!term) {
      triggerAlert("Please enter a keyword to search web trends.", "info");
      return;
    }
    setIsHobbySearching(true);
    try {
      const res = await fetch("/api/ai/hobby-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.bubbles)) {
          setInternetHobbyBubbles(data.bubbles);
          triggerAlert(`Internet trends loaded for "${term}"!`, "success");
        }
      } else {
        triggerAlert("Offline local directory used for trend query.", "info");
        // Fallback local results manually if search fails
        const localSamples = [`✨ Custom ${term}`, `🏺 Artisanal ${term}`, `🌿 Organic ${term}`, `📚 Vintage ${term}`];
        setInternetHobbyBubbles(localSamples);
      }
    } catch (e) {
      console.error(e);
      const localSamples = [`✨ Custom ${term}`, `🏺 Artisanal ${term}`, `🌿 Organic ${term}`, `📚 Vintage ${term}`];
      setInternetHobbyBubbles(localSamples);
    } finally {
      setIsHobbySearching(false);
    }
  };

  // AI Finder handler
  const handleAiFinderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    // construct raw hobbies
    const finalRequest = {
      ...aiFinderRequest,
      recipientProfile: {
        ...aiFinderRequest.recipientProfile,
        hobbies: selectedHobbies.length > 0 
          ? selectedHobbies.join(", ") 
          : (customHobbyInput.trim() || "quality time, soft objects, reading books")
      }
    };

    const getClientFallbackData = () => {
      const budgetVal = Number(finalRequest.budget) || 100;
      const recipient = finalRequest.recipientProfile;
      const giftStyle = finalRequest.giftStyle;
      const relationship = finalRequest.relationship;
      const occasion = finalRequest.occasion;
      const lowerHobbies = (recipient.hobbies || "creative interests").toLowerCase();

      // Catalog recommendation heuristics based on selected style
      let catalogMatches: string[] = [];
      if (giftStyle.toUpperCase() === "SENSORY & COZY" || giftStyle.toUpperCase() === "SENSORY" || giftStyle.toLowerCase().includes("cozy")) {
        catalogMatches = ["lavender-blanket", "essential-diffuser", "amber-soy-candle", "organic-tea-set"];
      } else if (giftStyle.toUpperCase() === "ELEGANT" || giftStyle.toLowerCase().includes("elegant") || giftStyle.toLowerCase().includes("chic")) {
        catalogMatches = ["organic-robe", "gourmet-chocolates", "leather-journal", "wooden-charger"];
      } else if (giftStyle.toUpperCase() === "SENTIMENTAL" || giftStyle.toLowerCase().includes("sentimental") || giftStyle.toLowerCase().includes("nostalgic")) {
        catalogMatches = ["leather-journal", "instant-camera", "gourmet-chocolates", "botanical-embroidery"];
      } else { // Practical or default
        catalogMatches = ["wooden-charger", "gourmet-cheese-board", "ambient-eye-mask", "glass-terrarium"];
      }

      // Filter by budget using our prices
      const priceMap: { [key: string]: number } = {
        "gourmet-chocolates": 34.00,
        "organic-tea-set": 48.00,
        "lavender-blanket": 65.05,
        "essential-diffuser": 54.00,
        "organic-robe": 88.00,
        "wooden-charger": 39.99,
        "ambient-eye-mask": 54.00,
        "retro-keyboard": 119.00,
        "amber-soy-candle": 24.50,
        "botanical-embroidery": 28.00,
        "glass-terrarium": 36.00,
        "leather-journal": 45.00,
        "instant-camera": 95.00,
        "gourmet-cheese-board": 49.95
      };

      let filteredMatches = catalogMatches.filter(id => (priceMap[id] || 50) <= budgetVal);
      if (filteredMatches.length === 0) {
        filteredMatches = catalogMatches.slice(0, 2);
      } else if (filteredMatches.length > 3) {
        filteredMatches = filteredMatches.slice(0, 3);
      }

      const bespoke = [
        {
          title: "Custom Botanist Herbal Sleep Box",
          description: `Assemble dried chamomile florets, fresh organic lavender petals, and whole star anise inside custom cotton mesh sachets. Recommend spraying with sweet orange blossom water.`,
          estimatedCost: "$12.00",
          reasoning: `Directly targets relaxing sensations. Complements interests in ${lowerHobbies} perfectly with a warming scent.`
        },
        {
          title: "Gold-Leaf Calligraphy Memory Parchment",
          description: "Transcribe a significant date, traditional quote, or coordinates using high-end calligraphy fountain ink onto deckled-edge heavy luxury water-colored paper, wrapped with custom gold-foil botanical stickers.",
          estimatedCost: "$15.00",
          reasoning: "Gives a highly premium, sophisticated, museum-quality custom artwork experience."
        }
      ];

      return {
        analysis: `We've custom-tailored these options for your ${relationship} (${recipient.ageGroup}, pursuing ${recipient.genderPreference} aesthetic) who is deeply passionate about "${recipient.hobbies}". Recognizing the gift tone target is ${giftStyle}, we focused on selecting items that embody this spirit while keeping strictly under $${budgetVal} USD.`,
        suggestedCatalogProductIds: filteredMatches,
        bespokeSuggestions: bespoke,
        giftWrappingRecommendation: giftStyle.toUpperCase() === "ELEGANT" 
          ? "Impeccable dense matte forest-green paper bound with tight double-faced brass-satin ribbon and finalized with an initial wax seal."
          : "Natural unbleached recycled crinkle paper bound with thick rustic hemp cord, detailed with a small real sprig of pine, lavender, or eucalyptus.",
        curatedGreetingMessage: `Dear ${relationship}, wishing you the warmest of celebrations on this lovely ${occasion}. May your days be filled with absolute comfort, wellness, and peace.`
      };
    };

    try {
      try {
        const res = await fetch("/api/ai/gift-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalRequest)
        });

        if (res.ok) {
          const data = await res.json();
          setAiResponse(data);
          triggerAlert("The Master Concierge crafted your digital portfolio recommendations.", "success");
        } else {
          setAiResponse(getClientFallbackData());
          triggerAlert("Bespoke recommendations curated locally.", "success");
        }
      } catch (fetchErr) {
        setAiResponse(getClientFallbackData());
        triggerAlert("Bespoke recommendations curated locally.", "success");
      }
    } catch (err: any) {
      setAiError(err.message || "An unexpected error occurred during curation.");
      triggerAlert("Curation error. Utilizing backup styling guidelines.", "error");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Catalog filtering
  const filteredProducts = CATALOG.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // default order
  });

  // Unique categories
  const categories = ["All", "Gourmet & Sweets", "Wellness & Comfort", "Tech & Gadgets", "Home & Decor", "Creative & Lifestyle"];

  return (
    <div 
      id="app-root" 
      className="min-h-screen text-[#1C1814] font-sans transition-all duration-300 relative overflow-x-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(254, 253, 249, 0.98) 0%, rgba(244, 240, 232, 1) 120%)',
        backgroundColor: '#FAF7F1'
      }}
    >
      
      {/* Alert Banner */}
      {alertMessage && (
        <div 
          id="system-notification"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 border text-xs tracking-wider uppercase font-medium animate-bounce premium-shadow ${
            alertMessage.type === "success" 
              ? "bg-[#4A5D4E] text-white border-[#4A5D4E]" 
              : alertMessage.type === "error"
              ? "bg-red-950 text-red-200 border-red-800"
              : "bg-[#F5F2EE] text-[#1A1A1A] border-[#E5E2DE]"
          }`}
        >
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="ml-3 hover:opacity-50">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Styled Navigation Header */}
      <header id="site-header" className="sticky top-0 bg-[#FAF7F1]/95 backdrop-blur-md z-40 border-b border-[#E2D8C2] transition-all duration-350">
        
        {/* DESKTOP HEADER LAYOUT */}
        <div className="hidden xl:grid grid-cols-[1fr_auto_1fr] max-w-[1700px] mx-auto px-6 xl:px-12 h-24 items-center gap-6">
          
          {/* Left: Navigation links */}
          <div className="flex gap-6 lg:gap-8 text-xs lg:text-[13px] uppercase tracking-[0.2em] font-bold justify-start items-center">
            <button 
              onClick={() => { setActiveTab("shop"); setSelectedCategory("All"); }}
              className={`hover:text-[#4A5D4E] transition-colors py-1 cursor-pointer whitespace-nowrap ${activeTab === "shop" ? "text-[#4A5D4E] border-b-2 border-[#4A5D4E] pb-1" : "text-gray-550 font-semibold"}`}
            >
              {translate("Shop Catalog")}
            </button>
            <button 
              onClick={() => setActiveTab("registry")}
              className={`hover:text-[#4A5D4E] transition-colors py-1 cursor-pointer whitespace-nowrap ${activeTab === "registry" ? "text-[#4A5D4E] border-b-2 border-[#4A5D4E] pb-1" : "text-gray-550 font-semibold"}`}
            >
              {translate("Bespoke Offers")}
            </button>
          </div>

          {/* Center: Brand Identity */}
          <div className="text-center flex flex-col justify-center items-center px-4 shrink-0">
            <button 
              onClick={() => { setActiveTab("shop"); setSelectedCategory("All"); }}
              className="text-3xl lg:text-4xl font-instrument font-normal text-[#4A5D4E] transition-all hover:opacity-85 block bg-transparent border-none cursor-pointer tracking-tight whitespace-nowrap"
            >
              {translate("The Craft Gift")}
            </button>
            <p className="text-[10px] lg:text-[11px] uppercase tracking-[0.45em] text-[#A68B67] mt-1.5 font-bold leading-none whitespace-nowrap">
              {translate("Artisanal Present Boutique")}
            </p>
          </div>

          {/* Right: Actions, Lang switch, and extra pages */}
          <div className="flex justify-end gap-4 lg:gap-6 text-xs lg:text-[13px] uppercase tracking-[0.2em] font-bold items-center">
            <button 
              onClick={() => setActiveTab("journal")}
              className={`hover:text-[#4A5D4E] transition-colors py-1 cursor-pointer whitespace-nowrap ${activeTab === "journal" ? "text-[#4A5D4E] border-b-2 border-[#4A5D4E] pb-1" : "text-gray-550 font-semibold"}`}
            >
              {translate("Gift Mixer")}
            </button>
            <button 
              onClick={() => setActiveTab("about")}
              className={`hover:text-[#4A5D4E] transition-colors py-1 cursor-pointer whitespace-nowrap ${activeTab === "about" ? "text-[#4A5D4E] border-b-2 border-[#4A5D4E] pb-1" : "text-gray-550 font-semibold"}`}
            >
              {translate("Our History")}
            </button>
            
            <span className="text-[#E2D8C2] inline-block h-5 w-px shrink-0"></span>

            {/* Language Switcher Desktop */}
            <div className="flex items-center select-none shrink-0">
              <button 
                onClick={toggleLanguage} 
                className="flex items-center gap-2 px-3 py-1.5 border border-[#E2D8C2] bg-white hover:bg-[#F5F2EE] text-gray-700 rounded-full transition-all cursor-pointer shadow-xs font-sans text-xs shrink-0"
                title={lang === "en" ? "العربية" : "English"}
              >
                {lang === "en" ? (
                  <>
                    <SAFlag />
                    <span className="font-medium tracking-normal text-[#4A5D4E] whitespace-nowrap">العربية</span>
                  </>
                ) : (
                  <>
                    <UKFlag />
                    <span className="font-medium tracking-normal text-[#4A5D4E] whitespace-nowrap">English</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE HEADER LAYOUT */}
        <div className="flex xl:hidden h-16 px-4 justify-between items-center w-full">
          {/* Mobile Menu Button - Traditional Aesthetic */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1 sm:gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#4A5D4E] py-2 px-1 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline">{translate("Menu")}</span>
          </button>

          {/* Centered Mobile Title */}
          <button 
            onClick={() => { setActiveTab("shop"); setSelectedCategory("All"); setMobileMenuOpen(false); }}
            className="text-base sm:text-lg md:text-xl tracking-tight font-serif font-bold text-[#4A5D4E] py-1 bg-transparent border-none cursor-pointer whitespace-nowrap"
          >
            {translate("The Craft Gift")}
          </button>

          {/* Quick Actions (Direct Inquiry Form with Language flags switcher) */}
          <div className="flex items-center gap-2">
            {/* Language Switcher Mobile */}
            <div className="flex items-center select-none shrink-0">
              <button 
                onClick={toggleLanguage} 
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#E2D8C2] bg-white hover:bg-[#F5F2EE] text-gray-700 rounded-full transition-all cursor-pointer shadow-xs font-sans text-xs shrink-0"
                title={lang === "en" ? "العربية" : "English"}
              >
                {lang === "en" ? (
                  <>
                    <SAFlag />
                    <span className="font-semibold text-[#4A5D4E] text-[10px] leading-none">العربية</span>
                  </>
                ) : (
                  <>
                    <UKFlag />
                    <span className="font-semibold text-[#4A5D4E] text-[10px] leading-none">EN</span>
                  </>
                )}
              </button>
            </div>

            <button 
              onClick={() => { setActiveTab("inquiry"); setMobileMenuOpen(false); }}
              className={`p-2 bg-[#F5F2EE] border border-[#E2D8C2] text-[#1C1814] h-9 flex items-center gap-1.5 px-3 cursor-pointer ${activeTab === "inquiry" ? "text-[#4A5D4E] border-[#4A5D4E]" : "text-gray-550"}`}
              aria-label="Direct Inquiry Form"
            >
              <Mail className="w-3.5 h-3.5 text-[#4A5D4E]" />
              <span className="text-[9px] uppercase tracking-wider font-bold">{translate("Inquire")}</span>
            </button>
          </div>
        </div>

        {/* MOBILE ACCORDION DROP DOWN MENU */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#E2D8C2] bg-[#FAF7F1] w-full animate-fade-in divide-y divide-[#E2D8C2]/40 pb-4">
            <div className="px-6 py-4 flex flex-col space-y-3.5 text-xs uppercase tracking-[0.2em] font-semibold text-[#1C1814]">
              <button 
                onClick={() => { setActiveTab("shop"); setSelectedCategory("All"); setMobileMenuOpen(false); }}
                className={`py-2 text-left flex items-center justify-between ${activeTab === "shop" ? "text-[#4A5D4E] font-bold" : "text-gray-600"}`}
              >
                <span>{translate("Shop Curated Catalog")}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A68B67]" />
              </button>

              <button 
                onClick={() => { setActiveTab("journal"); setMobileMenuOpen(false); }}
                className={`py-2 text-left flex items-center justify-between ${activeTab === "journal" ? "text-[#4A5D4E] font-bold" : "text-gray-600"}`}
              >
                <span>{translate("Gift Mixer")}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A68B67]" />
              </button>

              <button 
                onClick={() => { setActiveTab("registry"); setMobileMenuOpen(false); }}
                className={`py-2 text-left flex items-center justify-between ${activeTab === "registry" ? "text-[#4A5D4E] font-bold" : "text-gray-600"}`}
              >
                <span>{translate("Bespoke Offers")}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A68B67]" />
              </button>

              <button 
                onClick={() => { setActiveTab("about"); setMobileMenuOpen(false); }}
                className={`py-2 text-left flex items-center justify-between ${activeTab === "about" ? "text-[#4A5D4E] font-bold" : "text-gray-600"}`}
              >
                <span>{translate("Our History & Story")}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A68B67]" />
              </button>

              <button 
                onClick={() => { setActiveTab("inquiry"); setMobileMenuOpen(false); }}
                className={`py-2 text-left flex items-center justify-between ${activeTab === "inquiry" ? "text-[#4A5D4E] font-bold text-[#4A5D4E]" : "text-[#A68B67]"}`}
              >
                <span>{translate("Send Questions / Inquire")}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#A68B67]" />
              </button>
            </div>

            <div className="px-6 py-4 flex flex-col space-y-2 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
              <button 
                onClick={() => { setActiveTab("shipping"); setMobileMenuOpen(false); }}
                className="text-left hover:text-[#4A5D4E] text-gray-500 py-1"
              >
                {translate("✓ Shipping Philosophy")}
              </button>
              <button 
                onClick={() => { setActiveTab("carbon"); setMobileMenuOpen(false); }}
                className="text-left hover:text-[#4A5D4E] text-gray-500 py-1"
              >
                {translate("✓ Carbon Neutral offset")}
              </button>
              <p className="border-t border-[#E2D8C2]/40 pt-3 text-[9px] text-[#A68B67] leading-tight">
                {translate("ESTABLISHED IN PREFECTURE ARCHIVES • 1978")}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Success Order Overlay */}
      {isCheckoutSuccess && (
        <div id="checkout-success-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-[#FDFCFB] max-w-md w-full p-8 md:p-10 border border-[#F0EDEA] text-center premium-shadow">
            <div className="w-16 h-16 bg-[#4A5D4E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-[#4A5D4E]" />
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#A68B67] font-bold">Aesthetic Accomplishment</span>
            <h3 className="text-2xl font-serif text-[#1A1A1A] mt-2 mb-4 font-semibold italic">Order Beautifully Placed</h3>
            
            <p className="text-xs text-[#666] leading-relaxed mb-6">
              Our packaging concierges are polishing and ribbons-tying your bespoke items. Your unique catalog invoice order is <strong className="text-[#1A1A1A]">{orderId}</strong>.
            </p>

            <div className="bg-[#F5F2EE] p-4 text-left border border-[#E5E2DE] rounded mb-6 text-xs text-[#666]">
              <div className="font-serif italic text-sm text-[#4A5D4E] mb-2">Wrapping Standard Applied:</div>
              Our iconic winter ivory crepe paper tied with a natural organic unbleached linen string and a dried sprig of wildflower flora. Designed to be opened unhurriedly.
            </div>

            <button 
              onClick={() => setIsCheckoutSuccess(false)}
              className="w-full py-3.5 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-[11px] uppercase tracking-[0.2em] transition-colors"
            >
              Continue Wandering
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      <div 
        id="shopping-cart-drawer"
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${isCartOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div 
          onClick={() => setIsCartOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${isCartOpen ? "opacity-100" : "opacity-0"}`} 
        />
        
        <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#FDFCFB] shadow-2xl flex flex-col h-full transform transition-transform duration-300 translate-x-0"
             style={{ transform: isCartOpen ? 'translateX(0)' : 'translateX(100%)' }}>
          
          <div className="px-6 py-6 border-b border-[#F0EDEA] flex justify-between items-center bg-[#FDFCFB]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#4A5D4E]" />
              <h2 className="text-sm uppercase tracking-[0.2em] font-bold">Your Styling Bag</h2>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-1 hover:opacity-50 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center">
                <Gift className="w-10 h-10 text-[#A68B67]/40 mb-4" />
                <p className="text-xs uppercase tracking-wider text-[#666]">Your bag is currently empty.</p>
                <button 
                  onClick={() => { setIsCartOpen(false); setActiveTab("shop"); }}
                  className="mt-4 px-6 py-2.5 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-[0.15em] hover:bg-[#3d4d40]"
                >
                  Browse Creations
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 py-2 border-b border-[#F5F2EE] items-start">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name} 
                      referrerPolicy="no-referrer"
                      className="w-16 h-20 object-cover bg-[#F5F2EE]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] uppercase tracking-widest text-[#A68B67]">{item.product.category}</span>
                      <h4 className="text-xs font-semibold uppercase text-[#1A1A1A] truncate">{item.product.name}</h4>
                      <p className="text-xs text-[#666] mt-1">${item.product.price.toFixed(2)} each</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                          className="p-1 bg-[#F5F2EE] border border-[#E5E2DE] hover:opacity-75"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          className="p-1 bg-[#F5F2EE] border border-[#E5E2DE] hover:opacity-75"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col justify-between h-20">
                      <span className="text-xs font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-[10px] uppercase tracking-wider text-red-700 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-6 border-t border-[#F0EDEA] bg-[#FDFCFB]">
              <div className="space-y-1.5 mb-4 text-xs">
                <div className="flex justify-between text-[#666]">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Premium Eco-Wrapping</span>
                  <span className="text-[#4A5D4E] font-medium">Complimentary</span>
                </div>
                <div className="flex justify-between text-[#666]">
                  <span>Courier Shipping</span>
                  <span className="text-[#4A5D4E] font-medium">Complimentary</span>
                </div>
                <div className="border-t border-[#F0EDEA] my-2 pt-2 flex justify-between font-bold text-sm text-[#1A1A1A]">
                  <span>Grand Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#666] font-medium block">Gift Note card message</label>
                  <textarea 
                    name="notecard"
                    placeholder="E.g. Happy Celebration, Mother! May this hand-made Turkish towel and aroma diffuser carry absolute peace. (Optional)" 
                    className="w-full p-2 border border-[#E5E2DE] bg-[#F5F2EE] text-xs resize-none h-14 focus:outline-none focus:border-[#4A5D4E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-[#666] font-medium block">Recipient Courier Address</label>
                  <input 
                    name="address"
                    type="text" 
                    placeholder="128 Aesthetic Boulevard, Suite 50" 
                    required
                    className="w-full p-2 border border-[#E5E2DE] bg-[#F5F2EE] text-xs focus:outline-none focus:border-[#4A5D4E]" 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-[11px] uppercase tracking-[0.2em] transition-colors"
                >
                  Proceed with Checkout — ${cartTotal.toFixed(2)}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <main id="main-content" className="w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-full"
          >
        
        {/* SHOP CATALOG TAB */}
        {activeTab === "shop" && (
          <div id="shop-tab-content" className="w-full">
                    <HeroSection
              logo={{
                url: "https://vucvdpamtrjkzmubwlts.supabase.co/storage/v1/object/public/users/user_2zMtrqo9RMaaIn4f8F2z3oeY497/avatar.png",
                alt: "Company Logo",
                text: translate("Your Logo")
              }}
              slogan={translate("ELEVATE YOUR PERSPECTIVE")}
              title={
                <>
                  {translate("Each Peak")} <br />
                  <span className="text-[#4A5D4E] font-serif">{translate("Teaches Something")}</span>
                </>
              }
              subtitle={translate("Discover breathtaking landscapes and challenge yourself with our guided mountain expeditions. Join a community of adventurers.")}
              callToAction={{
                text: translate("JOIN US TO EXPLORE"),
                href: "#catalog-grid-start",
              }}
              onExploreClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("catalog-grid-start");
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              backgroundImage="https://i.pinimg.com/1200x/1f/d8/a3/1fd8a3aded87169ffc89cc6339c2118c.jpg"
              contactInfo={{
                website: "explore.mountain.io",
                phone: "+1 (800) 555-PEAK",
                address: translate("Mogan Mountain Peaks"),
              }}
              className="mb-12"
            />

            {/* Cinematic Widescreen Container to Prevent Banding and Gaps on Massive Displays */}
            <div className="max-w-[1700px] mx-auto px-6 sm:px-12 md:px-16 pb-20">
              
              {/* Catalog Grid Section Header */}
              <div id="catalog-grid-start" className="pt-8 border-t border-[#E2D8C2] mb-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#A68B67] font-bold">
                {translate("In-Shop Exclusions")}
              </span>
              <h2 className="text-2xl font-serif font-medium mt-1 mb-6 flex items-center gap-2">
                {translate("Boutique Curated Products")} 
                <span className="text-xs font-sans text-gray-500 font-normal">
                  {translate("items found").replace("{count}", sortedProducts.length.toString())}
                </span>
              </h2>

              {/* Filters & Controls */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 border border-[#F0EDEA]">
                
                {/* Category selectors */}
                <div className="flex overflow-x-auto lg:overflow-visible lg:flex-wrap gap-2 pb-2 lg:pb-0 -mb-2 lg:mb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-2 shrink-0 lg:shrink lg:flex-wrap">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all rounded-xs whitespace-nowrap ${
                          selectedCategory === cat 
                            ? "bg-[#4A5D4E] text-white font-medium" 
                            : "bg-[#F5F2EE] text-[#1A1A1A] hover:bg-[#EAE7E2]"
                        }`}
                      >
                        {translate(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search & Sort controllers */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <input 
                      id="search-input-box"
                      type="text"
                      placeholder={translate("Search artisanal items...")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-60 pl-8 pr-3 py-1.5 bg-[#F7F5F2] border border-[#E5E2DE] text-xs focus:outline-none focus:border-[#4A5D4E]"
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")} 
                        className="absolute right-2.5 top-2.5 opacity-50 hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-[#F7F5F2] border border-[#E5E2DE] text-[10px] uppercase tracking-widest px-3 py-1.5 focus:outline-none focus:border-[#4A5D4E]"
                  >
                    <option value="default">{translate("Sort by: Default")}</option>
                    <option value="price-low">{translate("Sort by: Price (Low to High)")}</option>
                    <option value="price-high">{translate("Sort by: Price (High to Low)")}</option>
                    <option value="rating">{translate("Sort by: Best Rating")}</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Product Grid / Cinematic Infinite Loop */}
            {(() => {
              const marqueeProducts = [];
              if (sortedProducts.length > 0) {
                // We want to ensure the track has a dense count to look infinite.
                // 15 total items is a perfect density for wide displays.
                const repeats = Math.max(3, Math.ceil(15 / sortedProducts.length));
                for (let i = 0; i < repeats; i++) {
                  marqueeProducts.push(...sortedProducts);
                }
              }
              
              return sortedProducts.length === 0 ? (
                <div className="bg-white border border-[#F0EDEA] p-16 text-center text-gray-500">
                  <Gift className="w-12 h-12 text-[#A68B67] mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-serif mb-2">
                    {translate("No boutique treasures match your filter criteria.")}
                  </p>
                  <p className="text-xs font-sans tracking-wide">
                    {translate("Try looking for another category or clearing your current text search.")}
                  </p>
                  <button 
                    onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                    className="mt-4 px-6 py-2 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-widest"
                  >
                    {translate("Reset Settings")}
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  {/* Cinematic Filmstrip Style Block */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes cinematicMarquee {
                      0% { transform: translate3d(0, 0, 0); }
                      100% { transform: translate3d(-33.3333%, 0, 0); }
                    }
                    .animate-marquee-cinematic {
                      animation: cinematicMarquee var(--marquee-speed, 40s) linear infinite;
                    }
                    .animate-marquee-cinematic-reverse {
                      animation: cinematicMarquee var(--marquee-speed, 40s) linear infinite reverse;
                    }
                    .custom-scrollbar-hidden::-webkit-scrollbar {
                      display: none;
                    }
                    .custom-scrollbar-hidden {
                      -ms-overflow-style: none;
                      scrollbar-width: none;
                    }
                  `}} />

                  {/* Projector Deck Controls (HUD) */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mt-2 mb-8 bg-[#FAF9F6] p-4 border border-[#E2D8C2] rounded-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-2.5 w-2.5 relative">
                        {marqueeIsPlaying && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A5D4E] opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${marqueeIsPlaying ? "bg-[#4A5D4E]" : "bg-gray-400"}`}></span>
                      </span>
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#1C1814] font-sans">
                          {translate("Mogan Filmstrip Exhibition")}
                        </h4>
                        <p className="text-[9px] text-gray-400 font-sans tracking-wide">
                          {marqueeIsPlaying ? translate("Continuous cinema track running") : translate("Manual slider active (drag or press arrows)")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Play / Pause Toggle */}
                      <button
                        type="button"
                        onClick={() => setMarqueeIsPlaying(!marqueeIsPlaying)}
                        className="flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-widest font-bold bg-white border border-[#E2D8C2] hover:bg-[#FAF9F6] text-gray-700 transition-all rounded-xs shadow-xs"
                      >
                        {marqueeIsPlaying ? (
                          <>
                            <Pause className="w-3 h-3 text-[#4A5D4E]" />
                            {translate("Pause Cinematic Loop")}
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-[#4A5D4E]" />
                            {translate("Exhibition Mode")}
                          </>
                        )}
                      </button>

                      {/* Left/Right manual arrows */}
                      <div className="flex items-center gap-1 bg-white border border-[#E2D8C2] p-0.5 rounded-xs shadow-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setMarqueeIsPlaying(false);
                            handleManualScroll("left");
                          }}
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xs transition-all"
                          title={translate("Slide Left")}
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[8px] uppercase tracking-widest text-gray-400 px-2 font-bold select-none">
                          {translate("Browse")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setMarqueeIsPlaying(false);
                            handleManualScroll("right");
                          }}
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-xs transition-all"
                          title={translate("Slide Right")}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Direction switcher (only when playing) */}
                      {marqueeIsPlaying && (
                        <button
                          type="button"
                          onClick={() => setMarqueeDirection(marqueeDirection === "left" ? "right" : "left")}
                          className="px-3 py-1.5 text-[9px] uppercase tracking-widest bg-white border border-[#E2D8C2] hover:bg-[#FAF9F6] text-gray-700 font-bold rounded-xs flex items-center gap-1 shadow-xs"
                        >
                          {marqueeDirection === "left" ? "← Leftward" : "Rightward →"}
                        </button>
                      )}

                      {/* Tempo speed selections */}
                      {marqueeIsPlaying && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{translate("Tempo:")}</span>
                          <div className="flex gap-1 bg-[#F5F2EE] p-0.5 border border-[#E2D8C2] rounded-xs shadow-inner">
                            {[
                              { label: "Slow", speed: 65 },
                              { label: "Medium", speed: 40 },
                              { label: "Fast", speed: 20 },
                            ].map((opt) => (
                              <button
                                key={opt.speed}
                                type="button"
                                onClick={() => setMarqueeSpeed(opt.speed)}
                                className={`px-2.5 py-0.5 text-[8px] uppercase tracking-widest font-bold transition-all rounded-xs ${
                                  marqueeSpeed === opt.speed
                                    ? "bg-[#4A5D4E] text-white shadow-xs"
                                    : "text-gray-500 hover:text-[#1A1A1A]"
                                }`}
                              >
                                {translate(opt.label)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infinite Loop Scroller Viewport */}
                  <div className="relative w-full overflow-hidden py-8 select-none -mx-4 px-4 sm:-mx-8 sm:px-8">
                    {/* Cinematic Vignette Gradients */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-r from-[#FAF9F6] via-[#FAF9F6]/50 to-transparent z-[11] pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-36 bg-gradient-to-l from-[#FAF9F6] via-[#FAF9F6]/50 to-transparent z-[11] pointer-events-none" />

                    {/* Viewport tracking layer */}
                    <div 
                      ref={scrollRef}
                      className="w-full overflow-x-auto custom-scrollbar-hidden scroll-smooth cursor-grab active:cursor-grabbing py-2"
                    >
                      <div 
                        className={`flex gap-8 w-max ${
                          marqueeIsPlaying 
                            ? marqueeDirection === "left" 
                              ? "animate-marquee-cinematic hover:[animation-play-state:paused]" 
                              : "animate-marquee-cinematic-reverse hover:[animation-play-state:paused]"
                            : ""
                        }`}
                        style={{
                          "--marquee-speed": `${marqueeSpeed}s`,
                        } as React.CSSProperties}
                      >
                        {(marqueeIsPlaying ? marqueeProducts : sortedProducts).map((p, idx) => (
                          <div 
                            key={`${p.id}-marquee-${idx}`} 
                            id={`prod-card-${p.id}`}
                            className="w-[280px] sm:w-[320px] bg-white border border-[#F0EDEA] flex flex-col justify-between group overflow-hidden premium-shadow cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-[#4A5D4E]/30 shrink-0"
                            onClick={() => { setSelectedProduct(p); setModalImageIndex(0); }}
                          >
                            
                            {/* Image Area with smooth zoom-in/zoom-out transition effect */}
                            <div className="aspect-square w-full relative overflow-hidden bg-gray-100 border-b border-[#F0EDEA]">
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out absolute inset-0"
                              />
                              
                              {/* Category Badge & Out Of Stock warning */}
                              <div className="absolute top-3 left-3 z-[10] flex flex-col gap-1 items-start">
                                <span className="bg-white/90 backdrop-blur-md px-2.5 py-1 text-[8px] uppercase tracking-widest font-bold text-[#4A5D4E] border border-[#F5F2EE]">
                                  {translate(p.category)}
                                </span>
                                {p.stock < 10 && (
                                  <span className="bg-red-800 text-white px-2 py-0.5 text-[7px] uppercase tracking-[0.15em] font-bold font-sans">
                                    {translate("Only {count} Left").replace("{count}", p.stock.toString())}
                                  </span>
                                )}
                              </div>

                              {/* Overly interactive drawer action buttons */}
                              <div className="absolute bottom-4 inset-x-4 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex gap-1.5">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(p, 1);
                                  }}
                                  className="flex-1 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-[9px] uppercase tracking-widest py-2.5 transition-colors font-semibold flex items-center justify-center gap-1"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  {translate("Add to Registry")}
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProduct(p);
                                    setModalImageIndex(0);
                                  }}
                                  className="bg-white text-[#1A1A1A] border border-[#E5E2DE] py-2.5 px-3 hover:bg-[#F5F2EE]"
                                >
                                  <Info className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Metadata detail below image */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div>
                                {/* Rating stars */}
                                <div className="flex items-center gap-1 mb-1.5">
                                  <div className="flex text-amber-500">
                                    {"★".repeat(Math.round(p.rating))}
                                    {"☆".repeat(5 - Math.round(p.rating))}
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-sans">( {p.reviewCount} )</span>
                                </div>

                                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#1F1E1C] group-hover:text-[#4A5D4E] transition-colors mb-1.5">
                                  {translate(p.name)}
                                </h3>

                                <p className="text-xs text-[#666] line-clamp-2 leading-relaxed mb-4">
                                  {translate(p.description)}
                                </p>
                              </div>

                              <div className="flex justify-between items-baseline pt-4 border-t border-[#F5F2EE]">
                                <span className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-sans">
                                  {translate("Price")}
                                </span>
                                <span className="text-sm font-semibold text-[#1A1A1A]">${p.price.toFixed(2)}</span>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}


            
          </div> {/* End of max-w-[1700px] widescreen container */}
        </div>
      )}





        {/* CELEBRATION REGISTRY TAB */}
        {activeTab === "registry" && (
          <div id="registry-tab-content" className="max-w-[1700px] mx-auto px-6 sm:px-12 md:px-16 py-12 space-y-12">
            
            {/* Header Description */}
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#A68B67] font-bold">{translate("Heirloom Celebration Sheets")}</span>
              <h2 className="text-3xl md:text-5xl font-instrument font-normal text-[#4A5D4E] mt-2 mb-4">
                {translate("Exclusive Offers & Packages")}
              </h2>
              <div className="w-12 h-0.5 bg-[#A68B67] mx-auto mb-4" />
              <p className="text-xs md:text-sm text-[#666] leading-relaxed uppercase tracking-widest">
                {translate("Planning a Wedding, Milestone Birthday, Graduation, or special Engagement? Register your details, choose your premium packages, select your favorite products, and share your personalized parchment with loved ones.")}
              </p>
            </div>

            {/* CURATED CELEBRATION OFFERS & PACKAGES */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-baseline border-b border-[#E2D8C2] pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#A68B67] font-bold block">{translate("Exclusive Collections")}</span>
                  <h3 className="text-xl md:text-2xl font-instrument font-normal text-[#1C1814]">{translate("Curated Milestone Packages")}</h3>
                </div>
                <span className="text-xs text-sans text-gray-550 italic font-medium">{translate("Select a package below to instantly populate and configure your registry form")}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* WEDDING & ENGAGEMENT PACKAGE */}
                <InteractiveCard className="bg-[#FAF9F6] border border-[#E2D8C2] p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group" glowColor="74, 93, 78">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#4A5D4E]/40" />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200">{translate("💍 Weddings & Engagements")}</span>
                      <span className="font-mono text-gray-400 text-[10px]">{translate("Heirloom Suite")}</span>
                    </div>
                    <h4 className="text-lg font-serif font-bold text-[#1C1814] group-hover:text-[#4A5D4E] transition-colors">{translate("Supreme Wedding & Engagement Ceremony")}</h4>
                    <p className="text-xs text-gray-650 leading-relaxed font-sans font-medium">
                      {translate("Designed for traditional marital unions, engagement parties, and elegant milestones. Imbued with tranquility, warmth, and lifelong presence.")}
                    </p>
                    <div className="pt-2">
                      <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5">{translate("Pre-curated Items Included:")}</span>
                      <ul className="text-[11px] text-gray-600 list-inside list-disc space-y-0.5 font-sans font-medium">
                        <li>{translate("Imperial Celadon Jade Tea Ritual Set")}</li>
                        <li>{translate("Nirvana Hand-Poured Amber Soy Candle")}</li>
                        <li>{translate("Organic Acacia Wood Cheese-board Set")}</li>
                        <li>{translate("Luna Glass Orb Hanging Terrarium")}</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewRegistryOccasion("Wedding");
                      setNewRegistryName("Aesthetic Wedding & Marriage Ritual");
                      setNewRegistryNotes("We have custom-selected the classic Wedding & Engagement Ceremony curation list. Welcome to our guests!");
                      setNewRegistryItems(["organic-tea-set", "amber-soy-candle", "gourmet-cheese-board", "glass-terrarium"]);
                      triggerAlert("Preloaded the Wedding & Engagement packages list inside the form slots below!", "success");
                      const formElement = document.getElementById("registry-creator-form");
                      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-wider hover:bg-[#3d4d40] transition-colors font-bold cursor-pointer"
                  >
                    {translate("Select & Customize Package")}
                  </button>
                </InteractiveCard>

                {/* BIRTHDAY & SOLAR RETURN PACKAGE */}
                <InteractiveCard className="bg-[#FAF9F6] border border-[#E2D8C2] p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group" glowColor="166, 139, 103">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#A68B67]/40" />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-teal-800 bg-teal-50 px-2 py-0.5 border border-teal-200">{translate("🎂 Solar Cycle return")}</span>
                      <span className="font-mono text-gray-400 text-[10px]">{translate("Comfort Suite")}</span>
                    </div>
                    <h4 className="text-lg font-serif font-bold text-[#1C1814] group-hover:text-[#4A5D4E] transition-colors">{translate("Artisanal Birthday Milestone")}</h4>
                    <p className="text-xs text-gray-650 leading-relaxed font-sans font-medium">
                      {translate("Honoring milestones and quiet personal retreats with warm sensory pleasures. Curated for local home comfort, deep relaxation, and tasting notes.")}
                    </p>
                    <div className="pt-2">
                      <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5">{translate("Pre-curated Items Included:")}</span>
                      <ul className="text-[11px] text-gray-600 list-inside list-disc space-y-0.5 font-sans font-medium">
                        <li>{translate("Aura Artisanal Chocolate Truffles")}</li>
                        <li>{translate("Cloud-knit Lavender Fleece Throw")}</li>
                        <li>{translate("Imperial Jade Sandstone Fragrance Diffuser")}</li>
                        <li>{translate("Waffle-Weave Turkish Cotton Bathrobe")}</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewRegistryOccasion("Birthday Celebration");
                      setNewRegistryName("Grand Birthday Celebration Curation");
                      setNewRegistryNotes("We have pre-selected the comfort-inspired Birthday Milestone list for organic self-care. Join us!");
                      setNewRegistryItems(["gourmet-chocolates", "lavender-blanket", "essential-diffuser", "organic-robe"]);
                      triggerAlert("Preloaded the Artisanal Birthday packages list inside the form slots below!", "success");
                      const formElement = document.getElementById("registry-creator-form");
                      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-wider hover:bg-[#3d4d40] transition-colors font-bold cursor-pointer"
                  >
                    {translate("Select & Customize Package")}
                  </button>
                </InteractiveCard>

                {/* GRADUATION & SCHOLAR PACKAGE */}
                <InteractiveCard className="bg-[#FAF9F6] border border-[#E2D8C2] p-6 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group" glowColor="59, 130, 246">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-900/40" />
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-blue-800 bg-blue-50 px-2 py-0.5 border border-blue-200">{translate("🎓 Scholar Achievement")}</span>
                      <span className="font-mono text-gray-400 text-[10px]">{translate("Workspace Suite")}</span>
                    </div>
                    <h4 className="text-lg font-serif font-bold text-[#1C1814] group-hover:text-[#4A5D4E] transition-colors">{translate("Academic Graduation Package")}</h4>
                    <p className="text-xs text-gray-650 leading-relaxed font-sans font-medium">
                      {translate("An authentic tribute to educational success, creative growth, and office spaces. Tailored for writing, technical wonders, and tactile Oak keyboarding.")}
                    </p>
                    <div className="pt-2">
                      <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5">{translate("Pre-curated Items Included:")}</span>
                      <ul className="text-[11px] text-gray-600 list-inside list-disc space-y-0.5 font-sans font-medium">
                        <li>{translate("Classic Oak Wood Mechanical Keyboard")}</li>
                        <li>{translate("Emperor Tan Leather Journal Set")}</li>
                        <li>{translate("Forest Walnut Wooden Wireless Charger")}</li>
                        <li>{translate("Aura Smart Sound-Cancelling Relaxation Mask")}</li>
                        <li>{translate("Retro-Chic Instant Polaroid Camera")}</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewRegistryOccasion("Retirement Rest"); // maps directly as special Graduation category
                      setNewRegistryName("Academic Graduate Achievement Portfolio");
                      setNewRegistryNotes("We have populated our academic list with elegant retro writing logs and workspace materials for deep focus.");
                      setNewRegistryItems(["retro-keyboard", "leather-journal", "wooden-charger", "ambient-eye-mask", "instant-camera"]);
                      triggerAlert("Preloaded the Graduation Scholar packages list inside the form slots below!", "success");
                      const formElement = document.getElementById("registry-creator-form");
                      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-wider hover:bg-[#3d4d40] transition-colors font-bold cursor-pointer"
                  >
                    {translate("Select & Customize Package")}
                  </button>
                </InteractiveCard>

              </div>
            </div>

            {/* Registry Creator Panel Form */}
            <InteractiveCard 
              as="form"
              id="registry-creator-form"
              onSubmit={createRegistry} 
              className="bg-white p-6 sm:p-10 border border-[#E2D8C2] premium-shadow space-y-8 animate-fade-in scroll-mt-24"
              glowColor="74, 93, 78"
            >
                <div className="border-b border-[#F0EDEA] pb-3 mb-2 flex justify-between items-center">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-[#4A5D4E]">{translate("Traditional Package Selection")}</span>
                    <h3 className="text-xl font-instrument font-normal text-gray-900">{translate("Configure Milestone Details")}</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded">{translate("Fill Form")}</span>
                </div>

                {/* Section A: Register Name & Email details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#A68B67] border-b border-gray-100 pb-1">{translate("1. Registrant Account (Register name)")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5" htmlFor="reg-registrant-name">
                        {translate("Registrant / Full Name *")}
                      </label>
                      <input
                        id="reg-registrant-name"
                        type="text"
                        required
                        placeholder="E.g. Osama Alsofy"
                        value={newRegistryRegistrant}
                        onChange={(e) => setNewRegistryRegistrant(e.target.value)}
                        className="w-full h-11 px-3 border border-[#E5E2DE] text-xs focus:outline-none focus:border-[#4A5D4E] font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5" htmlFor="reg-registrant-email">
                        {translate("Contact Email Address *")}
                      </label>
                      <input
                        id="reg-registrant-email"
                        type="email"
                        required
                        placeholder="E.g. name@heritage.com"
                        value={newRegistryEmail}
                        onChange={(e) => setNewRegistryEmail(e.target.value)}
                        className="w-full h-11 px-3 border border-[#E5E2DE] text-xs focus:outline-none focus:border-[#4A5D4E] font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Occasion Information */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#A68B67] border-b border-gray-100 pb-1">{translate("2. Celebrative Metadata")}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5" htmlFor="reg-title">
                        {translate("Package Custom Title *")}
                      </label>
                      <input
                        id="reg-title"
                        type="text"
                        required
                        placeholder="E.g. Sarah & Mark's Grand Wedding Ceremony"
                        value={newRegistryName}
                        onChange={(e) => setNewRegistryName(e.target.value)}
                        className="w-full h-11 px-3 border border-[#E5E2DE] text-xs focus:outline-none focus:border-[#4A5D4E] font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5" htmlFor="reg-occasion">
                        {translate("Aesthetic Occasion Catagory")}
                      </label>
                      <select
                        id="reg-occasion"
                        value={newRegistryOccasion}
                        onChange={(e: any) => setNewRegistryOccasion(e.target.value)}
                        className="w-full h-11 px-2 border border-[#E5E2DE] text-xs focus:outline-none focus:border-[#4A5D4E] font-medium"
                      >
                        <option value="Wedding">{translate("Wedding Event")}</option>
                        <option value="Anniversary">{translate("Anniversary celebration")}</option>
                        <option value="Engagement Ceremony">{translate("Special Engagement Gather")}</option>
                        <option value="Birthday Celebration">{translate("Birthday celebration milestone")}</option>
                        <option value="Retirement Rest">{translate("Graduation achievement study")}</option>
                        <option value="Housewarming">{translate("New Housewarming ceremony")}</option>
                        <option value="General Gathering">{translate("General Community ceremony")}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5" htmlFor="reg-date">
                        {translate("Celebration Date *")}
                      </label>
                      <input
                        id="reg-date"
                        type="date"
                        required
                        value={newRegistryDate}
                        onChange={(e) => setNewRegistryDate(e.target.value)}
                        className="w-full h-11 px-3 border border-[#E5E2DE] text-xs focus:outline-none focus:border-[#4A5D4E] font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Guest Notes */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block mb-1.5" htmlFor="reg-desc">
                    {translate("Greetings parchment notes for loved guests")}
                  </label>
                  <textarea
                    id="reg-desc"
                    placeholder={translate("Provide a heartwarming sentence introducing your celebration wishlist records...")}
                    value={newRegistryNotes}
                    onChange={(e) => setNewRegistryNotes(e.target.value)}
                    className="w-full p-3 border border-[#E5E2DE] text-xs h-20 resize-none focus:outline-none focus:border-[#4A5D4E] font-sans font-medium"
                  />
                </div>

                {/* Section D: Each one of those categories, LIST OF THINGS you can choose from it */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150 pb-1.5 gap-2">
                    <h4 className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#A68B67]">
                      {translate("3. Category specific choices list")}
                    </h4>
                    <span className="text-[10px] text-[#4A5D4E] font-bold uppercase tracking-wider bg-[#4A5D4E]/5 px-2.5 py-0.5 border border-[#4A5D4E]/20">
                      {translate("Currently Selected:")} {newRegistryItems.length} {translate("curated goods")}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 font-sans block leading-normal italic">
                    {translate("Below is the recommended, artisanal choice array matching your selected occasion category. Click item layout cards to check/uncheck your desired selection.")}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {(() => {
                      // Dynamically render list representing only that category for highly optimized selection
                      let categoryGoodsIds: string[] = [];
                      if (newRegistryOccasion === "Wedding" || newRegistryOccasion === "Engagement Ceremony") {
                        categoryGoodsIds = ["organic-tea-set", "amber-soy-candle", "gourmet-cheese-board", "glass-terrarium"];
                      } else if (newRegistryOccasion === "Birthday Celebration") {
                        categoryGoodsIds = ["gourmet-chocolates", "lavender-blanket", "essential-diffuser", "organic-robe"];
                      } else if (newRegistryOccasion === "Retirement Rest") { // maps graduation
                        categoryGoodsIds = ["retro-keyboard", "leather-journal", "wooden-charger", "ambient-eye-mask", "instant-camera"];
                      } else {
                        // All general items
                        categoryGoodsIds = CATALOG.map(p => p.id);
                      }

                      // Filter products
                      const currentSelectionProducts = CATALOG.filter(p => categoryGoodsIds.includes(p.id));

                      return currentSelectionProducts.map(prod => {
                        const isChecked = newRegistryItems.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => toggleProductForNewRegistry(prod.id)}
                            className={`p-3.5 border flex gap-3 items-center cursor-pointer select-none transition-all duration-300 relative ${
                              isChecked ? "bg-[#4A5D4E]/5 border-[#4A5D4E]" : "bg-[#FAFDFB] border-[#E2D8C2] opacity-80 hover:opacity-100 hover:bg-[#FAF9F6]"
                            }`}
                          >
                            <div className={`w-4 h-4 border-2 flex items-center justify-center shrink-0 rounded-sm transition-all ${
                              isChecked ? "bg-[#4A5D4E] border-[#4A5D4E]" : "border-[#A68B67]"
                            }`}>
                              {isChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                            </div>

                            <img src={prod.image} alt={prod.name} referrerPolicy="no-referrer" className="w-10 h-12 object-cover shrink-0 select-none bg-gray-150 rounded-sm" />

                            <div className="min-w-0 flex-1">
                              <h5 className="text-[11px] font-bold text-[#1C1814] truncate uppercase tracking-widest">{translate(prod.name)}</h5>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-[11px] font-bold text-[#A68B67] font-mono">${prod.price.toFixed(2)}</span>
                                <span className="text-[9px] text-gray-400">{translate("Class: " + prod.category)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#E2D8C2]/60 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-medium">{translate("Looking to browse outside of this selected package? Toggle additional catalog items into your wishlist:")}</span>
                    <button
                      type="button"
                      onClick={() => {
                        // Merge all items or allow toggle
                        triggerAlert("All general items unlocked. Check additional options across the full list!", "info");
                        setNewRegistryOccasion("General Gathering"); // unlocks everything
                      }}
                      className="px-4 py-1.5 bg-white border border-[#E5E2DE] text-[#4A5D4E] hover:bg-gray-100 hover:border-[#4A5D4E] text-[9px] uppercase tracking-widest font-bold self-start transition-colors cursor-pointer block"
                    >
                      {translate("Show Full Catalog List")}
                    </button>
                  </div>
                </div>

                {/* Submit button bar */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#F0EDEA]">
                  <button
                    type="button"
                    onClick={() => {
                      setNewRegistryName("");
                      setNewRegistryDate("");
                      setNewRegistryNotes("");
                      setNewRegistryRegistrant("");
                      setNewRegistryEmail("");
                      setNewRegistryItems([]);
                      triggerAlert("Cleared all builder form selections", "info");
                    }}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] uppercase tracking-widest font-bold transition-colors cursor-pointer"
                  >
                    {translate("Cancel / Clear Selected")}
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#3d4d40] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{translate("Subscribe to Curated Package")}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </InteractiveCard>

            {/* List Active Registries */}
            <div className="space-y-8">
              <div className="border-b border-[#E2D8C2] pb-2">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A68B67] font-bold block">{translate("Current active Registrant books")}</span>
                <h3 className="text-xl font-instrument font-normal text-[#1C1814]">{translate("Active Subscribed Packages & Offers")} ({registries.length})</h3>
              </div>
              
              {registries.map(reg => {
                const totalRequested = reg.items.reduce((s, i) => s + i.quantityRequested, 0);
                const totalReceived = reg.items.reduce((s, i) => s + i.quantityReceived, 0);
                const pct = totalRequested > 0 ? Math.round((totalReceived / totalRequested) * 100) : 0;

                return (
                  <InteractiveCard key={reg.id} className="bg-white border border-[#E2D8C2] p-6 md:p-8 premium-shadow space-y-6" glowColor="74, 93, 78">
                    
                    {/* Header info */}
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-[#F0EDEA]">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="bg-[#4A5D4E]/10 text-[#4A5D4E] px-2.5 py-0.5 text-[8px] uppercase tracking-widest font-bold border border-[#4A5D4E]/20">
                            {translate(reg.occasion === "RetirementRest" || reg.occasion === "Retirement Rest" ? "Graduation" : reg.occasion)}
                          </span>
                          <span className="text-xs text-[#666] font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {translate("Celebration Date:")} {reg.date}
                          </span>
                        </div>
                        <h3 className="text-xl font-serif text-[#1C1814] font-semibold italic">{reg.name}</h3>
                        
                        {/* Display custom registrant name */}
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-gray-750 font-medium">
                            {translate("Registered by:")} <span className="font-bold text-[#4A5D4E]">{reg.registrantName || translate("Honored Registrant")}</span> 
                            {reg.email && <span className="text-gray-400 italic ml-1.5">({reg.email})</span>}
                          </p>
                          {reg.notes && <p className="text-xs text-gray-500 italic mt-1 font-sans font-medium bg-[#FAF9F6] p-2 border-l-2 border-[#A68B67]">"{reg.notes}"</p>}
                        </div>
                      </div>

                      {/* Overall Progress Tracker */}
                      <div className="w-full md:w-64 bg-[#FAF9F6] p-4 border border-[#E2D8C2] text-center space-y-1 shrink-0">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#666] font-bold">
                          <span>{translate("Progress Meter")}</span>
                          <span>{pct}% {translate("Fulfilled")}</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#4A5D4E] h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>

                        <span className="text-[9px] text-gray-400 capitalize inline-block font-medium">
                          {totalReceived} {translate("of")} {totalRequested} {translate("premium presets claimed by loved guests")}
                        </span>
                      </div>
                    </div>

                    {/* Registry Sub Items Grid */}
                    <div>
                      <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4 block">{translate("Wishlisted Goods Selection List")}</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {reg.items.map(rItem => {
                          const product = CATALOG.find(p => p.id === rItem.productId);
                          if (!product) return null;
                          const isFulfilled = rItem.quantityReceived >= rItem.quantityRequested;

                          return (
                            <div key={product.id} className="border border-[#F0EDEA] p-3 flex flex-col justify-between bg-[#FDFCFB] text-xs">
                              
                              <div className="flex gap-2 items-center mb-2.5">
                                <img src={product.image} alt={product.name} referrerPolicy="no-referrer" className="w-10 h-12 object-cover rounded-sm" />
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-semibold text-[11px] truncate uppercase">{translate(product.name)}</h5>
                                  <span className="text-[#A68B67]">${product.price.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="space-y-3 pt-3 border-t border-[#F5F2EE]">
                                <div className="flex justify-between text-[10px] text-gray-500 font-semibold uppercase">
                                  <span>{translate("Gifting State:")}</span>
                                  <span>{rItem.quantityReceived} {translate("of")} {rItem.quantityRequested}</span>
                                </div>

                                {isFulfilled ? (
                                  <div className="w-full py-1.5 bg-[#4A5D4E]/10 border border-[#4A5D4E]/20 text-[#4A5D4E] text-center text-[9px] uppercase tracking-wider font-bold">
                                    ✓ {translate("Fully Claimed & Gifted")}
                                  </div>
                                ) : (
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => contributeToRegistryItem(reg.id, product.id)}
                                      className="flex-1 py-2 bg-[#FAF9F6] border border-[#E2D8C2] hover:bg-[#EAE7E2] text-[9px] uppercase tracking-widest text-[#1A1A1A] font-bold cursor-pointer transition-colors"
                                    >
                                      {translate("Claim Presets")}
                                    </button>
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Registry Actions footer */}
                    <div className="flex justify-between items-center text-[10px] tracking-widest text-gray-400 capitalize">
                      <span>{translate("Unique sheet block:")} reg-{reg.id}</span>
                      <button 
                        onClick={async () => {
                          let origin = "https://presentperfect.co";
                          try {
                            if (typeof window !== "undefined" && window.location && window.location.origin) {
                              origin = window.location.origin;
                            }
                          } catch (err) {
                            // ignore sandbox restriction
                          }
                          const dummyUrl = `${origin}/registry-preview?id=${reg.id}`;
                          const ok = await copyToClipboard(dummyUrl);
                          if (ok) {
                            triggerAlert("Sharable guest list portfolio link copied to clipboard!", "success");
                          } else {
                            triggerAlert("Unlocking url copied to clipboard blocked. Links: " + dummyUrl, "info");
                          }
                        }}
                        className="text-[#4A5D4E] font-bold hover:underline flex items-center gap-1 cursor-pointer uppercase"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#A68B67]" />
                        {translate("Share Sheet Portfolio")}
                      </button>
                    </div>

                  </InteractiveCard>
                );
              })}
            </div>

          </div>
        )}

        {/* CURATION JOURNAL TAB */}
        {/* CURATION GIFT MIXER TAB */}
        {activeTab === "journal" && (
          <div id="journal-tab-content" className="relative max-w-[1400px] mx-auto px-4 sm:px-8 md:px-12 py-10 space-y-12 animate-fade-in text-[#1C1814] overflow-hidden">
            
            {/* Ambient Lottie Animation Background - exquisitely positioned to fit with background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[650px] h-[350px] z-0 opacity-60 pointer-events-none select-none mix-blend-multiply flex items-center justify-center">
              {/* @ts-ignore */}
              <dotlottie-wc 
                src="https://lottie.host/499697cc-a2ee-4eaf-a86f-5f017ad7ae6d/p7VJAaDNRc.lottie" 
                style={{ width: "350px", height: "350px", display: "block" }} 
                autoplay 
                loop
              />
            </div>
            
            {/* Header info */}
            <div className="text-center max-w-3xl mx-auto space-y-3 relative z-10">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#A68B67] font-extrabold flex items-center justify-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-[#A68B67] rotate-45"></span>
                {translate("Custom Gift Tray")}
                <span className="inline-block w-1.5 h-1.5 bg-[#A68B67] rotate-45"></span>
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-black text-[#4A5D4E] mt-2 mb-4 leading-tight">
                {translate("The Gift Mixer")}
              </h2>
              <div className="w-16 h-0.5 bg-[#A68B67] mx-auto mb-4" />
              <p className="text-xs sm:text-sm text-[#5C564E] leading-relaxed max-w-2xl mx-auto font-medium uppercase tracking-wider">
                {translate("Mix and match items to build your custom gift tray. Choose your favorite wrapping style, ribbons, and decorative accents to make it truly personal.")}
              </p>
            </div>

            {/* Quick Preset Buttons */}
            <div className="bg-[#FAF7F1] border border-[#E2D8C2] p-5 rounded-lg">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#A68B67] font-bold mb-3 text-center sm:text-left">
                {translate("Or Start With A Curated Creative Theme:")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    name: "🌸 Classical Romance Symphony",
                    desc: "Fresh Coral Peonies, Velvet Roses, & Dark Truffles",
                    items: [
                      { id: "fl-peonies", name: "Fresh Coral Peonies", price: 18.00, icon: "🌸" },
                      { id: "fl-roses", name: "Velvet Crimson Roses", price: 22.00, icon: "🌹" },
                      { id: "ts-truffles", name: "Artisanal Dark Truffles", price: 24.00, icon: "🍫" }
                    ],
                    wrap: "Matte Emerald Silk Fabric Wrap",
                    tie: "Emerald Silk Velvet Ribbon",
                    accent: "Pressed Fresh Pine Sprig"
                  },
                  {
                    name: "🧘 Mindful Healing Sanctuary",
                    desc: "Preserved Lavender, Soy Candle, & Bath Salts",
                    items: [
                      { id: "fl-lavender", name: "Preserved French Lavender", price: 14.00, icon: "🌾" },
                      { id: "cm-candle", name: "Amber Soy Wood-Wick Candle", price: 24.50, icon: "🕯️" },
                      { id: "cm-salts", name: "Mineral Healing Bath Salts", price: 21.00, icon: "🛁" }
                    ],
                    wrap: "Natural Unbleached Japanese Bark Paper",
                    tie: "Rustic Organic Jute Twine",
                    accent: "Dried Organic Lavender Sprigs"
                  },
                  {
                    name: "📱 Modern Elegance & Tech Suite",
                    desc: "Premium iPhone, Espresso Beans, & Hand-Bound Journal",
                    items: [
                      { id: "ts-espresso", name: "Single-Origin Espresso", price: 19.50, icon: "☕" },
                      { id: "cm-journal", name: "Hand-Bound Cotton Journal", price: 30.00, icon: "✍️" },
                      { id: "diy-iphone", name: "Apple iPhone 15 Pro", price: 999.00, icon: "📱" }
                    ],
                    wrap: "Laquered Midnight Indigo Muslin",
                    tie: "Wax-Sealed Leather Cord",
                    accent: "Gilded Ginkgo Biloba Leaf"
                  }
                ].map((combo, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMixerItems(combo.items.map(it => ({ ...it, quantity: 1 })));
                      setMixerWrapStyle(combo.wrap);
                      setMixerTieStyle(combo.tie);
                      setMixerAccent(combo.accent);
                      setMixerResponse(null);
                      triggerAlert(translate("Loaded preset: {name}").replace("{name}", translate(combo.name)), "success");
                    }}
                    className="p-3.5 bg-white border border-[#EBE7E0] hover:border-[#4A5D4E] hover:shadow-md rounded text-left transition-all group cursor-pointer"
                  >
                    <p className="font-serif font-bold text-xs text-[#4A5D4E] group-hover:text-[#3d4d40]">{translate(combo.name)}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-sans">{translate(combo.desc)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
                {/* Left Side: The Curation Basin / Virtual Tray */}
              <div className="lg:col-span-5 space-y-6">
                
                <InteractiveCard glowColor="166, 139, 103" className="relative bg-[#FAF6EE] rounded-2xl border border-[#E2D8C2] shadow-2xl overflow-hidden mb-6 p-2.5">
                  
                  {/* Background fine wood grain or paper texture overlay representation */}
                  <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay bg-black" 
                       style={{ backgroundImage: "radial-gradient(circle, #000 10%, transparent 10.5%)", backgroundSize: "10px 10px" }} />

                  {/* Tray Label */}
                  <div className="flex justify-between items-center border-b border-[#E3D8C4] pb-4 mb-6">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-extrabold block">{translate("Boutique Tray No. 1779")}</span>
                      <h4 className="font-serif font-bold text-sm text-[#4A5D4E]">{translate("Sustainably Sourced Cedarwood Basin")}</h4>
                    </div>
                    <button
                      onClick={() => {
                        setMixerItems([]);
                        setMixerResponse(null);
                        triggerAlert(translate("Curation tray cleared."), "info");
                      }}
                      className="text-[9px] uppercase tracking-widest text-red-700 hover:underline font-bold"
                    >
                      {translate("Clear Tray")}
                    </button>
                  </div>

                  {/* Tray Active Content */}
                  <div className="space-y-4 min-h-[220px] max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                    {mixerItems.length === 0 ? (
                      <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-[#E3D8C4] rounded-lg space-y-2">
                        <span className="text-4xl">📥</span>
                        <p className="font-serif text-xs text-[#8E7E62] font-semibold">{translate("Your unbleached tray is empty")}</p>
                        <p className="text-[10px] text-gray-500 max-w-xs font-sans">
                          {translate("Select fine objects from the apothecary drawers or type a custom item below to place it in this tray.")}
                        </p>
                      </div>
                    ) : (
                      mixerItems.map((item, idx) => (
                        <motion.div
                          key={item.id + "-" + idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3.5 bg-white border border-[#E3D8C4] rounded shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl select-none" role="img" aria-label={item.name}>{item.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-snug">{translate(item.name)}</p>
                              <p className="text-[10px] text-[#A68B67] font-medium font-mono">${item.price.toFixed(2)} {translate("each")}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5">
                            {/* Quantity Controllers */}
                            <div className="flex items-center border border-[#E3D8C4] rounded bg-[#FAF7F1]">
                              <button
                                onClick={() => {
                                  setMixerItems(prev => prev.map(it => it.id === item.id ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
                                  setMixerResponse(null);
                                }}
                                className="px-2 py-1 text-gray-500 hover:bg-[#E3D8C4] transition-colors text-xs"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-gray-800 font-mono select-none">{item.quantity}</span>
                              <button
                                onClick={() => {
                                  setMixerItems(prev => prev.map(it => it.id === item.id ? { ...it, quantity: it.quantity + 1 } : it));
                                  setMixerResponse(null);
                                }}
                                className="px-2 py-1 text-gray-500 hover:bg-[#E3D8C4] transition-colors text-xs"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Trash Button */}
                            <button
                              onClick={() => {
                                setMixerItems(prev => prev.filter(it => it.id !== item.id));
                                setMixerResponse(null);
                                triggerAlert(translate("Removed {item} from tray.").replace("{item}", translate(item.name)), "info");
                              }}
                              className="text-red-700 hover:text-red-900 hover:bg-red-50 p-1.5 rounded transition-colors"
                              title={translate("Remove item")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}

                    {/* Linked Calligraphy Greeting Card Active State inside Tray */}
                    {mixerItems.length > 0 && mixerIncludeCard && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3.5 bg-yellow-50/55 border border-[#D5CBB8] rounded shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        
                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-2xl select-none" role="img" aria-label="Greeting Card">✍️</span>
                          <div>
                            <p className="text-xs font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                              {translate("Calligraphy Greeting Card")}
                              <span className="bg-amber-100 text-amber-800 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black font-sans">{translate("Scribed")}</span>
                            </p>
                            <p className="text-[10px] text-[#A68B67] font-medium font-serif max-w-[200px] truncate">
                              "{mixerGreetingText || translate("Warmest wishes...")}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10">
                          <span className="text-[10px] font-bold text-gray-800 font-mono bg-[#FAF7F1] px-2 py-0.5 border border-[#E3D8C4] rounded">$5.00</span>
                          
                          <button
                            onClick={() => {
                              setMixerIncludeCard(false);
                              setMixerResponse(null);
                              triggerAlert(translate("Greeting card removed from tray curation."), "info");
                            }}
                            className="text-red-700 hover:text-red-900 hover:bg-red-50 p-1.5 rounded transition-colors"
                            title={translate("Remove card from tray")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Linked Calligraphy Greeting Card Inactive Action Holder inside Tray */}
                    {mixerItems.length > 0 && !mixerIncludeCard && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        type="button"
                        onClick={() => {
                          setMixerIncludeCard(true);
                          setMixerResponse(null);
                          triggerAlert(translate("Calligraphy Greeting Card added to your tray curation!"), "success");
                        }}
                        className="w-full p-3.5 border-2 border-dashed border-[#E3D8C4] rounded text-center text-[11px] text-gray-400 hover:text-[#4A5D4E] hover:border-[#4A5D4E] hover:bg-[#4A5D4E]/5 transition-all flex items-center justify-center gap-2 font-medium"
                      >
                        <span>➕ {translate("Add Calligraphy Greeting Card")}</span>
                        <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 border border-amber-200/50 rounded">+$5.00</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Active Packaging Highlights */}
                  {mixerItems.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-[#E3D8C4] space-y-2.5 text-[11px] text-[#5C564E] bg-white/40 p-4 rounded-lg border border-[#E3D8C4]/60">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">{translate("Wrapping Artistry:")}</span>
                        <span className="font-bold text-gray-800">{translate(mixerWrapStyle)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">{translate("Tie Ceremony:")}</span>
                        <span className="font-bold text-gray-800">{translate(mixerTieStyle)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400">{translate("Decorative Sprig:")}</span>
                        <span className="font-bold text-[#4A5D4E]">{translate(mixerAccent)}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Tray Pricing Ledger */}
                  <div className="mt-6 border-t-2 border-double border-[#E3D8C4] pt-4 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>{translate("Cedarwood Tray Base + Wrapping Fee")}</span>
                      <span>$20.00</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>{translate("Custom Tray Selections ({count} units)").replace("{count}", mixerItems.reduce((acc, it) => acc + it.quantity, 0).toString())}</span>
                      <span>${mixerItems.reduce((acc, it) => acc + (it.price * it.quantity), 0).toFixed(2)}</span>
                    </div>
                    {mixerIncludeCard && (
                      <div className="flex justify-between text-gray-500 text-[11px] animate-fade-in">
                        <span>{translate("Handwritten Calligraphy Card")}</span>
                        <span>$5.00</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-900 font-bold text-sm border-t border-[#E3D8C4]/60 pt-2">
                      <span className="font-serif font-semibold">{translate("Estimated Total Price:")}</span>
                      <span>${(mixerItems.reduce((acc, it) => acc + (it.price * it.quantity), 0) + 20.00 + (mixerIncludeCard ? 5.00 : 0)).toFixed(2)}</span>
                    </div>
                    <p className="text-[9px] text-[#A68B67] uppercase tracking-wider text-right font-bold mt-1">
                      {translate("Estimated assembly time: 1.5 Hours")}
                    </p>
                  </div>

                </InteractiveCard>

                {/* Add to Styling Bag Direct Action */}
                {mixerItems.length > 0 && (
                  <button
                    onClick={openCurationCeremony}
                    className="w-full py-4 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-xs uppercase tracking-[0.25em] font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {translate("Place Completed Mix in My Bag")}
                  </button>
                )}

              </div>

              {/* Right Side: Selections Apothecary & Custom Input */}
              <div className="lg:col-span-7 space-y-8">
                
                {/* Section 1: Curated Apothecary Drawer */}
                <InteractiveCard glowColor="74, 93, 78" className="bg-white border border-[#E2D8C2] p-6 sm:p-8 space-y-6 premium-shadow">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F0EDEA] pb-4 gap-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-extrabold block">{translate("Atelier Ingredient Drawers")}</span>
                      <h3 className="font-serif font-semibold text-xl text-[#1A1A1A]">{translate("Curated Apothecary Ingredients")}</h3>
                    </div>
                    {/* Tiny category toggles */}
                    <div className="flex gap-2 text-[10px] uppercase tracking-wider font-extrabold border-b border-[#F0EDEA] sm:border-none pb-2 sm:pb-0 overflow-x-auto">
                      {[
                        { key: "flora", label: translate("Botanicals") },
                        { key: "taste", label: translate("Decadence") },
                        { key: "comfort", label: translate("Comforts") }
                      ].map(drawer => (
                        <button
                          key={drawer.key}
                          onClick={() => setHobbySearchQuery(drawer.key)}
                          className={`px-3 py-1.5 border transition-all cursor-pointer ${
                            (hobbySearchQuery || "flora") === drawer.key
                              ? "bg-[#4A5D4E] border-[#4A5D4E] text-white"
                              : "bg-white border-[#EBE7E0] text-gray-500 hover:border-gray-400"
                          }`}
                        >
                          {drawer.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Drawer Content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      // Flora category
                      { id: "fl-peonies", name: "Fresh Coral Peonies", price: 18.00, icon: "🌸", category: "flora" },
                      { id: "fl-eucalyptus", name: "Scented Eucalyptus Bundle", price: 12.00, icon: "🌿", category: "flora" },
                      { id: "fl-roses", name: "Velvet Crimson Roses", price: 22.00, icon: "🌹", category: "flora" },
                      { id: "fl-lavender", name: "Preserved French Lavender", price: 14.00, icon: "🌾", category: "flora" },
                      { id: "fl-sunflowers", name: "Warm Arles Sunflowers", price: 15.00, icon: "🌻", category: "flora" },

                      // Taste category
                      { id: "ts-truffles", name: "Artisanal Dark Truffles", price: 24.00, icon: "🍫", category: "taste" },
                      { id: "ts-espresso", name: "Single-Origin Espresso", price: 19.50, icon: "☕", category: "taste" },
                      { id: "ts-matcha", name: "Ceremonial Kyoto Matcha", price: 32.00, icon: "🍵", category: "taste" },
                      { id: "ts-honey", name: "Raw Orange-Blossom Honey", price: 16.00, icon: "🍯", category: "taste" },
                      { id: "ts-oranges", name: "Candied Organic Citrus Rinds", price: 14.50, icon: "🍊", category: "taste" },

                      // Comfort category
                      { id: "cm-candle", name: "Amber Soy Wood-Wick Candle", price: 24.50, icon: "🕯️", category: "comfort" },
                      { id: "cm-film", name: "Retro Instant Film Roll", price: 15.00, icon: "📷", category: "comfort" },
                      { id: "cm-journal", name: "Hand-Bound Cotton Journal", price: 30.00, icon: "✍️", category: "comfort" },
                      { id: "cm-salts", name: "Mineral Healing Bath Salts", price: 21.00, icon: "🛁", category: "comfort" },
                      { id: "cm-coasters", name: "Raw Walnut Wood Coasters", price: 18.00, icon: "🪵", category: "comfort" }
                    ]
                      .filter(it => it.category === (hobbySearchQuery || "flora"))
                      .map((item) => {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setMixerItems(prev => {
                                const exist = prev.find(mi => mi.id === item.id);
                                if (exist) {
                                  return prev.map(mi => mi.id === item.id ? { ...mi, quantity: mi.quantity + 1 } : mi);
                                }
                                  return [...prev, { ...item, quantity: 1 }];
                              });
                              setMixerResponse(null);
                              triggerAlert(translate("Placed {item} onto tray!").replace("{item}", translate(item.name)), "success");
                            }}
                            className="flex items-center justify-between p-3.5 bg-[#FAF9F6] border border-[#EBE7E0] hover:border-[#A68B67] hover:bg-[#FDFDFB] rounded text-left transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl group-hover:scale-110 transition-transform select-none">{item.icon}</span>
                              <div>
                                <p className="text-xs font-bold text-[#1A1A1A] group-hover:text-[#4A5D4E] transition-colors leading-tight">
                                  {translate(item.name)}
                                </p>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">${item.price.toFixed(2)}</p>
                              </div>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-[#4A5D4E] font-black group-hover:underline">
                              {translate("+ Add")}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                </InteractiveCard>

                {/* Section 2: Bespoke Customer-Entered Custom Item Creator */}
                <InteractiveCard glowColor="166, 139, 103" className="bg-[#FAF7F1] border border-[#E2D8C2] p-6 sm:p-8 space-y-6 rounded-lg relative overflow-hidden">
                  
                     <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-extrabold block">{translate("Literal Custom Request")}</span>
                    <h3 className="font-serif font-semibold text-xl text-[#4A5D4E]">{translate("Place Custom Item / Request")}</h3>
                    <p className="text-[11px] text-gray-600 mt-1 font-medium font-sans">
                      {translate("Have a specific physical request (e.g., an iPhone, specific brand chocolates, custom jewelry, or books)? Describe it literally below and we will source and wrap it!")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Input name */}
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block">{translate("Item Specification / Name:")}</label>
                      <input
                        type="text"
                        value={mixerCustomName}
                        onChange={(e) => setMixerCustomName(e.target.value)}
                        placeholder={translate("E.g., Apple iPhone 15 Pro, Scented Hand Cream, White Lilies")}
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E3D8C4] rounded focus:outline-none focus:border-[#4A5D4E] font-medium"
                      />
                    </div>

                    {/* Price and Emoji Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block">{translate("Est. Value (For Ledger):")}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-mono font-bold">$</span>
                        <input
                          type="number"
                          value={mixerCustomPrice}
                          onChange={(e) => setMixerCustomPrice(Math.max(1, Number(e.target.value)))}
                          placeholder="35"
                          className="w-full pl-6 pr-3.5 py-2 text-xs bg-white border border-[#E3D8C4] rounded focus:outline-none focus:border-[#4A5D4E] font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-gray-500 block">{translate("Aesthetic Symbol Icon:")}</label>
                      <div className="flex gap-1 overflow-x-auto py-1 border border-[#E3D8C4] bg-white rounded px-2 scrollbar-none">
                        {["📱", "🍫", "🌸", "🧸", "🍷", "💍", "🎁", "🕯️", "📖", "📷", "🥐", "💐"].map((emo) => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => setMixerCustomIcon(emo)}
                            className={`p-1.5 text-base rounded hover:bg-gray-100 transition-colors ${
                              mixerCustomIcon === emo ? "bg-[#FAF1E3] border border-[#A68B67]" : "border border-transparent"
                            }`}
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!mixerCustomName.trim()) {
                        triggerAlert(translate("Please specify the custom item's name."), "info");
                        return;
                      }
                      const newItem = {
                        id: "diy-" + Date.now(),
                        name: mixerCustomName.trim(),
                        price: mixerCustomPrice || 35.00,
                        icon: mixerCustomIcon,
                        quantity: 1
                      };
                      setMixerItems(prev => [...prev, newItem]);
                      setMixerCustomName("");
                      setMixerResponse(null);
                      triggerAlert(translate("Placed custom request \"{name}\" on the tray!").replace("{name}", newItem.name), "success");
                    }}
                    className="w-full py-3 border-2 border-[#4A5D4E] bg-white hover:bg-[#4A5D4E] hover:text-white text-[#4A5D4E] text-[10px] uppercase tracking-widest font-bold transition-all"
                  >
                    {translate("Place Custom Selections on Tray")}
                  </button>

                </InteractiveCard>

                {/* Section 3: Wrapping and Letter Calligraphy Card */}
                <InteractiveCard glowColor="74, 93, 78" className="bg-white border border-[#E2D8C2] p-6 sm:p-8 space-y-6 premium-shadow">
                  
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-extrabold block">{translate("Occasion Presentation Ritual")}</span>
                    <h3 className="font-serif font-semibold italic text-xl text-[#1A1A1A]">{translate("Aesthetic Wrapping Ceremony")}</h3>
                    <p className="text-[11px] text-gray-500 mt-1 font-sans">
                      {translate("Select wrapping textiles, ties, and fresh botanical accents curated to establish deep physiological joy.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Wrap selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">{translate("Wrap Textile:")}</label>
                      <select
                        value={mixerWrapStyle}
                        onChange={(e) => { setMixerWrapStyle(e.target.value); setMixerResponse(null); }}
                        className="w-full px-2.5 py-2 text-xs border border-[#EBE7E0] bg-[#FAF9F6] text-[#1C1814] font-medium rounded focus:outline-none"
                      >
                        <option value="Matte Emerald Silk Fabric Wrap">{translate("Matte Emerald Silk Fabric Wrap")}</option>
                        <option value="Natural Unbleached Japanese Bark Paper">{translate("Natural Unbleached Japanese Bark Paper")}</option>
                        <option value="Laquered Midnight Indigo Muslin">{translate("Laquered Midnight Indigo Muslin")}</option>
                        <option value="Raw Textured Hemp Fibres">{translate("Raw Textured Hemp Fibres")}</option>
                      </select>
                    </div>

                    {/* Tie selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">{translate("Tie Ribbon:")}</label>
                      <select
                        value={mixerTieStyle}
                        onChange={(e) => { setMixerTieStyle(e.target.value); setMixerResponse(null); }}
                        className="w-full px-2.5 py-2 text-xs border border-[#EBE7E0] bg-[#FAF9F6] text-[#1C1814] font-medium rounded focus:outline-none"
                      >
                        <option value="Emerald Silk Velvet Ribbon">{translate("Emerald Silk Velvet Ribbon")}</option>
                        <option value="Rustic Organic Jute Twine">{translate("Rustic Organic Jute Twine")}</option>
                        <option value="Wax-Sealed Leather Cord">{translate("Wax-Sealed Leather Cord")}</option>
                        <option value="Braided Vermillion Silk Cord">{translate("Braided Vermillion Silk Cord")}</option>
                      </select>
                    </div>

                    {/* Accent selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">{translate("Floral Accent:")}</label>
                      <select
                        value={mixerAccent}
                        onChange={(e) => { setMixerAccent(e.target.value); setMixerResponse(null); }}
                        className="w-full px-2.5 py-2 text-xs border border-[#EBE7E0] bg-[#FAF9F6] text-[#1C1814] font-medium rounded focus:outline-none"
                      >
                        <option value="Pressed Fresh Pine Sprig">{translate("Pressed Fresh Pine Sprig")}</option>
                        <option value="Dried Organic Lavender Sprigs">{translate("Dried Organic Lavender Sprigs")}</option>
                        <option value="Gilded Ginkgo Biloba Leaf">{translate("Gilded Ginkgo Biloba Leaf")}</option>
                        <option value="Fresh Eucalyptus Leaves">{translate("Fresh Eucalyptus Leaves")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Greeting Text Card with dynamic Link toggle */}
                  <div className="space-y-4 pt-4 border-t border-[#FAF6EE]">
                    
                    <div className="flex items-center justify-between p-4 bg-[#FAF9F6] border border-[#E3D8C4] rounded-lg shadow-sm">
                      <div className="flex items-center gap-3">
                        <input
                          id="toggle-calligraphy-card"
                          type="checkbox"
                          checked={mixerIncludeCard}
                          onChange={(e) => {
                            setMixerIncludeCard(e.target.checked);
                            setMixerResponse(null);
                            if (e.target.checked) {
                              triggerAlert(translate("Calligraphy Greeting Card added to curation!"), "success");
                            } else {
                              triggerAlert(translate("Greeting card removed from curation."), "info");
                            }
                          }}
                          className="w-4 h-4 text-[#4A5D4E] focus:ring-[#4A5D4E] border-gray-300 rounded cursor-pointer accent-[#4A5D4E]"
                        />
                        <label htmlFor="toggle-calligraphy-card" className="cursor-pointer select-none">
                          <span className="text-xs font-bold text-gray-900 block">{translate("Include Handwritten Calligraphy Card")}</span>
                          <span className="text-[10px] text-gray-500">{translate("Premium unbleached deckled card scribed in golden iron-gall ink")}</span>
                        </label>
                      </div>
                      <span className="bg-[#4A5D4E]/10 text-[#4A5D4E] font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full select-none">
                        +$5.00
                      </span>
                    </div>

                    <div className="space-y-2 relative">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-gray-400 block">
                          {translate("Greeting Card Message (Calligraphy):")}
                        </label>
                        <span className="text-[9px] font-mono text-gray-400">
                          {mixerIncludeCard ? translate("Parchment Card included") : translate("Card excluded")}
                        </span>
                      </div>
                      
                      <div className="relative">
                        <textarea
                          value={mixerGreetingText}
                          onChange={(e) => { setMixerGreetingText(e.target.value); setMixerResponse(null); }}
                          disabled={!mixerIncludeCard}
                          placeholder={mixerIncludeCard ? translate("Write your bespoke message here... Our in-house scribe will write this in elegant custom calligraphy.") : translate("Enable 'Include Calligraphy Greeting Card' above to write a custom message.")}
                          rows={3}
                          className={`w-full p-4 text-xs rounded border-2 transition-all font-medium italic leading-relaxed shadow-inner ${
                            mixerIncludeCard 
                              ? "bg-[#FCFBF7] border-dashed border-[#C5BCAE] text-gray-800 placeholder:italic focus:outline-none focus:border-[#4A5D4E]" 
                              : "bg-[#F3EFE7]/50 border-[#E2D8C2]/60 text-gray-400 placeholder:text-gray-400/70 cursor-not-allowed select-none"
                          }`}
                        />
                        
                        {!mixerIncludeCard && (
                          <div className="absolute inset-0 flex items-center justify-center bg-transparent backdrop-none">
                            <button
                              type="button"
                              onClick={() => {
                                setMixerIncludeCard(true);
                                setMixerResponse(null);
                                triggerAlert(translate("Calligraphy Greeting Card added to curation!"), "success");
                              }}
                              className="px-4 py-2 bg-white/95 border border-[#E3D8C4] text-[#A68B67] hover:text-[#4A5D4E] text-[10px] uppercase tracking-widest font-bold shadow-md rounded hover:shadow-lg transition-all"
                            >
                              ✍️ {translate("Activate Calligraphy Card (+$5.00)")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Curation Synthesis Trigger CTA */}
                  <div className="pt-2">
                    <button
                      onClick={generateGiftMixNarrative}
                      disabled={isMixerLoading || mixerItems.length === 0}
                      className="w-full py-4 bg-[#A68B67] hover:bg-[#8F7553] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs uppercase tracking-[0.25em] font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isMixerLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span className="animate-pulse">
                            {mixerLoadingStep === 0 && translate("Sensing tray elements...")}
                            {mixerLoadingStep === 1 && translate("Styling botanical accents...")}
                            {mixerLoadingStep === 2 && translate("Scribing certificate...")}
                            {mixerLoadingStep === 3 && translate("Readying presentation seal...")}
                            {mixerLoadingStep >= 4 && translate("Binding harmonic energies...")}
                          </span>
                        </div>
                      ) : (
                        <>
                          {translate("Craft Cinematic Curation Narrative")}
                        </>
                      )}
                    </button>
                    {mixerItems.length === 0 && (
                      <p className="text-[9px] text-gray-400 text-center mt-1.5 font-sans font-semibold">
                        {translate("Add at least one item to your tray above to synthesize the narrative.")}
                      </p>
                    )}
                  </div>

                </InteractiveCard>

                {/* Cinematic AI Curation Narrative Output */}
                {mixerResponse && (
                  <InteractiveCard
                    glowColor="166, 139, 103"
                    className="relative bg-[#FCF9F2] border-2 border-[#A68B67] p-8 md:p-10 rounded-lg shadow-xl overflow-hidden space-y-6"
                  >
                    
                    {/* Decorative Watermark Seals */}
                    <div className="absolute right-6 top-6 w-20 h-20 border border-double border-[#A68B67]/30 text-[#A68B67]/25 rounded-full flex items-center justify-center font-bold text-center text-[7px] tracking-widest uppercase rotate-12 select-none pointer-events-none">
                      <div>{translate("Official")}<br/>{translate("Curation")}<br/>{translate("Seal")}</div>
                    </div>

                    <div className="text-center space-y-2 border-b border-[#E3D8C4] pb-5">
                      <span className="text-[9px] uppercase tracking-[0.45em] text-[#A68B67] font-extrabold block">
                        {translate("PresentPerfect Certificate of Harmony")}
                      </span>
                      <h4 className="font-serif italic text-2xl font-black text-[#4A5D4E] tracking-tight">
                        {translate(mixerResponse.title)}
                      </h4>
                      <p className="text-[10px] uppercase font-mono text-gray-500">
                        {translate("Aesthetic Vibe:")} <span className="font-bold text-gray-800">{translate(mixerResponse.simulatedVibeProfile) || translate("Custom Synergy")}</span>
                        &nbsp;&bull;&nbsp;
                        {translate("Craft Time:")} <span className="font-bold text-gray-800">{translate(mixerResponse.estimatedPrepareTime) || translate("1.5 Hours")}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Poetic Narrative */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block">{translate("The Sensory Narrative:")}</span>
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-serif italic text-justify">
                          "{translate(mixerResponse.narrative)}"
                        </p>
                      </div>

                      {/* Unwrapping instructions */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block">{translate("The Presenting Ceremony Guide:")}</span>
                        <p className="text-xs text-gray-600 leading-relaxed font-sans">
                          {translate(mixerResponse.ceremonyInstructions)}
                        </p>
                      </div>
                    </div>

                    {/* Scribe Signoff */}
                    <div className="flex justify-between items-end border-t border-[#E3D8C4] pt-5 mt-4">
                      <div>
                        <p className="text-[8px] font-mono text-gray-400 uppercase">{translate("Aesthetic Reviewer Approved")}</p>
                        <p className="text-xs font-serif font-bold italic text-[#4A5D4E]">{translate(mixerResponse.craftsmanSignOff) || translate("Master Curator Lin, PresentPerfect")}</p>
                      </div>
                      <div className="text-right text-[9px] text-[#A68B67] font-bold font-mono">
                        {translate("No.")} {Math.floor(100000 + Math.random() * 900000)}
                      </div>
                    </div>

                  </InteractiveCard>
                )}

              </div>

            </div>

          </div>
        )}


        {/* CINEMATIC ABOUT US & OUR HISTORY TAB */}
        {activeTab === "about" && (
          <div id="about-tab-content" className="max-w-[1300px] mx-auto px-6 sm:px-12 md:px-16 py-12 space-y-20 animate-fade-in text-[#1C1814]">
            
            {/* Cinematic Hero */}
            <section className="relative w-full overflow-hidden border border-[#E2D8C2] bg-[#FAF7F1] min-h-[500px] md:min-h-[600px] flex flex-col justify-between p-8 md:p-16">
              
              {/* Background elegant watercolor splash & mist representation */}
              <div className="absolute inset-0 z-0 pointer-events-none opacity-15"
                   style={{
                     backgroundImage: 'radial-gradient(circle at 80% 30%, #A68B67 0%, transparent 60%), radial-gradient(circle at 20% 80%, #4A5D4E 0%, transparent 70%)',
                     filter: 'blur(80px)'
                   }} />
              
              {/* Top Banner Accent */}
              <div className="z-10 flex justify-between items-start border-b border-[#E2D8C2]/60 pb-6">
                <div>
                  <span className="text-[10px] tracking-[0.4em] uppercase text-[#A68B67] font-extrabold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-[#A68B67] rotate-45"></span>
                    {translate("传承 / High Heritage")}
                  </span>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">{translate("Boutique Archive No. 042")}</p>
                </div>
                {/* Chinese Traditional Seal Emblem Replica */}
                <div className="w-14 h-14 border-2 border-red-800 text-red-800 rounded-sm flex items-center justify-center font-bold text-center text-xs p-1 tracking-widest rotate-6 leading-none select-none">
                  <div>{translate("Seal Title")}<br/><span className="text-[7px] font-mono font-bold">{translate("CRAFT")}</span></div>
                </div>
              </div>

              {/* Main Text Accent */}
              <div className="z-10 max-w-2xl my-8 space-y-6">
                <span className="text-xs uppercase tracking-[0.3em] text-[#4A5D4E] font-bold block">
                  {translate("The Way of the Gift (礼记)")}
                </span>
                <h1 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tight text-[#1C1814] leading-[1.1]">
                  {translate("About Hero Title Pt1")} <span className="text-[#4A5D4E] not-italic font-bold">{translate("About Hero Title Pt2")}</span> {translate("About Hero Title Pt3")}
                </h1>
                <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-xl">
                  {translate("About Hero Description")}
                </p>
              </div>

              {/* Decorative classical seal footer */}
              <div className="z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-t border-[#E2D8C2]/60 pt-6 text-[10px] uppercase font-bold text-[#A68B67] tracking-widest">
                <div>
                  <span>{translate("ESTABLISHED IN PREFECTURE ARCHIVES • 1978")}</span>
                </div>
                <div className="flex gap-4">
                  <span>✓ {translate("INDEPENDENT CRAFTSMEN GUILD")}</span>
                  <span>✓ {translate("RECYCLED SANCTUARY WOODS")}</span>
                </div>
              </div>
            </section>

            {/* Immersive Photo & Philosophy Blocks */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative group overflow-hidden border border-[#E2D8C2]">
                <img 
                  src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=1200" 
                  alt="Ancient Celadon ceramics" 
                  className="w-full aspect-[4/3] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1814]/70 via-transparent to-transparent opacity-90 p-6 flex flex-col justify-end text-white">
                  <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold">{translate("Material Focus")}</span>
                  <h4 className="text-lg font-serif italic mt-1">{translate("Celadon Jade Glazes & Red Sandalwood")}</h4>
                </div>
              </div>

              <div className="space-y-6">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A68B67] font-extrabold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A68B67]" />
                  {translate("Aesthetics & Materiality")}
                </span>
                <h3 className="text-3xl font-serif font-bold italic text-[#4A5D4E] leading-tight">
                  {translate("Sustainable Packaging Materials")}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                  {translate("Unlike conventional shops that use excessive plastic wrapping, we protect your precious gifts with natural, renewable elements: clean pine shavings, handmade mulberry paper, and dried wildflowers.")}
                </p>
                <blockquote className="border-l-2 border-[#A68B67] pl-4 italic text-sm text-gray-700 font-serif">
                  {translate("\"A gift is not just a transaction, but a meaningful connection between people.\" — Lin, Founder")}
                </blockquote>
              </div>
            </section>

            {/* Cinematic Interactive Timeline */}
            <section className="space-y-12">
              <div className="text-center max-w-md mx-auto space-y-3">
                <span className="text-[10px] uppercase tracking-[0.4em] text-[#A68B67] font-bold">{translate("The Historical Epochs")}</span>
                <h3 className="text-2xl md:text-3.5xl font-serif italic font-bold text-[#4A5D4E]">{translate("Our Heritage Archive")}</h3>
                <div className="w-10 h-[1.5px] bg-[#A68B67] mx-auto" />
              </div>

              <div className="space-y-8 max-w-4xl mx-auto relative before:absolute before:inset-y-0 before:left-4 md:before:left-1/2 before:w-[1px] before:bg-[#E2D8C2]">
                
                {/* Timeline Item 1 */}
                <div className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center group">
                  <div className="absolute left-4 md:left-1/2 w-3.5 h-3.5 bg-[#FAF7F1] border-2 border-[#4A5D4E] rounded-full -translate-x-[6.5px] z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="w-full md:w-[45%] pl-10 md:pl-0 md:text-right pr-0 md:pr-10 space-y-2">
                    <span className="text-sm font-serif font-extrabold text-[#4A5D4E] bg-[#4A5D4E]/10 px-2.5 py-0.5 rounded-full">1978</span>
                    <h4 className="text-lg font-serif font-bold italic text-[#1C1814]">{translate("The Moganshan Calligraphy Workshop")}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {translate("Founded by master carver Lin as a small, unheated workshop crafting customizable ink stone boxes and calligraphic gift envelopes for remote villages.")}
                    </p>
                  </div>
                  <div className="hidden md:block w-[45%]" />
                </div>

                {/* Timeline Item 2 */}
                <div className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center group">
                  <div className="absolute left-4 md:left-1/2 w-3.5 h-3.5 bg-[#FAF7F1] border-2 border-[#A68B67] rounded-full -translate-x-[6.5px] z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="hidden md:block w-[45%]" />
                  <div className="w-full md:w-[45%] pl-10 md:pl-10 space-y-2">
                    <span className="text-sm font-serif font-extrabold text-[#A68B67] bg-[#A68B67]/10 px-2.5 py-0.5 rounded-full">1995</span>
                    <h4 className="text-lg font-serif font-bold italic text-[#1C1814]">{translate("West Lake Curation Vault Opened")}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {translate("Expanded into Hangzhou's historic West Lake prefecture. Began partnering with world-class celadon kilns and local tea growers to distribute cohesive, curated gift containers.")}
                    </p>
                  </div>
                </div>

                {/* Timeline Item 3 */}
                <div className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center group">
                  <div className="absolute left-4 md:left-1/2 w-3.5 h-3.5 bg-[#FAF7F1] border-2 border-[#4A5D4E] rounded-full -translate-x-[6.5px] z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="w-full md:w-[45%] pl-10 md:pl-0 md:text-right pr-0 md:pr-10 space-y-2">
                    <span className="text-sm font-serif font-extrabold text-[#4A5D4E] bg-[#4A5D4E]/10 px-2.5 py-0.5 rounded-full">2012</span>
                    <h4 className="text-lg font-serif font-bold italic text-[#1C1814]">{translate("The Global Craftsmen Alliance")}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {translate("Established an organic registry exchange linking independent, single-family workshops in Turkey (Aegean textiles) and Japan (Kyoto washi paper mills) to absolute quality standards.")}
                    </p>
                  </div>
                  <div className="hidden md:block w-[45%]" />
                </div>

                {/* Timeline Item 4 */}
                <div className="relative flex flex-col md:flex-row md:justify-between items-start md:items-center group">
                  <div className="absolute left-4 md:left-1/2 w-3.5 h-3.5 bg-[#FAF7F1] border-2 border-[#A68B67] rounded-full -translate-x-[6.5px] z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="hidden md:block w-[45%]" />
                  <div className="w-full md:w-[45%] pl-10 md:pl-10 space-y-2">
                    <span className="text-sm font-serif font-extrabold text-[#A68B67] bg-[#A68B67]/10 px-2.5 py-0.5 rounded-full">2026</span>
                    <h4 className="text-lg font-serif font-bold italic text-[#1C1814]">{translate("The Era of Mindful Algorithms")}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {translate("Pioneering the first true server-side AI boutique concierge, fusing forty years of artisanal tactile expertise with predictive styling algorithms.")}
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* CTA action */}
            <div className="border border-[#E2D8C2] bg-white p-8 text-center max-w-3xl mx-auto space-y-4">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#A68B67] font-bold block">{translate("Experience the Curation")}</span>
              <h4 className="text-2xl font-serif italic text-[#1C1814]">{translate("Ready to engage our meticulous services?")}</h4>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                {translate("Wander our beautifully curated catalog, or request our algorithm to construct a digital portfolio suited precisely for your meaningful recipient.")}
              </p>
              <div className="flex justify-center gap-4 pt-2">
                <button 
                  onClick={() => { setActiveTab("shop"); setSelectedCategory("All"); }}
                  className="px-6 py-3 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#3d4d40] transition-colors"
                >
                  {translate("Wander Catalog")}
                </button>
                <button 
                  onClick={() => setActiveTab("inquiry")}
                  className="px-6 py-3 bg-[#FAF7F1] border border-[#E2D8C2] text-gray-700 text-[10px] uppercase tracking-widest font-bold hover:bg-[#EAE7E2] transition-colors"
                >
                  {translate("Send an Inquiry")}
                </button>
              </div>
            </div>

          </div>
        )}


        {/* SHIPPING PHILOSOPHY INDIVIDUAL PAGE */}
        {activeTab === "shipping" && (
          <div id="shipping-tab-content" className="max-w-[1200px] mx-auto px-6 sm:px-12 md:px-16 py-12 space-y-12 animate-fade-in text-[#1C1814]">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#A68B67] font-bold block">{translate("Unhurried Delivery")}</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold italic text-[#4A5D4E]">{translate("Our Shipping Philosophy")}</h2>
              <div className="w-12 h-0.5 bg-[#A68B67] mx-auto" />
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                {translate("We believe that premium objects should never be treated like rushed utility items. When an item travels from our hand-carved drawers to your address, it undergoes a meticulous transit ritual.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6">
              <div className="border border-[#E2D8C2] bg-[#FAF7F1] p-8 space-y-4 rounded-sm">
                <div className="w-10 h-10 bg-[#4A5D4E]/10 rounded-full flex items-center justify-center text-[#4A5D4E]">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold italic text-lg text-[#1C1814]">{translate("Slow-Transit Preservation")}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {translate("We route our parcels through high-fidelity freight carriers prioritizing packaging safety over chaotic rapid speed. Standard items arrive polished, with corners entirely crisp and un-dented.")}
                </p>
              </div>

              <div className="border border-[#E2D8C2] bg-[#FAF7F1] p-8 space-y-4 rounded-sm">
                <div className="w-10 h-10 bg-[#4A5D4E]/10 rounded-full flex items-center justify-center text-[#4A5D4E]">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold italic text-lg text-[#1C1814]">{translate("Mulberry Parchment Ribboning")}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {translate("Every selection in your Cart is hand-enveloped inside custom double-walled crepe paper, embedded with actual dried jasmine stems and sealed with real unbleached hemp thread.")}
                </p>
              </div>

              <div className="border border-[#E2D8C2] bg-[#FAF7F1] p-8 space-y-4 rounded-sm">
                <div className="w-10 h-10 bg-[#4A5D4E]/10 rounded-full flex items-center justify-center text-[#4A5D4E]">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold italic text-lg text-[#1C1814]">{translate("The Returns Covenant")}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {translate("If the tactile feeling of your material choice does not fulfill your vision of absolute serenity, we arrange a complete complimentary return collection within 30 solar days. No questions asked.")}
                </p>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setActiveTab("shop")}
                className="px-8 py-3.5 bg-[#4A5D4E] text-white text-[11px] uppercase tracking-widest font-bold hover:bg-[#3d4d40] transition-colors"
              >
                {translate("Return to Shop Catalog")}
              </button>
            </div>
          </div>
        )}


        {/* CARBON SEQUESTERING INDIVIDUAL PAGE */}
        {activeTab === "carbon" && (
          <div id="carbon-tab-content" className="max-w-[1200px] mx-auto px-6 sm:px-12 md:px-16 py-12 space-y-12 animate-fade-in text-[#1C1814]">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#A68B67] font-bold block">{translate("Earth Sanctuary")}</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold italic text-[#4A5D4E]">{translate("Carbon-Neutral Offset")}</h2>
              <div className="w-12 h-0.5 bg-[#A68B67] mx-auto" />
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                {translate("As a boutique rooted in natural herbs, raw forest cedarwood, and organic cotton, preserving our planet is our absolute operating imperative.")}
              </p>
            </div>

            <div className="max-w-4xl mx-auto border border-[#E2D8C2] bg-[#FAF7F1] p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase tracking-widest text-[#A68B67] font-bold block">{translate("Sanctuary Forestry")}</span>
                  <h4 className="text-2xl font-serif italic text-[#1C1814]">{translate("Mount Mogan Bamboo Initiative")}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {translate("We donate 3.5% of all sales to bamboo forest restoration. Bamboo naturally absorbs carbon dioxide and helps protect local water resources.")}
                  </p>
                </div>
                <div className="overflow-hidden border border-[#E2D8C2]">
                  <img 
                    src="https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=800" 
                    alt={translate("Lush green bamboo forests")} 
                    className="w-full aspect-[4/3] object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="border-t border-[#E2D8C2] pt-8 space-y-4">
                <h4 className="text-lg font-serif font-bold italic text-[#1C1814]">{translate("Our Tangible Achievements")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="bg-white p-4 border border-[#E2D8C2]/40">
                    <span className="text-2xl font-serif font-bold text-[#4A5D4E]">12,850+</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{translate("Acres Re-Wilded")}</p>
                  </div>
                  <div className="bg-white p-4 border border-[#E2D8C2]/40">
                    <span className="text-2xl font-serif font-bold text-[#4A5D4E]">100%</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{translate("Biodegradable Raw Pulp")}</p>
                  </div>
                  <div className="bg-white p-4 border border-[#E2D8C2]/40">
                    <span className="text-2xl font-serif font-bold text-[#4A5D4E]">{translate("Zero")}</span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{translate("Synthetic Plastics Used")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={() => setActiveTab("shop")}
                className="px-8 py-3.5 bg-[#4A5D4E] text-white text-[11px] uppercase tracking-widest font-bold hover:bg-[#3d4d40] transition-colors"
              >
                {translate("Return to Shop Catalog")}
              </button>
            </div>
          </div>
        )}


        {/* QUESTIONS & Bespoke INQUIRIES TAB */}
        {activeTab === "inquiry" && (
          <div id="inquiry-tab-content" className="max-w-[1300px] mx-auto px-6 sm:px-12 md:px-16 py-12 space-y-12 animate-fade-in text-[#1C1814]">
            
            {/* Header section rephrasing the meaning of the website in general */}
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-[10px] uppercase tracking-[0.4em] text-[#A68B67] font-bold block">
                传统咨询 / Heritage Correspondence
              </span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold italic text-[#4A5D4E]">
                Bespoke Correspondence
              </h2>
              <div className="w-12 h-0.5 bg-[#A68B67] mx-auto" />
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                Whether you seek custom-sealed whole green tea needles, hand-numbered rosewood storage chests, or calligraphic silk canvas wraps for an upcoming celebration, our Mogan Mountain archivists are at your absolute service. Write us your thoughts below and get tailored AI assistance.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              
              {/* Inquiry Form: Centered & Cinematic */}
              <div className="bg-[#FAF7F1] border border-[#E2D8C2] p-8 sm:p-12 space-y-8 relative overflow-hidden rounded shadow-sm">
                {/* Visual traditional decoration lines */}
                <div className="absolute top-0 left-0 w-2 h-full bg-[#4A5D4E]" />
                <div className="absolute top-0 right-0 w-2 h-full bg-[#4A5D4E]/30" />
                
                {/* Supabase connection status indicator badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E2D8C2] p-3 rounded text-[10px] tracking-widest uppercase font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A5D4E] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4A5D4E]"></span>
                    </div>
                    <span>{translate("Supabase Storage Pipeline")}</span>
                  </div>
                  <span className="text-[#4A5D4E] font-extrabold">{translate("SECURE & ACTIVE CONNECTED")}</span>
                </div>

                {inquirySuccess ? (
                  <div className="space-y-6 py-6 text-center animate-fade-in">
                    <div className="w-16 h-16 border-2 border-dashed border-[#4A5D4E] bg-[#4A5D4E]/5 rounded-full flex items-center justify-center mx-auto text-[#4A5D4E]">
                      <Check className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs uppercase tracking-widest text-[#A68B67] font-bold block">
                        咨询登记成功 / Inscribed in Parlor Ledgers
                      </span>
                      <h3 className="text-2xl font-serif italic text-[#1C1814] font-bold">
                        Correspondence Registered
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed max-w-md mx-auto">
                        Your bespoke question has been written using natural charcoal mulberry ink and stamped with traditional red wax lacquer. Master Lin's preservation team will study your request. A formal response will be dispatched to your email address within one solar cycle.
                      </p>
                    </div>

                    <div className="pt-4 flex flex-wrap gap-4 justify-center">
                      <button 
                        onClick={() => {
                          setInquirySuccess(false);
                          setInquiryName("");
                          setInquiryEmail("");
                          setInquiryMessage("");
                          setInquiryCallback(false);
                          setInquirySealEnvelope(true);
                        }}
                        className="px-6 py-2.5 bg-white border border-[#E2D8C2] text-gray-700 text-[10px] uppercase tracking-widest font-bold hover:bg-[#EAE7E2] transition-all rounded"
                      >
                        Submit Another Request
                      </button>
                      <button 
                        onClick={() => setActiveTab("shop")}
                        className="px-6 py-2.5 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#3d4d40] transition-colors rounded"
                      >
                        Return to Catalog
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-6">
                    <div className="border-b border-[#E2D8C2]/60 pb-4">
                      <h3 className="text-2xl font-serif italic text-[#1C1814] flex items-center gap-2 font-bold justify-center">
                        <Mail className="w-6 h-6 text-[#4A5D4E]" />
                        Write to our Archivists
                      </h3>
                      <p className="text-center text-xs text-gray-500 leading-relaxed max-w-md mx-auto mt-2">
                        Every letter is read with deep presence by humans, never automated bots. Fields are checked for offline ink compatibility and securely synchronized to the database.
                      </p>
                    </div>

                    <div className="space-y-5">
                      {/* Grid for Name & Email to organize and fit beautifully */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1.5" htmlFor="inq-name">
                            Full Name / Designation
                          </label>
                          <input 
                            id="inq-name"
                            type="text"
                            required
                            value={inquiryName}
                            onChange={(e) => setInquiryName(e.target.value)}
                            placeholder="Honored Recipient"
                            className="w-full bg-white border border-[#E2D8C2] h-11 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] transition-all rounded shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1.5" htmlFor="inq-email">
                            Electronic Mail Address
                          </label>
                          <input 
                            id="inq-email"
                            type="email"
                            required
                            value={inquiryEmail}
                            onChange={(e) => setInquiryEmail(e.target.value)}
                            placeholder="name@destination.com"
                            className="w-full bg-white border border-[#E2D8C2] h-11 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] transition-all rounded shadow-inner"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1.5" htmlFor="inq-specialty">
                          Inquired Traditional Specialty
                        </label>
                        <select 
                          id="inq-specialty"
                          value={inquirySpecialty}
                          onChange={(e) => setInquirySpecialty(e.target.value)}
                          className="w-full bg-white border border-[#E2D8C2] h-11 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] transition-all rounded cursor-pointer shadow-inner"
                        >
                          <option value="Hand-Carved Red Sandalwood Chests">Hand-Carved Red Sandalwood Chests</option>
                          <option value="Celadon Jade Imperial Tea Sets">Celadon Jade Imperial Tea Sets</option>
                          <option value="Bespoke Calligraphed Silk Wrapping">Bespoke Calligraphed Silk Wrapping</option>
                          <option value="Rare Mountain Green Tea Needles">Rare Mountain Green Tea Needles</option>
                          <option value="Special Custom Milestones Ceremony Curation">Special Custom Milestones Ceremony Curation</option>
                          <option value="Other Ancient Handcrafted Wonders">Other Ancient Handcrafted Wonders</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-600 font-bold mb-1.5" htmlFor="inq-msg">
                          Your Inquiry / Handwritten Note
                        </label>
                        <textarea 
                          id="inq-msg"
                          rows={4}
                          required
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          placeholder="Express your vision or questions in detail. Mention material weights, wax-sealing custom texts, or wood carvings..."
                          className="w-full bg-white border border-[#E2D8C2] p-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#4A5D4E] transition-all resize-none rounded shadow-inner"
                        />
                      </div>

                      {/* Checkboxes layout made clean and elegant */}
                      <div className="bg-white border border-[#E2D8C2] p-4 rounded space-y-3 shadow-inner">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            className="mt-1 h-3.5 w-3.5 accent-[#4A5D4E] cursor-pointer"
                            checked={inquiryCallback}
                            onChange={(e) => setInquiryCallback(e.target.checked)}
                          />
                          <span className="text-[11px] text-gray-750 leading-relaxed">
                            I request a custom callback or personal audio transmission from Mount Mogan's head archivist regarding calligraphic elements.
                          </span>
                        </label>

                        <div className="h-px bg-gray-100" />

                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            className="mt-1 h-3.5 w-3.5 accent-[#4A5D4E] cursor-pointer"
                            checked={inquirySealEnvelope}
                            onChange={(e) => setInquirySealEnvelope(e.target.checked)}
                          />
                          <span className="text-[11px] text-gray-750 leading-relaxed">
                            Wrap my reply package in traditional, wax-stamped cedar leaf parchment, free of cost.
                          </span>
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full h-12 bg-[#4A5D4E] text-white text-[10px] uppercase tracking-[0.25em] font-extrabold hover:bg-[#3d4d40] transition-all duration-300 flex items-center justify-center gap-2 rounded shadow-sm hover:shadow"
                    >
                      <span>Inscribe & Dispatch Inquiry</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>

              {/* Historic Registry & Sent Correspondence List */}
              {userInquiries.length > 0 && (
                <div className="mt-12 bg-white border border-[#E2D8C2] p-6 rounded space-y-4 shadow-xs animate-fade-in">
                  <h4 className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#4A5D4E] border-b border-gray-100 pb-2">
                    {translate("Your Historic Correspondence")} ({userInquiries.length})
                  </h4>
                  <div className="space-y-4 divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-2">
                    {userInquiries.map((inq: any) => (
                      <div key={inq.id} className="pt-3 first:pt-0 space-y-1.5 text-left text-xs">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-gray-800">{inq.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{inq.date}</span>
                        </div>
                        <div className="text-[10px] text-[#A68B67] uppercase tracking-wider font-semibold">
                          Specialty: {translate(inq.specialty)}
                        </div>
                        <p className="text-gray-600 bg-[#FCFAF7] p-2 border border-gray-100 italic rounded">
                          "{inq.message}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Boutique Product Detail Modal Sheets */}
      {selectedProduct && (
        <div id="product-detail-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-fade-in">
          <div className="bg-[#FDFCFB] max-w-4xl w-full border border-[#F0EDEA] overflow-hidden premium-shadow relative flex flex-col md:flex-row h-auto max-h-[90vh]">
            
            {/* Close modal */}
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 z-20 bg-[#FDFCFB]/80 hover:bg-[#F5F2EE] p-2 border border-[#E5E2DE] text-[#1A1A1A]"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Side: Images */}
            <div className="w-full md:w-1/2 bg-[#F5F2EE] flex flex-col justify-between p-6">
              
              <div className="aspect-[4/5] overflow-hidden relative border border-[#E5E2DE] bg-white group">
                <img 
                  src={modalImageIndex === 0 ? selectedProduct.image : selectedProduct.secondaryImage} 
                  alt={selectedProduct.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-all duration-700 ease-out hover:scale-105"
                />
                
                {/* Image switcher arrows */}
                <div className="absolute bottom-4 right-4 flex gap-1 bg-[#FDFCFB]/90 backdrop-blur border border-[#E5E2DE] p-1">
                  <button 
                    onClick={() => setModalImageIndex(0)} 
                    className={`px-3 py-1 text-[9px] uppercase tracking-widest ${modalImageIndex === 0 ? "bg-[#4A5D4E] text-white" : "hover:bg-[#F5F2EE]"}`}
                  >
                    Primary View
                  </button>
                  <button 
                    onClick={() => setModalImageIndex(1)} 
                    className={`px-3 py-1 text-[9px] uppercase tracking-widest ${modalImageIndex === 1 ? "bg-[#4A5D4E] text-white" : "hover:bg-[#F5F2EE]"}`}
                  >
                    Context View
                  </button>
                </div>
              </div>

              {/* Tag links */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {selectedProduct.tags.map(t => (
                  <span key={t} className="bg-white/90 text-gray-500 border border-[#E5E2DE] px-2.5 py-0.5 text-[9px] uppercase tracking-widest">
                    #{t}
                  </span>
                ))}
              </div>

            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto flex flex-col justify-between h-auto">
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.35em] text-[#A68B67] font-bold block mb-1">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] mt-1 mb-2 font-semibold italic">
                    {selectedProduct.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex text-amber-500">
                      {"★".repeat(Math.round(selectedProduct.rating))}
                      {"☆".repeat(5 - Math.round(selectedProduct.rating))}
                    </div>
                    <span className="text-xs text-gray-400 font-sans">{selectedProduct.rating} / 5.0 rating value</span>
                  </div>

                  <p className="text-sm font-semibold text-[#4A5D4E] text-lg">${selectedProduct.price.toFixed(2)}</p>
                </div>

                <p className="text-xs text-[#666] leading-relaxed">
                  {selectedProduct.description}
                </p>

                {/* Artifact characteristics details */}
                <div className="border-t border-b border-[#F0EDEA] py-4 space-y-2.5 text-xs">
                  <div className="grid grid-cols-3">
                    <span className="text-gray-400 font-medium uppercase text-[9px] tracking-widest">Physical Materials:</span>
                    <span className="col-span-2 text-gray-700">{selectedProduct.materials || "Locally Sourced Organic fibers"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-400 font-medium uppercase text-[9px] tracking-widest">Dimensions value:</span>
                    <span className="col-span-2 text-gray-700">{selectedProduct.dimensions || "Standard Boutique specification"}</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-gray-400 font-medium uppercase text-[9px] tracking-widest">Boutique Stock:</span>
                    <span className="col-span-2 text-gray-700 font-bold">
                      {selectedProduct.stock > 0 ? `Plenty Available (${selectedProduct.stock} unit packages)` : "Out of Stock"}
                    </span>
                  </div>
                </div>

                {/* Features bulletins */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#A68B67] font-bold block">Artisanal Special features</span>
                  <ul className="text-xs text-[#666] list-disc pl-5 space-y-1">
                    {selectedProduct.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-6 mt-8 border-t border-[#F0EDEA] flex gap-3">
                <button
                  onClick={() => addToCart(selectedProduct, 1)}
                  className="flex-1 py-3.5 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-[10px] uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Styling Bag
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="px-6 py-3.5 bg-[#F5F2EE] border border-[#E5E2DE] hover:bg-[#EAE7E2] text-xs font-semibold text-gray-700"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* IMMERSIVE CURATION CEREMONY MODAL */}
      {isCeremonyOpen && (
        <div id="curation-ceremony-modal" className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in text-[#1C1814]">
          <div className="bg-[#FCFAF7] max-w-xl w-full border border-[#D5CBB8] shadow-2xl relative flex flex-col h-auto max-h-[92vh] overflow-y-auto rounded-lg">
            
            {/* Header branding */}
            <div className="bg-[#FAF6EE] border-b border-[#EBE5DA] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-[#A68B67]">Atelier Presentation Ritual</span>
              </div>
              <button 
                onClick={() => setIsCeremonyOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors p-1"
                title="Cancel Ceremony"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {ceremonyStep === "details" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center space-y-2">
                    <h3 className="font-serif italic text-2xl md:text-3xl font-bold text-[#4A5D4E]">Introduce Yourself</h3>
                    <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">
                      Please enter your contact and delivery details so we can customize your package manifest and ensure safe courier delivery.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!ceremonyName.trim() || !ceremonyAddress.trim() || !ceremonyEmail.trim() || !ceremonyPhone.trim()) {
                        triggerAlert("Please fill in all details to proceed.", "error");
                        return;
                      }
                      setCeremonyStep("rubbing");
                      setRubProgress(0);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-extrabold text-gray-500 block">Full Name:</label>
                      <input 
                        type="text"
                        required
                        value={ceremonyName}
                        onChange={(e) => setCeremonyName(e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E3D8C4] rounded focus:outline-none focus:border-[#4A5D4E] font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-extrabold text-gray-500 block">Delivery Address:</label>
                      <textarea 
                        required
                        rows={2}
                        value={ceremonyAddress}
                        onChange={(e) => setCeremonyAddress(e.target.value)}
                        placeholder="e.g. 742 Evergreen Terrace, Springfield"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E3D8C4] rounded focus:outline-none focus:border-[#4A5D4E] font-medium leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-gray-500 block">Email Address:</label>
                        <input 
                          type="email"
                          required
                          value={ceremonyEmail}
                          onChange={(e) => setCeremonyEmail(e.target.value)}
                          placeholder="eleanor@example.com"
                          className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E3D8C4] rounded focus:outline-none focus:border-[#4A5D4E] font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-extrabold text-gray-500 block">Contact Phone Number:</label>
                        <input 
                          type="tel"
                          required
                          value={ceremonyPhone}
                          onChange={(e) => setCeremonyPhone(e.target.value)}
                          placeholder="+1 (555) 019-2834"
                          className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E3D8C4] rounded focus:outline-none focus:border-[#4A5D4E] font-medium"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-xs uppercase tracking-[0.2em] font-extrabold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Proceed to Curation Ceremony
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {ceremonyStep === "rubbing" && (
                <div className="space-y-6 text-center animate-fade-in select-none">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-[#A68B67] font-extrabold">Step 2: Seal of Intention</span>
                    <h3 className="font-serif italic text-2xl font-bold text-[#4A5D4E]">Your gift is ready.</h3>
                    <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">
                      Gently rub the royal wax seal below with your cursor (or swipe back and forth on mobile) to fuse the natural fibers and finalize your creation.
                    </p>
                  </div>

                  {/* Interactive Rub Zone */}
                  <div 
                    className="relative w-48 h-48 mx-auto bg-[#FAF5EB] rounded-full border-4 border-double border-[#A68B67] flex items-center justify-center cursor-move overflow-hidden group shadow-md"
                    onMouseMove={() => {
                      if (rubProgress < 100) {
                        setRubProgress(prev => {
                          const next = prev + 6.0;
                          if (next >= 100) {
                            finalizeCeremonyCuration();
                            setRubbedSuccessfully(true);
                            setCeremonyStep("ready");
                            triggerAlert("Curation seal bound successfully!", "success");
                            return 100;
                          }
                          return next;
                        });
                      }
                    }}
                    onTouchMove={() => {
                      if (rubProgress < 100) {
                        setRubProgress(prev => {
                          const next = prev + 10.0;
                          if (next >= 100) {
                            finalizeCeremonyCuration();
                            setRubbedSuccessfully(true);
                            setCeremonyStep("ready");
                            triggerAlert("Curation seal bound successfully!", "success");
                            return 100;
                          }
                          return next;
                        });
                      }
                    }}
                  >
                    {/* The Wax Seal graphic */}
                    <div className="absolute inset-2 bg-gradient-to-tr from-red-800 to-red-600 rounded-full flex flex-col items-center justify-center text-white shadow-inner select-none transition-transform duration-300 group-hover:scale-105 active:scale-95">
                      {/* Stamp design */}
                      <span className="text-4xl">👑</span>
                      <span className="text-[8px] tracking-[0.4em] uppercase font-bold text-yellow-300 mt-1">PRESENT</span>
                      <span className="text-[6px] tracking-[0.3em] uppercase font-mono text-yellow-100/70">PERFECT</span>
                      
                      {/* Interactive shimmer */}
                      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" style={{ backgroundImage: "linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
                    </div>

                    {/* Rub progress overlay percentage mask - fades out completely at 100% */}
                    <div 
                      className="absolute inset-0 bg-red-950/45 backdrop-blur-[6px] flex flex-col items-center justify-center transition-opacity duration-150 pointer-events-none"
                      style={{ opacity: Math.max(0, 1 - (rubProgress / 100)) }}
                    >
                      {/* Counter phrase styled as a very elegant golden text at the bottom area, leaving the crown visible */}
                      <div className="absolute bottom-4 bg-black/50 backdrop-blur-sm border border-yellow-500/30 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-widest shadow-sm">
                        {Math.floor(rubProgress)}% BOUND
                      </div>
                    </div>

                    {/* Particle hints */}
                    <div className="absolute inset-0 border border-red-700/30 rounded-full animate-ping pointer-events-none opacity-40" />
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-[#FAF6EE] h-2 rounded overflow-hidden border border-[#E2D8C2]">
                      <div className="bg-gradient-to-r from-[#A68B67] to-[#4A5D4E] h-full transition-all duration-150" style={{ width: `${rubProgress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      Rub Progress: <span className="font-mono font-black text-[#4A5D4E]">{Math.floor(rubProgress)}%</span>
                    </p>
                    <button
                      onClick={() => {
                        finalizeCeremonyCuration();
                        setRubProgress(100);
                        setRubbedSuccessfully(true);
                        setCeremonyStep("ready");
                        triggerAlert("Curation seal bound successfully!", "success");
                      }}
                      className="text-[9px] uppercase tracking-widest font-extrabold text-[#A68B67] underline hover:text-[#4A5D4E]"
                    >
                      Or skip rubbing gesture to finalize instantly
                    </button>
                  </div>
                </div>
              )}

              {ceremonyStep === "ready" && (
                <div className="space-y-6 animate-fade-in text-center">
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-green-50 rounded-full border-2 border-green-200 flex items-center justify-center mx-auto text-green-600 shadow-md">
                      <span className="text-3xl">✨</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-green-700 font-extrabold block">Bespoke Curation Sealed</span>
                    <h3 className="font-serif italic text-3xl font-black text-[#4A5D4E]">Your gift is ready.</h3>
                    <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto font-serif italic">
                      "I will rub it and it will arrive soon..."
                    </p>
                    <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                      Your hand-mixed curation has been safely added to your styling bag. We have printed the golden certificate, registered your contact files, and placed this in our premium cedarwood courier queue.
                    </p>
                  </div>

                  {/* Registered Delivery Manifest Card */}
                  <div className="bg-[#FAF7F1] border-2 border-dashed border-[#C5BCAE] p-5 rounded-lg text-left space-y-4">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#A68B67] border-b border-[#E3D8C4] pb-2">
                      Registered Deliveree Credentials
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Recipient:</span>
                        <span className="font-semibold text-gray-900">{ceremonyName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Contact Phone:</span>
                        <span className="font-semibold text-gray-900">{ceremonyPhone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Contact Email:</span>
                        <span className="font-semibold text-gray-900 font-mono">{ceremonyEmail}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold">Courier Target Address:</span>
                        <span className="font-semibold text-gray-900">{ceremonyAddress}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#E3D8C4]/60 p-3 rounded text-[11px] space-y-1.5">
                      <p className="font-bold text-gray-700 uppercase tracking-wide text-[9px]">Sourced Content Items:</p>
                      <div className="flex flex-wrap gap-2">
                        {mixerItems.map((item, i) => (
                          <span key={i} className="bg-[#FAF9F6] border border-[#E3D8C4]/60 px-2 py-1 rounded text-gray-700 text-[10px] font-medium font-mono">
                            {item.quantity}x {item.icon} {item.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-1">
                      <span className="text-gray-400 text-[9px] uppercase">Registered Delivery Status:</span>
                      <span className="bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider animate-pulse">
                        Sourcing Queue
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => setIsCeremonyOpen(false)}
                      className="flex-1 py-3 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-xs uppercase tracking-[0.2em] font-extrabold transition-all shadow-md"
                    >
                      Browse More Creations
                    </button>
                    <button
                      onClick={() => {
                        setIsCeremonyOpen(false);
                        setIsCartOpen(true);
                      }}
                      className="flex-1 py-3 border border-[#4A5D4E] hover:bg-gray-50 text-[#4A5D4E] text-xs uppercase tracking-[0.2em] font-extrabold transition-all"
                    >
                      Go to Styling Bag
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Styled Cinematic Floating Card Footer */}
      <footer 
        ref={footerRef}
        id="site-footer" 
        className="mx-4 sm:mx-8 md:mx-12 lg:mx-16 mb-8 md:mb-12 mt-24 rounded-[2rem] border border-[#E2D8C2]/65 bg-[#FAF7F1]/85 backdrop-blur-xl shadow-[0_24px_80px_rgba(74,93,78,0.06)] overflow-hidden p-8 md:p-14 relative z-20"
        style={{
          opacity: 0.22 + (footerVisibleRatio * 0.78),
          transform: `scale(${0.96 + (footerVisibleRatio * 0.04)}) translateY(${20 * (1 - footerVisibleRatio)}px)`,
          filter: `blur(${Math.max(0, 8 * (1 - footerVisibleRatio))}px)`,
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-serif font-bold italic text-[#4A5D4E] tracking-tight">{translate("The Craft Gift")}</span>
            </div>
            <p className="text-[11.5px] text-gray-600 leading-relaxed font-medium">
              {translate("We design premium and elegant gifting tools themed around traditional heritage and organic design, powered by predictive boutique concierge recommendations.")}
            </p>
            <div className="text-[9px] uppercase tracking-[0.25em] text-[#A68B67] font-bold flex items-center gap-1.5 pt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4A5D4E] animate-pulse"></span>
              <span>{translate("ESTABLISHED 1978")}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1C1814] border-b border-[#E2D8C2]/40 pb-2">{translate("Curated Collections")}</h5>
            <ul className="text-[11px] text-gray-600 space-y-2.5 font-medium">
              <li>
                <button 
                  onClick={() => { setActiveTab("shop"); setSelectedCategory("Gourmet & Sweets"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Gourmet & Chocolates")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab("shop"); setSelectedCategory("Wellness & Comfort"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Wellness, Comfort & Spa")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab("shop"); setSelectedCategory("Tech & Gadgets"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Tech & Walnut Accessories")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab("shop"); setSelectedCategory("Home & Decor"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Home, Clay & Glass Terrariums")}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1C1814] border-b border-[#E2D8C2]/40 pb-2">{translate("Aesthetic Utilities")}</h5>
            <ul className="text-[11px] text-gray-600 space-y-2.5 font-medium">
              <li>
                <button 
                  onClick={() => { setActiveTab("inquiry"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Direct Inquiry Desk")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab("registry"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Bespoke Offers")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab("journal"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Bespoke Gift Mixer")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setActiveTab("about"); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
                  className="hover:text-[#4A5D4E] hover:translate-x-1 transition-all duration-300 text-left flex items-center gap-1 group"
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#A68B67]">&bull;</span>
                  {translate("Our Long History")}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-bold text-[#1C1814] border-b border-[#E2D8C2]/40 pb-2">{translate("Boutique Information")}</h5>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              {translate("Open Daily from 10:00 to 18:00. Courier Shipping is packed inside eco-friendly forest-wood boxes.")}
            </p>
            <div className="inline-flex items-center gap-1.5 bg-[#4A5D4E] px-3 py-2 border border-[#4A5D4E] text-[9px] text-white uppercase tracking-[0.2em] font-extrabold rounded shadow-sm">
              <LockKeyhole className="w-3 h-3 text-white" />
              <span>{translate("Secure Payment Guarantee")}</span>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-[#E2D8C2]/50 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.22em] text-[#888] gap-4">
          <div className="font-medium text-center md:text-left">
            <span>&copy; PresentPerfect 2026 {translate("The Craft Gift")}. {translate("All rights reserved.")}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 font-semibold">
            <button onClick={() => { setActiveTab("shipping"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="hover:text-[#1C1814] transition-colors">{translate("Shipping Philosophy")}</button>
            <button onClick={() => { setActiveTab("carbon"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="hover:text-[#1C1814] transition-colors">{translate("Carbon-Neutral Offset")}</button>
            <button onClick={() => { setActiveTab("about"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="hover:text-[#1C1814] transition-colors text-[#A68B67]">{translate("Our Story Archivist")}</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
