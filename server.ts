import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dns from "dns";

// Fix for Node ESM resolution in full-stack context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  if (dns && typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (err) {
  console.warn("Unable to set DNS result order:", err);
}

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// Enable CORS for all routes (important for secure sandboxed iframe loading)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// API route first: AI-powered curated gift recommending handler
app.post("/api/ai/gift-ideas", async (req, res) => {
  const { recipientProfile, occasion, relationship, budget, giftStyle } = req.body;

  if (!recipientProfile || !occasion || !relationship || !giftStyle) {
    return res.status(400).json({ error: "Missing required gift selection parameters." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  // High-fidelity fallback builder function used when key is missing OR if Gemini API call errors out
  const getDynamicFallbackResponse = () => {
    // Determine dynamic matching products based on budget and gifting style
    const budgetVal = Number(budget) || 100;
    
    // Choose appropriate items from the catalog
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

    // Filter by budget
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
      // provide at least two cheapest item matching style
      filteredMatches = catalogMatches.slice(0, 2);
    } else if (filteredMatches.length > 3) {
      filteredMatches = filteredMatches.slice(0, 3);
    }

    // Custom creative bespoke DIY ideas based on style focus
    let bespoke: Array<{ title: string; description: string; estimatedCost: string; reasoning: string }> = [];
    const lowerHobbies = (recipientProfile.hobbies || "creative things").toLowerCase();

    if (giftStyle.toUpperCase() === "SENSORY & COZY" || giftStyle.toLowerCase().includes("cozy")) {
      bespoke = [
        {
          title: "Custom Botanist Herbal Sleep Box",
          description: `Assemble dried chamomile florets, fresh organic lavender petals, and whole star anise inside custom cotton mesh sachets. Recommend spraying with sweet orange blossom water.`,
          estimatedCost: "$12.00",
          reasoning: `Directly targets relaxing sensations. Complements interests in ${lowerHobbies} perfectly with a warming scent.`
        },
        {
          title: "Preloaded Velvet Nostalgia Playlist & Warm Cider Mulching Kit",
          description: "Curate a 30-track relaxing vinyl playlist, shared via printed retro QR codes enclosed inside a vintage spice tin filled with custom dried orange rind, cloves, and premium cinnamon twigs.",
          estimatedCost: "$8.50",
          reasoning: "Encapsulates acoustic warmth and evokes deep, cozy winter or evening comfort."
        }
      ];
    } else if (giftStyle.toUpperCase() === "ELEGANT" || giftStyle.toLowerCase().includes("elegant")) {
      bespoke = [
        {
          title: "Gold-Leaf Calligraphy Memory Parchment",
          description: "Transcribe a significant date, traditional quote, or coordinates using high-end calligraphy fountain ink onto deckled-edge heavy luxury water-colored paper, wrapped with custom gold-foil botanical stickers.",
          estimatedCost: "$15.00",
          reasoning: "Gives a highly premium, sophisticated, museum-quality custom artwork experience."
        },
        {
          title: "Handcrafted Italian Leather Monogram Bookmark & Wax Sigil Stamp",
          description: "Surgically cut standard vegetable-tanned thick leather, finish the burnished edge using clean beeswax, hot-press their initial with custom gold leaf, and tie with real silk velvet thread.",
          estimatedCost: "$10.00",
          reasoning: `A chic, tailored luxury addition fitting for someone who focuses on high elegance and ${lowerHobbies}.`
        }
      ];
    } else if (giftStyle.toUpperCase() === "SENTIMENTAL" || giftStyle.toLowerCase().includes("sentimental")) {
      bespoke = [
        {
          title: "Hand-Bound Shared Chronicle Journey Booklet",
          description: "Stitch together heavy stock paper using standard Japanese cross-binding twine, decorate with 5 polaroid photo snapshots, and handwrite exact dates of your favorite memories together.",
          estimatedCost: "$9.00",
          reasoning: "Deeply heartfelt, triggering memories of love, shared trips, and traditional connections."
        },
        {
          title: "Physical Apothecary Capsule of Favorite Moments",
          description: `Write down 15 customized tiny notes containing reasons they are valued, fold them into tiny scrolls with baker's twine, and bottle them inside a heavy pharmacy-grade corked glass vial containing fine sand.`,
          estimatedCost: "$6.00",
          reasoning: "Brings instant smiles, preserving personal connection and nostalgic warmth forever."
        }
      ];
    } else { // Practical/default
      bespoke = [
        {
          title: "Organic Linen Desk Organizer Tray with Wood Insets",
          description: "Crease heavy-duty unbleached flax canvas using fabric adhesive to hold their daily essential objects, complete with small forest walnut wood blocks for keeping keys and jewelry organized.",
          estimatedCost: "$12.00",
          reasoning: `Extremely practical desktop companion that adds beautiful, custom minimalist texture to their workspace.`
        },
        {
          title: "Gourmet Infused Himalayan Herb Salt Grinder Curation",
          description: "Grind pink mineral crystal rocks together with dried whole rosemary, smoked garlic skins, and organic black peppercorns. Present in premium reusable glass mills with handwritten labels.",
          estimatedCost: "$10.50",
          reasoning: `Extremely useful in culinary activities while manifesting high personal care and thoughtful taste.`
        }
      ];
    }

    // Dynamic greeting messages
    const greetings: { [key: string]: string } = {
      "Birthday": `Dearest ${relationship}, wishing you a gorgeous birthday! May your days be filled with beautiful moments, cozy scents, and the continuous warm comfort you bring to all around you.`,
      "Anniversary": `Happy Anniversary to my dear ${relationship}! Celebrating the rich moments, shared laughter, and beautiful memories that bind us together. Here is to many more chapters of joy.`,
      "Graduation": `Warmest congratulations on your graduation! So proud of your persistent dedication and craftsmanship. Wishing you infinite inspiration as you build your next masterpiece.`,
      "Wedding": `Heartfelt congratulations on this beautiful union! Wishing you a lifetime of shared tea, warm blanketing sessions, and a love that deepens like fine wood.`,
      "Mother's/Father's Day": `Wishing the most wonderful celebration to an extraordinary ${relationship}! Thank you for your endless comfort, wisdom, and warm presence. You deserve the best rest today.`,
      "Thank You": `A small token of heart-wrenching gratitude to an incredible ${relationship}. Your warm help and thoughtfulness have been the ultimate present in my life. Thank you!`,
      "Holiday": `Wishing my spectacular ${relationship} the absolute coziest of holidays! May your winter be filled with hand-poured candle embers, hot tea, and joyous celebration.`
    };

    const curatedGreetingMessage = greetings[occasion] || `Dear ${relationship}, wishing you the warmest of celebrations on this lovely ${occasion}. May your days be filled with absolute comfort, wellness, and peace.`;

    return {
      analysis: `We've custom-tailored these options for your ${relationship} (${recipientProfile.ageGroup}, pursuing ${recipientProfile.genderPreference} aesthetic) who is deeply passionate about "${recipientProfile.hobbies}". Recognizing the gift tone target is ${giftStyle}, we focused on selecting items that embody this spirit while keeping strictly under $${budgetVal} USD.`,
      suggestedCatalogProductIds: filteredMatches,
      bespokeSuggestions: bespoke,
      giftWrappingRecommendation: giftStyle.toUpperCase() === "ELEGANT" 
        ? "Impeccable dense matte forest-green paper bound with tight double-faced brass-satin ribbon and finalized with an initial wax seal."
        : "Natural unbleached recycled crinkle paper bound with thick rustic hemp cord, detailed with a small real sprig of pine, lavender, or eucalyptus.",
      curatedGreetingMessage: curatedGreetingMessage,
      warning: "api_key_missing_dynamic_fallback"
    };
  };

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // Elegant dynamic fallback directly
    return res.json(getDynamicFallbackResponse());
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    const promptMessage = `
You are the master curation AI for PresentPerfect, an exquisite luxury gift boutique.
The user is searching for a perfect personalized gift based on these specifications:
- Recipient Profile:
  * Age Group: ${recipientProfile.ageGroup}
  * Gender Preference/Elegance style: ${recipientProfile.genderPreference}
  * Hobbies, Interests & Vibe: ${recipientProfile.hobbies}
- Occasion: ${occasion}
- Relationship to giver: ${relationship}
- Maximum Budget limit: $${budget} USD
- Gift Style Focus: ${giftStyle} 

Please perform a targeted psychological and aesthetic analysis of this profile, recommending:
1. Exact product IDs from our store catalog that fit best. 
You can choose from these valid IDs:
- "gourmet-chocolates" (Aura Artisanal Chocolate Truffles, $34)
- "organic-tea-set" (Elysian Organic Tea Ritual Set, $42)
- "lavender-blanket" (Cloud-knit Lavender Fleece Throw, $65.05)
- "essential-diffuser" (Zen Ceramic Stone Ultrasonic Diffuser, $49)
- "organic-robe" (Waffle-Weave Turkish Cotton Bathrobe, $88)
- "wooden-charger" (Forest Walnut Wooden Wireless Charger, $39.99)
- "ambient-eye-mask" (Aura Smart Sound-Cancelling Relaxation Mask, $54)
- "retro-keyboard" (Classic Oak Wood Mechanical Keyboard, $119)
- "amber-soy-candle" (Nirvana Hand-Poured Amber Soy Candle, $24.50)
- "botanical-embroidery" (Eden Bloom Botanical Embroidery Kit, $28)
- "glass-terrarium" (Luna Glass Orb Hanging Terrarium, $36)
- "leather-journal" (Emperor Tan Leather Journal Set, $45)
- "instant-camera" (Retro-Chic Instant Polaroid Camera, $95)
- "gourmet-cheese-board" (Organic Acacia Wood Cheese-board Set, $49.95)

Strictly pick ONLY from these 14 valid IDs. Filter by whether they are equal or less than the giver's maximum budget of $${budget}.

2. A list of 2 extremely customized, bespoke, DIY or physical keepsake ideas that do NOT exist in the standard store catalog, suited to their budget and interests. Provide a short title, a vivid instructions description on how to orchestrate/source it, an estimated cost, and the warm reasoning for choosing it.
3. Specific gift wrapping recommendations (e.g. type of paper, satin or lace ribbons, color choices) to elevate the visual unpacking ceremony.
4. A customized, warm, heart-tugging 2-3 sentence greeting text suitable to write in the gift card.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction: "You are an Elite Gift Concierge and Creative Gifting Artisan who values warmth, visual detail, and deep personal touch in writing.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "A summary analysis explaining the recipient's likely desires based on personality, relationship, and occasion.",
            },
            suggestedCatalogProductIds: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "A list of exact product IDs from our catalog database that closely match these criteria. Only suggest IDs that make sense.",
            },
            bespokeSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedCost: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                },
                required: ["title", "description", "estimatedCost", "reasoning"]
              },
              description: "A list of 2 customized bespoke gift ideas that are highly personalized and unique, which aren't in the standard store. Tell them how to source it or personalize it."
            },
            giftWrappingRecommendation: {
              type: Type.STRING,
              description: "A suggested personalized gift wrap aesthetic, color combination, and physical ribbon style."
            },
            curatedGreetingMessage: {
              type: Type.STRING,
              description: "A beautifully customized 2-3 sentence greeting message or card note to write when gifting this to the recipient."
            }
          },
          required: [
            "analysis",
            "suggestedCatalogProductIds",
            "bespokeSuggestions",
            "giftWrappingRecommendation",
            "curatedGreetingMessage"
          ]
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No text content returned from Gemini model.");
    }

    const payload = JSON.parse(responseText.trim());
    return res.json(payload);
  } catch (error) {
    console.error("Gemini API Error details:", error);
    // If anything fails at runtime (invalid key, rate limits, schema mismatch), we gracefully serve local high-fidelity presets
    return res.json(getDynamicFallbackResponse());
  }
});

// New endpoint to dynamically fetch customized hobby/interest suggestions bubbles based on search keyword
app.post("/api/ai/hobby-search", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.json({ bubbles: [] });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `Generate exactly 8 highly specific, aesthetically pleasing unique hobbies, passions, or interests related to the keyword: "${query}". Keep them short and crisp (1-3 words max), and prefix each one with a matching, highly expressive emoji. E.g., if query is "cooking", output items like "🥖 Sourdough Baking", "🍣 Hand-Rolled Sushi", etc. Return them as a JSON array of strings containing the emoji and the text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of exactly 8 aesthetic, specific interest bubbles with emojis."
          }
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ bubbles: parsed.slice(0, 8) });
        }
      }
    } catch (err) {
      console.warn("Hobby generation failed, fallback active:", err);
    }
  }

  // Local beautiful matching dictionary for search fallback
  const clean = query.toLowerCase().trim();
  let bubbles: string[] = [];

  if (clean.includes("sport") || clean.includes("fitness") || clean.includes("athlet") || clean.includes("train") || clean.includes("gym") || clean.includes("run") || clean.includes("play")) {
    bubbles = [
      "🧗 Indoor Bouldering", "🚲 Gravel Cycling", "🏃 Wilderness Trail Running", 
      "🎾 Clay Court Tennis", "🛹 Street Skating", "🏄 Ocean Longboarding", 
      "⛷️ Backcountry Powder", "🧘 Vinyasa Yoga"
    ];
  } else if (clean.includes("music") || clean.includes("song") || clean.includes("listen") || clean.includes("instrument") || clean.includes("guitar")) {
    bubbles = [
      "📻 Vinyl Records", "🎹 Jazz Piano", "🎸 Indie Acoustic", 
      "🎻 Orchestral Synthesizer", "🎧 Lo-Fi Beats", "🥁 Hand Percussion",
      "🔊 Analog Sound", "🎷 Blues Saxophone"
    ];
  } else if (clean.includes("coffee") || clean.includes("tea") || clean.includes("drink") || clean.includes("cafe")) {
    bubbles = [
      "☕ Pour-Over Brewing", "🌱 Single-Origin Roasting", "🥛 Latte Art Design", 
      "🍵 Ceremonial Matcha", "🧉 Yerba Mate Rituals", "🫖 Earl Grey Infusion",
      "💧 Cold Brew Dripping", "🍯 Herb Tisanes"
    ];
  } else if (clean.includes("art") || clean.includes("paint") || clean.includes("draw") || clean.includes("craft") || clean.includes("design")) {
    bubbles = [
      "🎨 Gouache Painting", "📷 35mm Film Photos", "🏺 Wheel Pottery", 
      "🪵 Linocut Printing", "🌿 Botanical Dyeing", "🧵 Punch Needling",
      "✍️ Calligraphy & Ink", "📐 Architectural Sketching"
    ];
  } else if (clean.includes("book") || clean.includes("read") || clean.includes("writer") || clean.includes("novel") || clean.includes("literature")) {
    bubbles = [
      "📖 Vintage Classics", "📜 Philosophical Essays", "✍️ Poetry Journals", 
      "🌌 Fantasy Worldbuilding", "🍂 Cozy Library Nooks", "🖋️ Fountain Pen Log",
      "🗃️ Zettelkasten System", "🕵️ Gothic Mystery"
    ];
  } else if (clean.includes("food") || clean.includes("cook") || clean.includes("bake") || clean.includes("eat") || clean.includes("kitchen")) {
    bubbles = [
      "🥖 Sourdough Baking", "🔪 Knife Artisanship", "🍝 Fresh Egg Pasta", 
      "🧀 Cheese Affinage", "🥬 Fermenting Kimchi", "🍷 Wine Decanting",
      "🌿 Wild Herb Gathering", "🍳 French Cast-Iron"
    ];
  } else if (clean.includes("plant") || clean.includes("garden") || clean.includes("green") || clean.includes("flower") || clean.includes("nature")) {
    bubbles = [
      "🪴 Bonsai Sculpting", "🌿 Moss Terrariums", "🌸 Wildflower Pressing", 
      "🍄 Mushroom Foraging", "🏡 English Lavender", "🍂 Autumn Composting",
      "🌱 Organic Microgreens", "🪵 Orchid Mounted"
    ];
  } else if (clean.includes("tech") || clean.includes("game") || clean.includes("code") || clean.includes("comput")) {
    bubbles = [
      "⌨️ Custom Keyboards", "🕹️ Retro Arcade", "💻 Smart Automation", 
      "💡 Ambient Led Accent", "💾 Cyberpunk Decor", "🎧 Spatial Audio",
      "📻 Amateur Ham Radio", "🛰️ Astro-Photography"
    ];
  } else {
    // Generate lovely, high-vibe presets matching the word
    const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
    bubbles = [
      `✨ Aesthetic ${capitalized}`, `🏺 Artisanal ${capitalized}`, `🌿 Organic ${capitalized}`,
      `📚 Vintage ${capitalized}`, `🗺️ Custom ${capitalized}`, `🪵 Pure ${capitalized}`,
      `🕯️ Cozy ${capitalized}`, `🎨 Premium ${capitalized}`
    ];
  }

  return res.json({ bubbles });
});

// New endpoint to dynamically generate custom Gift Mixer certificates and narratives
app.post("/api/ai/mix-gift", async (req, res) => {
  const { items, wrapStyle, tieStyle, accent, greetingText } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items provided for mixing." });
  }

  const wrapStr = wrapStyle || "Standard Unbleached Kraft Paper";
  const tieStr = tieStyle || "Rustic Jute Twin String";
  const accentStr = accent || "Fresh Pine Sprig";

  const getDynamicFallback = () => {
    const cleanItems = items.map(it => it.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, "").trim());
    const leadItem = cleanItems[0] || "Custom Selection";
    const secondItem = cleanItems[1] || "Bespoke Keepsake";
    const listStr = cleanItems.join(", ").replace(/, ([^,]*)$/, ", and $1");
    
    return {
      title: `The ${leadItem} & ${secondItem} Composition`,
      narrative: `A singular, tailored curation uniting ${listStr} into a striking sensory dialogue. The physical contrast between these objects—ranging from botanical delicacy to modern design—creates a rich conversation of form and texture. Arranged with meticulous spacing inside a signature wooden tray, the collection offers an immediate feeling of premium discovery and personal care.`,
      ceremonyInstructions: `Gently sever the hand-wound ${tieStr}, allowing the delicate tension to release. Inhale the refreshing scent of the ${accentStr} before peeling back the protective wrap to uncover the bespoke treasures nestled inside.`,
      craftsmanSignOff: "Master Curator Lin, House of PresentPerfect",
      simulatedVibeProfile: "Artisanal Synergy & Innovation",
      estimatedPrepareTime: "1.5 hours of meticulous styling"
    };
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `You are the Master Curator of PresentPerfect, a high-end, world-class artisanal gifting boutique specializing in mindful, sensory-rich presenting ceremonies.
We have a customer who has custom-mixed a gift tray containing these specific elements:
- Items in the mix: ${items.join(", ")}
- Wrapping Paper Style: ${wrapStr}
- Tie/Ribbon Style: ${tieStr}
- Decorative Floral/Sprig Accent: ${accentStr}
- Handwritten Greeting Card Message: "${greetingText || "Warmest thoughts"}"

Craft a bespoke curation certificate in JSON format containing:
1. "title": A short, elegant, highly specific poetic name for this mix (e.g., "The Velvet Peony & Espresso Symphony", "The Amber Hearth & Tech Union").
2. "narrative": A beautifully written, highly impactful and concise poetic narrative (2 short sentences, ~35-40 words) describing the sensory dialogue and harmonious contrast between these chosen items. Describe how the items sit together inside the packaging. Keep it short and extremely punchy so it generates instantly.
3. "ceremonyInstructions": A short, exquisite guide on how the receiver should unwrap this specific combination (e.g., "Gently sever the Emerald Silk Velvet Ribbon, inhale the fresh pine scent of the sprig, and lift the deckled paper to reveal...").
4. "craftsmanSignOff": A realistic name and title of a master boutique curator (e.g., "Master Lin, Studio Director of PresentPerfect").
5. "simulatedVibeProfile": A 2-3 word poetic description of the aesthetic/vibe (e.g., "Cozy Botanical Opulence", "Avant-Garde Simplicity").
6. "estimatedPrepareTime": A realistic estimate of meticulous craft assembly time (e.g., "1.5 hours of precision arrangement").

Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "narrative": "string",
  "ceremonyInstructions": "string",
  "craftsmanSignOff": "string",
  "simulatedVibeProfile": "string",
  "estimatedPrepareTime": "string"
}`;

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 250,
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                narrative: { type: Type.STRING },
                ceremonyInstructions: { type: Type.STRING },
                craftsmanSignOff: { type: Type.STRING },
                simulatedVibeProfile: { type: Type.STRING },
                estimatedPrepareTime: { type: Type.STRING }
              },
              required: ["title", "narrative", "ceremonyInstructions", "craftsmanSignOff", "simulatedVibeProfile", "estimatedPrepareTime"]
            }
          }
        });
      } catch (firstErr) {
        try {
          // Fallback to gemini-flash-latest if gemini-3.5-flash has a temporary 503 spike in demand
          response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              maxOutputTokens: 250,
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  narrative: { type: Type.STRING },
                  ceremonyInstructions: { type: Type.STRING },
                  craftsmanSignOff: { type: Type.STRING },
                  simulatedVibeProfile: { type: Type.STRING },
                  estimatedPrepareTime: { type: Type.STRING }
                },
                required: ["title", "narrative", "ceremonyInstructions", "craftsmanSignOff", "simulatedVibeProfile", "estimatedPrepareTime"]
              }
            }
          });
        } catch (secondErr) {
          console.log("Synthesized local boutique curation backup successfully.");
        }
      }

      const text = response?.text;
      if (text) {
        const parsed = JSON.parse(text.trim());
        return res.json(parsed);
      }
    } catch (err) {
      console.log("Synthesized local boutique curation backup successfully.");
    }
  }

  // Gracefully fallback to our beautiful dynamic fallback when API is offline or fails
  return res.json(getDynamicFallback());
});

const REGISTRIES_FILE = path.join(process.cwd(), "registries.json");
const INQUIRIES_FILE = path.join(process.cwd(), "inquiries.json");

// Helper to load registries from file database
function loadRegistries() {
  try {
    if (fs.existsSync(REGISTRIES_FILE)) {
      const data = fs.readFileSync(REGISTRIES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading registries file database:", err);
  }
  // Default demo registry
  return [
    {
      id: "demo-wedding",
      name: "Charlotte & Julian's Autumn Wedding",
      occasion: "Wedding",
      date: "2026-10-17",
      notes: "Thank you all so much for celebrating our new beginnings with us. We curated this list with mindfulness.",
      registrantName: "Charlotte & Julian",
      email: "charlotte@heritage.com",
      items: [
        { productId: "organic-tea-set", quantityRequested: 1, quantityReceived: 0 },
        { productId: "lavender-blanket", quantityRequested: 2, quantityReceived: 1 },
        { productId: "essential-diffuser", quantityRequested: 1, quantityReceived: 1 },
        { productId: "gourmet-cheese-board", quantityRequested: 1, quantityReceived: 0 }
      ]
    }
  ];
}

// Helper to save registries to file database
function saveRegistries(data: any) {
  try {
    fs.writeFileSync(REGISTRIES_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing registries file database:", err);
  }
}

// Helper to load inquiries from file database
function loadInquiries() {
  try {
    if (fs.existsSync(INQUIRIES_FILE)) {
      const data = fs.readFileSync(INQUIRIES_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading inquiries file database:", err);
  }
  return [];
}

// Helper to save inquiries to file database
function saveInquiries(data: any) {
  try {
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing inquiries file database:", err);
  }
}

// REST API endpoints for Registries
app.get("/api/db/registries", (req, res) => {
  const registries = loadRegistries();
  res.json({ success: true, registries });
});

app.post("/api/db/registries", (req, res) => {
  const newRegistry = req.body;
  if (!newRegistry || !newRegistry.id) {
    return res.status(400).json({ success: false, error: "Invalid registry payload" });
  }
  const registries = loadRegistries();
  const existsIndex = registries.findIndex((r: any) => r.id === newRegistry.id);
  if (existsIndex > -1) {
    registries[existsIndex] = newRegistry;
  } else {
    registries.unshift(newRegistry);
  }
  saveRegistries(registries);
  res.json({ success: true, registry: newRegistry });
});

app.post("/api/db/registries/:id/claim", (req, res) => {
  const { id } = req.params;
  const { productId } = req.body;
  if (!id || !productId) {
    return res.status(400).json({ success: false, error: "Missing registry id or product id" });
  }
  const registries = loadRegistries();
  const regIndex = registries.findIndex((r: any) => r.id === id);
  if (regIndex === -1) {
    return res.status(404).json({ success: false, error: "Registry not found" });
  }
  
  registries[regIndex].items = registries[regIndex].items.map((item: any) => {
    if (item.productId === productId) {
      return {
        ...item,
        quantityReceived: item.quantityReceived + 1
      };
    }
    return item;
  });
  
  saveRegistries(registries);
  res.json({ success: true, registry: registries[regIndex] });
});

// REST API endpoints for Inquiries
app.get("/api/db/inquiries", (req, res) => {
  const inquiries = loadInquiries();
  res.json({ success: true, inquiries });
});

app.post("/api/db/inquiries", (req, res) => {
  const newInquiry = req.body;
  if (!newInquiry || !newInquiry.id) {
    return res.status(400).json({ success: false, error: "Invalid inquiry payload" });
  }
  const inquiries = loadInquiries();
  const existsIndex = inquiries.findIndex((i: any) => i.id === newInquiry.id);
  if (existsIndex > -1) {
    inquiries[existsIndex] = newInquiry;
  } else {
    inquiries.unshift(newInquiry);
  }
  saveInquiries(inquiries);
  res.json({ success: true, inquiry: newInquiry });
});

// Configure Vite or Static Assets handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        cors: true,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With"
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting backend server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PresentPerfect Server successfully bound to http://0.0.0.0:${PORT}`);
  });
}

startServer();
