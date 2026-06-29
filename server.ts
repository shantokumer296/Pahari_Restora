import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Query } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { Profile, FoodItem, Order, ContactMessage, OrderStatus, Coupon } from "./src/types";

// Load Environment Variables
dotenv.config();

const PORT = 3000;

// SMTP dynamic settings resolver
function getSmtpSettings() {
  if (localData && localData.smtp_settings && localData.smtp_settings.isConfigured) {
    return {
      host: localData.smtp_settings.host,
      port: localData.smtp_settings.port ? parseInt(localData.smtp_settings.port, 10) : 587,
      user: localData.smtp_settings.user,
      pass: localData.smtp_settings.pass,
      from: localData.smtp_settings.from || `"Pahari Restora" <noreply@pahari-restora.com>`
    };
  }
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || `"Pahari Restora" <noreply@pahari-restora.com>`
  };
}

// SMTP verification email sender helper
async function sendRealVerificationEmail(email: string, otpCode: string, name: string): Promise<boolean> {
  const { host, port, user, pass, from } = getSmtpSettings();

  if (!host || !user || !pass) {
    console.warn("⚠️ [SMTP] SMTP_HOST, SMTP_USER, or SMTP_PASS not defined. Falling back to log simulation.");
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; border-bottom: 2px solid #f4f4f5; padding-bottom: 20px; margin-bottom: 25px;">
          <h1 style="color: #78350f; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; font-family: serif;">🌄 Pahari Restora</h1>
          <p style="color: #78716c; margin: 6px 0 0 0; font-size: 14px; text-transform: uppercase; tracking-widest: 0.05em; font-weight: 600;">Traditional Hill Tracts Culinary Heritage</p>
        </div>
        <div style="padding: 10px 0;">
          <h2 style="color: #1c1917; font-size: 20px; margin-top: 0; font-weight: 700;">Welcome, ${name}!</h2>
          <p style="color: #44403c; font-size: 15px; line-height: 1.6;">
            Thank you for signing up with Pahari Restora. To complete your registration and verify your email address, please use the following secure 6-digit verification code:
          </p>
          <div style="text-align: center; margin: 35px 0; padding: 20px; background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 12px;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 0.25em; color: #78350f;">${otpCode}</span>
          </div>
          <p style="color: #78716c; font-size: 13px; line-height: 1.5;">
            This verification code is valid for exactly 10 minutes. If you did not request this registration, please ignore this email or reach out to our team.
          </p>
        </div>
        <div style="margin-top: 35px; border-top: 1px solid #f5f5f4; padding-top: 20px; text-align: center; color: #a8a29e; font-size: 12px; line-height: 1.4;">
          <p style="margin: 0; font-weight: 600;">&copy; ${new Date().getFullYear()} Pahari Restora. All rights reserved.</p>
          <p style="margin: 4px 0 0 0;">Authentic Bangladeshi & Hill Tracts Cuisines, Chittagong, Bangladesh.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: email,
      subject: `🔑 Verify your Email - Pahari Restora Code: ${otpCode}`,
      text: `Welcome ${name}! Your Pahari Restora verification code is ${otpCode}. It is valid for 10 minutes.`,
      html: htmlContent,
    });

    console.log(`✉️ [SMTP] Verification email successfully sent to real inbox: ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ [SMTP] Failed to send email to ${email}:`, err);
    return false;
  }
}

console.log("🔥 FIREBASE MODE: Running with Cloud Firestore persistence.");

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: "charismatic-octagon-4l9np"
  });
}

const firestore = getFirestore("ai-studio-paharirestora-89510a3d-9a0e-476f-b07c-7e6235530c9d");

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Password hashing and verification
const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return { hash, salt };
};

const verifyPassword = (password: string, salt: string, hash: string) => {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return testHash === hash;
};

// Seed Food Items
const SEED_FOOD_ITEMS: FoodItem[] = [
  {
    id: "seed-1",
    name: "Chicken Kacchi Biryani",
    description: "Aromatic basmati rice slow-cooked with tender marinated chicken, potato, and direct hillside spices.",
    price: 240,
    category: "Rice & Curry",
    imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-2",
    name: "Spicy Beef Bhuna",
    description: "Tender chunks of beef dry-cooked with thick caramelized onions, ginger, garlic, and special Pahari hot peppers.",
    price: 290,
    category: "Main Course",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-3",
    name: "Smoky Chicken Grilled Platter",
    description: "Full quarter chicken marinated in local herbs, charred to charcoal perfection, served with house salad and mint sauce.",
    price: 320,
    category: "Grilled",
    imageUrl: "https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-4",
    name: "Traditional Pahari Bamboo Chicken",
    description: "Exquisite tribal delicacy - chicken pieces stuffed in raw bamboo shoots with hill herbs and slow-cooked over firewood.",
    price: 380,
    category: "Bangladeshi Specials",
    imageUrl: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-5",
    name: "Pahari Ruhi Fish Fry",
    description: "Fresh river Ruhi fish coated in crispy turmeric-chili crust, shallow fried with mustard oil and green chilies.",
    price: 220,
    category: "Bangladeshi Specials",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-6",
    name: "Butter Paratha with Egg Bhurji",
    description: "Multi-layered crispy paratha pan-fried in pure ghee, served with double egg scrambled with spices.",
    price: 90,
    category: "Snacks",
    imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-7",
    name: "Chilled Sweet Mango Lassi",
    description: "Thick creamy yogurt blended with sweet ripe mangoes and saffron essence.",
    price: 80,
    category: "Drinks",
    imageUrl: "https://images.unsplash.com/photo-1571115177098-24ec4209e548?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "seed-8",
    name: "Hill Country Lemon Sherbet",
    description: "Freshly squeezed hill lime juice served with mint, black salt, and absolute cold splash.",
    price: 50,
    category: "Drinks",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600",
    isAvailable: true,
    createdAt: new Date().toISOString()
  }
];

// --- DUAL-PERSISTENCE RESILIENT ENGINE (FIRESTORE + LOCAL FALLBACK) ---

interface LocalDbSchema {
  profiles: Profile[];
  food_items: FoodItem[];
  orders: Order[];
  coupons: Coupon[];
  contact_messages: ContactMessage[];
  otps: { [email: string]: { email: string; code: string; expires: number; profileData: any } };
  sessions: { [token: string]: { token: string; userId: string } };
  admin_sessions: { [token: string]: { token: string; isLoggedIn: boolean } };
  smtp_settings?: {
    host: string;
    port: string;
    user: string;
    pass: string;
    from: string;
    isConfigured: boolean;
  };
}

const LOCAL_DB_PATH = path.join(process.cwd(), "db.json");

let localData: LocalDbSchema = {
  profiles: [],
  food_items: [...SEED_FOOD_ITEMS],
  orders: [],
  coupons: [],
  contact_messages: [],
  otps: {},
  sessions: {},
  admin_sessions: {},
  smtp_settings: undefined
};

// Syncing and loading utilities for the local DB
const loadLocalDb = () => {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, "utf8");
      const parsed = JSON.parse(content);
      localData = {
        profiles: parsed.profiles || [],
        food_items: parsed.food_items && parsed.food_items.length > 0 ? parsed.food_items : [...SEED_FOOD_ITEMS],
        orders: parsed.orders || [],
        coupons: parsed.coupons || [],
        contact_messages: parsed.contact_messages || [],
        otps: parsed.otps || {},
        sessions: parsed.sessions || {},
        admin_sessions: parsed.admin_sessions || {},
        smtp_settings: parsed.smtp_settings || undefined
      };
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.error("⚠️ [LocalDB] Error loading fallback database:", err);
  }
};

const saveLocalDb = () => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localData, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ [LocalDB] Error saving fallback database:", err);
  }
};

// Initialize the local database on startup
loadLocalDb();

// Resilient execution wrapper
async function runWithFallback<T>(
  firestoreOp: () => Promise<T>,
  localOp: () => T | Promise<T>
): Promise<T> {
  try {
    return await firestoreOp();
  } catch (err: any) {
    const errMsg = err.message || String(err);
    if (
      errMsg.includes("PERMISSION_DENIED") ||
      errMsg.includes("Missing or insufficient permissions") ||
      errMsg.includes("5 NOT_FOUND") ||
      errMsg.includes("API has not been used") ||
      errMsg.includes("disabled") ||
      errMsg.includes("7")
    ) {
      console.warn("⚠️ [Firestore] Permission or setup block detected. Seamlessly using local storage.");
      return await localOp();
    }
    console.warn("⚠️ [Firestore] Unhandled error:", errMsg, ". Falling back to local storage.");
    return await localOp();
  }
}

const DB = {
  profiles: {
    async findByEmail(email: string): Promise<Profile | null> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("profiles")
            .where("email", "==", email.toLowerCase())
            .limit(1)
            .get();
          if (snap.empty) return null;
          return snap.docs[0].data() as Profile;
        },
        () => {
          return localData.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
        }
      );
    },
    async findById(id: string): Promise<Profile | null> {
      return runWithFallback(
        async () => {
          const doc = await firestore.collection("profiles").doc(id).get();
          if (!doc.exists) return null;
          return doc.data() as Profile;
        },
        () => {
          return localData.profiles.find(p => p.id === id) || null;
        }
      );
    },
    async insert(profile: Profile): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("profiles").doc(profile.id).set(profile);
        },
        () => {
          const idx = localData.profiles.findIndex(p => p.id === profile.id);
          if (idx >= 0) localData.profiles[idx] = profile;
          else localData.profiles.push(profile);
          saveLocalDb();
        }
      );
    },
    async updateBanStatus(id: string, isBanned: boolean): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("profiles").doc(id).update({ isBanned });
        },
        () => {
          const p = localData.profiles.find(p => p.id === id);
          if (p) {
            p.isBanned = isBanned;
            saveLocalDb();
          }
        }
      );
    },
    async delete(id: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("profiles").doc(id).delete();
        },
        () => {
          localData.profiles = localData.profiles.filter(p => p.id !== id);
          saveLocalDb();
        }
      );
    },
    async getAll(): Promise<Profile[]> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("profiles").get();
          const items = snap.docs.map(doc => doc.data() as Profile);
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        },
        () => {
          return [...localData.profiles].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      );
    }
  },

  foodItems: {
    async getAll(onlyAvailable = false): Promise<FoodItem[]> {
      return runWithFallback(
        async () => {
          let ref: Query = firestore.collection("food_items");
          if (onlyAvailable) {
            ref = ref.where("isAvailable", "==", true);
          }
          const snap = await ref.get();
          const items = snap.docs.map(doc => doc.data() as FoodItem);
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        },
        () => {
          let items = [...localData.food_items];
          if (onlyAvailable) {
            items = items.filter(i => i.isAvailable);
          }
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      );
    },
    async findById(id: string): Promise<FoodItem | null> {
      return runWithFallback(
        async () => {
          const doc = await firestore.collection("food_items").doc(id).get();
          if (!doc.exists) return null;
          return doc.data() as FoodItem;
        },
        () => {
          return localData.food_items.find(i => i.id === id) || null;
        }
      );
    },
    async insert(item: FoodItem): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("food_items").doc(item.id).set(item);
        },
        () => {
          const idx = localData.food_items.findIndex(i => i.id === item.id);
          if (idx >= 0) localData.food_items[idx] = item;
          else localData.food_items.push(item);
          saveLocalDb();
        }
      );
    },
    async update(id: string, updateData: Partial<FoodItem>): Promise<FoodItem> {
      return runWithFallback(
        async () => {
          const docRef = firestore.collection("food_items").doc(id);
          await docRef.update(updateData);
          const doc = await docRef.get();
          return doc.data() as FoodItem;
        },
        () => {
          const item = localData.food_items.find(i => i.id === id);
          if (!item) throw new Error("Item not found");
          Object.assign(item, updateData);
          saveLocalDb();
          return item;
        }
      );
    },
    async delete(id: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("food_items").doc(id).delete();
        },
        () => {
          localData.food_items = localData.food_items.filter(i => i.id !== id);
          saveLocalDb();
        }
      );
    }
  },

  orders: {
    async getAll(): Promise<Order[]> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("orders").get();
          const items = snap.docs.map(doc => doc.data() as Order);
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        },
        () => {
          return [...localData.orders].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      );
    },
    async getByUserId(userId: string): Promise<Order[]> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("orders").where("userId", "==", userId).get();
          const items = snap.docs.map(doc => doc.data() as Order);
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        },
        () => {
          return localData.orders.filter(o => o.userId === userId).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      );
    },
    async insert(order: Order): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("orders").doc(order.id).set(order);
        },
        () => {
          const idx = localData.orders.findIndex(o => o.id === order.id);
          if (idx >= 0) localData.orders[idx] = order;
          else localData.orders.push(order);
          saveLocalDb();
        }
      );
    },
    async updateStatusAndResponse(id: string, status?: string, adminResponse?: string): Promise<Order> {
      return runWithFallback(
        async () => {
          const docRef = firestore.collection("orders").doc(id);
          const updateData: any = {};
          if (status) updateData.status = status;
          if (adminResponse !== undefined) updateData.adminResponse = adminResponse;
          await docRef.update(updateData);
          const doc = await docRef.get();
          return doc.data() as Order;
        },
        () => {
          const order = localData.orders.find(o => o.id === id);
          if (!order) throw new Error("Order not found");
          if (status) order.status = status as OrderStatus;
          if (adminResponse !== undefined) order.adminResponse = adminResponse;
          saveLocalDb();
          return order;
        }
      );
    }
  },

  contactMessages: {
    async getAll(): Promise<ContactMessage[]> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("contact_messages").get();
          const items = snap.docs.map(doc => doc.data() as ContactMessage);
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        },
        () => {
          return [...localData.contact_messages].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      );
    },
    async insert(msg: ContactMessage): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("contact_messages").doc(msg.id).set(msg);
        },
        () => {
          const idx = localData.contact_messages.findIndex(m => m.id === msg.id);
          if (idx >= 0) localData.contact_messages[idx] = msg;
          else localData.contact_messages.push(msg);
          saveLocalDb();
        }
      );
    },
    async updateResponse(id: string, adminResponse: string): Promise<ContactMessage> {
      return runWithFallback(
        async () => {
          const docRef = firestore.collection("contact_messages").doc(id);
          await docRef.update({ adminResponse });
          const doc = await docRef.get();
          return doc.data() as ContactMessage;
        },
        () => {
          const msg = localData.contact_messages.find(m => m.id === id);
          if (!msg) throw new Error("Message not found");
          msg.adminResponse = adminResponse;
          saveLocalDb();
          return msg;
        }
      );
    }
  },

  coupons: {
    async getAll(): Promise<Coupon[]> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("coupons").get();
          const items = snap.docs.map(doc => doc.data() as Coupon);
          return items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        },
        () => {
          return [...localData.coupons].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
      );
    },
    async findByCode(code: string): Promise<Coupon | null> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("coupons").where("code", "==", code.toUpperCase()).get();
          if (snap.empty) return null;
          return snap.docs[0].data() as Coupon;
        },
        () => {
          return localData.coupons.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
        }
      );
    },
    async insert(coupon: Coupon): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("coupons").doc(coupon.id).set(coupon);
        },
        () => {
          const idx = localData.coupons.findIndex(c => c.id === coupon.id);
          if (idx >= 0) localData.coupons[idx] = coupon;
          else localData.coupons.push(coupon);
          saveLocalDb();
        }
      );
    },
    async update(id: string, updateData: Partial<Coupon>): Promise<Coupon> {
      return runWithFallback(
        async () => {
          const docRef = firestore.collection("coupons").doc(id);
          await docRef.update(updateData);
          const doc = await docRef.get();
          return doc.data() as Coupon;
        },
        () => {
          const coupon = localData.coupons.find(c => c.id === id);
          if (!coupon) throw new Error("Coupon not found");
          Object.assign(coupon, updateData);
          saveLocalDb();
          return coupon;
        }
      );
    },
    async delete(id: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("coupons").doc(id).delete();
        },
        () => {
          localData.coupons = localData.coupons.filter(c => c.id !== id);
          saveLocalDb();
        }
      );
    },
    async incrementUsage(code: string): Promise<void> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("coupons").where("code", "==", code.toUpperCase()).get();
          if (!snap.empty) {
            const docRef = snap.docs[0].ref;
            const current = snap.docs[0].data() as Coupon;
            await docRef.update({ usageCount: (current.usageCount || 0) + 1 });
          }
        },
        () => {
          const coupon = localData.coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
          if (coupon) {
            coupon.usageCount = (coupon.usageCount || 0) + 1;
            saveLocalDb();
          }
        }
      );
    }
  },

  otps: {
    async get(email: string): Promise<any | null> {
      return runWithFallback(
        async () => {
          const doc = await firestore.collection("otps").doc(email.toLowerCase()).get();
          if (!doc.exists) return null;
          return doc.data();
        },
        () => {
          return localData.otps[email.toLowerCase()] || null;
        }
      );
    },
    async set(email: string, code: string, expires: number, profileData: any): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("otps").doc(email.toLowerCase()).set({
            code, expires, profileData
          });
        },
        () => {
          localData.otps[email.toLowerCase()] = { email: email.toLowerCase(), code, expires, profileData };
          saveLocalDb();
        }
      );
    },
    async delete(email: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("otps").doc(email.toLowerCase()).delete();
        },
        () => {
          delete localData.otps[email.toLowerCase()];
          saveLocalDb();
        }
      );
    }
  },

  sessions: {
    async get(token: string): Promise<string | null> {
      return runWithFallback(
        async () => {
          const doc = await firestore.collection("sessions").doc(token).get();
          if (!doc.exists) return null;
          return doc.data()?.userId || null;
        },
        () => {
          return localData.sessions[token]?.userId || null;
        }
      );
    },
    async create(token: string, userId: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("sessions").doc(token).set({ token, userId });
        },
        () => {
          localData.sessions[token] = { token, userId };
          saveLocalDb();
        }
      );
    },
    async delete(token: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("sessions").doc(token).delete();
        },
        () => {
          delete localData.sessions[token];
          saveLocalDb();
        }
      );
    },
    async deleteByUserId(userId: string): Promise<void> {
      return runWithFallback(
        async () => {
          const snap = await firestore.collection("sessions").where("userId", "==", userId).get();
          if (!snap.empty) {
            const batch = firestore.batch();
            snap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
          }
        },
        () => {
          for (const token of Object.keys(localData.sessions)) {
            if (localData.sessions[token].userId === userId) {
              delete localData.sessions[token];
            }
          }
          saveLocalDb();
        }
      );
    }
  },

  adminSessions: {
    async create(token: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("admin_sessions").doc(token).set({ token, isLoggedIn: true });
        },
        () => {
          localData.admin_sessions[token] = { token, isLoggedIn: true };
          saveLocalDb();
        }
      );
    },
    async check(token: string): Promise<boolean> {
      return runWithFallback(
        async () => {
          const doc = await firestore.collection("admin_sessions").doc(token).get();
          return doc.exists;
        },
        () => {
          return !!localData.admin_sessions[token]?.isLoggedIn;
        }
      );
    },
    async delete(token: string): Promise<void> {
      return runWithFallback(
        async () => {
          await firestore.collection("admin_sessions").doc(token).delete();
        },
        () => {
          delete localData.admin_sessions[token];
          saveLocalDb();
        }
      );
    }
  }
};

// --- AUTOMATIC FIREBASE FOOD CATALOG SEEDING ---
async function seedFirestoreIfNeeded() {
  try {
    const snap = await firestore.collection("food_items").limit(1).get();
    if (snap.empty) {
      console.log("🚀 Firestore food_items collection is empty. Auto-seeding catalog...");
      const batch = firestore.batch();
      for (const item of SEED_FOOD_ITEMS) {
        const ref = firestore.collection("food_items").doc(item.id);
        batch.set(ref, item);
      }
      await batch.commit();
      console.log("🟢 Successfully seeded all traditional items in Firestore!");
    } else {
      console.log("🟢 Firestore food_items are already initialized.");
    }
  } catch (err) {
    console.warn("ℹ️ Firestore is currently not writeable (due to project permission setup). The application is fully functional and running on the local JSON fallback (db.json).");
  }
}

// Trigger asynchronous seeding
seedFirestoreIfNeeded();

// --- SERVER IMPLEMENTATION ---
async function startServer() {
  const app = express();
  app.use(express.json());

  // --- AUTH MIDDLEWARE ---
  const getUserIdFromReq = async (req: express.Request): Promise<string | null> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    return await DB.sessions.get(token);
  };

  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const userId = await getUserIdFromReq(req);
      if (!userId) {
        res.status(401).json({ error: "Please sign in to proceed." });
        return;
      }
      const profile = await DB.profiles.findById(userId);
      if (!profile) {
        res.status(401).json({ error: "Profile not found." });
        return;
      }
      if (profile.isBanned) {
        res.status(403).json({ error: "Your account has been suspended. Please contact support." });
        return;
      }
      (req as any).userId = userId;
      (req as any).user = profile;
      next();
    } catch (err) {
      console.error("requireAuth failure:", err);
      res.status(500).json({ error: "Internal security authorization failure." });
    }
  };

  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized access." });
        return;
      }
      const token = authHeader.split(" ")[1];
      const isValid = await DB.adminSessions.check(token);
      if (!isValid) {
        res.status(401).json({ error: "Invalid admin session." });
        return;
      }
      next();
    } catch (err) {
      console.error("requireAdmin failure:", err);
      res.status(500).json({ error: "Internal administrative validation failure." });
    }
  };

  // --- API ROUTES ---

  // Connection Status endpoint for developer UI
  app.get("/api/supabase-status", (req, res) => {
    res.json({
      isEnabled: false,
      url: null
    });
  });

  // Auth: Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, mobile, password } = req.body;
      if (!name || !email || !mobile || !password) {
        res.status(400).json({ error: "All fields are required." });
        return;
      }

      const existingUser = await DB.profiles.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ error: "Email is already registered." });
        return;
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 mins

      await DB.otps.set(email, otpCode, expires, { name, email, mobile, password });

      console.log(`[AUTH] OTP for ${email}: ${otpCode}`);

      const wasSent = await sendRealVerificationEmail(email, otpCode, name);

      res.json({
        success: true,
        message: wasSent 
          ? "Verification code has been sent to your real email address. Please check your inbox/spam folder."
          : "Verification code simulated and logged. (Provide SMTP_HOST, SMTP_USER, SMTP_PASS in environment settings for real delivery)",
        smtpConfigured: wasSent,
        otpCode: wasSent ? undefined : otpCode // Only provide otpCode in response if SMTP is not configured
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "An error occurred during signup." });
    }
  });

  // Auth: Verify OTP
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        res.status(400).json({ error: "Email and verification code are required." });
        return;
      }

      const otpRecord = await DB.otps.get(email);
      if (!otpRecord) {
        res.status(400).json({ error: "No pending verification found for this email." });
        return;
      }

      if (Date.now() > otpRecord.expires) {
        await DB.otps.delete(email);
        res.status(400).json({ error: "Verification code has expired. Please sign up again." });
        return;
      }

      if (otpRecord.code !== code) {
        res.status(400).json({ error: "Invalid verification code." });
        return;
      }

      // Save profile
      const userId = generateId();
      const { hash, salt } = hashPassword(otpRecord.profileData.password);
      const newProfile: Profile = {
        id: userId,
        name: otpRecord.profileData.name,
        email: otpRecord.profileData.email.toLowerCase(),
        mobile: otpRecord.profileData.mobile,
        emailVerified: true,
        isBanned: false,
        createdAt: new Date().toISOString(),
        passwordHash: hash,
        salt: salt
      };

      await DB.profiles.insert(newProfile);
      await DB.otps.delete(email);

      // Generate Session Token
      const token = "usr_" + generateId() + generateId();
      await DB.sessions.create(token, userId);

      res.json({
        success: true,
        token,
        profile: newProfile
      });
    } catch (err) {
      console.error("Verify OTP error:", err);
      res.status(500).json({ error: "Verification failed." });
    }
  });

  // Auth: Signin
  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const profile = await DB.profiles.findByEmail(email);
      if (!profile) {
        res.status(400).json({ error: "Invalid credentials." });
        return;
      }

      if (profile.isBanned) {
        res.status(403).json({ error: "Your account has been suspended. Please contact support." });
        return;
      }

      // Verify secure password hash
      if (profile.passwordHash && profile.salt) {
        if (!verifyPassword(password, profile.salt, profile.passwordHash)) {
          res.status(400).json({ error: "Invalid credentials." });
          return;
        }
      } else {
        res.status(400).json({ error: "Secure credentials not set for this account." });
        return;
      }

      // Generate Session Token
      const token = "usr_" + generateId() + generateId();
      await DB.sessions.create(token, profile.id);

      res.json({
        success: true,
        token,
        profile
      });
    } catch (err) {
      console.error("Signin error:", err);
      res.status(500).json({ error: "Authentication failed." });
    }
  });

  // Auth: Me
  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = await getUserIdFromReq(req);
      if (!userId) {
        res.status(401).json({ error: "Not signed in." });
        return;
      }
      const profile = await DB.profiles.findById(userId);
      if (!profile) {
        res.status(401).json({ error: "Profile not found." });
        return;
      }
      if (profile.isBanned) {
        res.status(403).json({ error: "Your account has been suspended." });
        return;
      }
      res.json({ profile });
    } catch (err) {
      console.error("Auth Me error:", err);
      res.status(500).json({ error: "Session validation failed." });
    }
  });

  // Menu: Get all available menu items
  app.get("/api/menu", async (req, res) => {
    try {
      const items = await DB.foodItems.getAll(true);
      res.json({ items });
    } catch (err) {
      console.error("Get menu error:", err);
      res.status(500).json({ error: "Failed to retrieve menu catalog." });
    }
  });

  // Contact: Submit message
  app.post("/api/contacts", async (req, res) => {
    try {
      const { name, email, mobile, message } = req.body;
      if (!name || !email || !message) {
        res.status(400).json({ error: "Name, email, and message are required." });
        return;
      }

      const newMessage: ContactMessage = {
        id: "msg_" + generateId(),
        name,
        email,
        mobile,
        message,
        createdAt: new Date().toISOString()
      };

      await DB.contactMessages.insert(newMessage);

      res.json({ success: true, message: "Thank you! Your message has been sent successfully." });
    } catch (err) {
      console.error("Create contact error:", err);
      res.status(500).json({ error: "Failed to save feedback contact." });
    }
  });

  // Orders: Place order
  app.post("/api/orders", requireAuth, async (req: any, res) => {
    try {
      const { items, totalAmount, deliveryAddress, specialInstructions, paymentMethod, bkashNumber, transactionId, appliedCoupon, discountAmount } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
        res.status(400).json({ error: "Cart items and delivery address are required." });
        return;
      }

      if (paymentMethod === "bKash" && (!bkashNumber || !transactionId)) {
        res.status(400).json({ error: "For bKash payment, please provide both your bKash Mobile Number and Transaction ID." });
        return;
      }

      const finalAmount = totalAmount || items.reduce((sum, i) => sum + (i.price * i.qty), 0) + 20; // subtotal + 20 delivery

      const newOrder: Order = {
        id: "ord_" + Math.floor(100000 + Math.random() * 900000).toString(),
        userId: req.userId,
        userName: req.user.name,
        userEmail: req.user.email,
        userMobile: req.user.mobile,
        items,
        totalAmount: finalAmount,
        deliveryAddress,
        status: "Pending",
        paymentMethod: paymentMethod || "Cash on Delivery",
        bkashNumber: paymentMethod === "bKash" ? bkashNumber : undefined,
        transactionId: paymentMethod === "bKash" ? transactionId : undefined,
        appliedCoupon: appliedCoupon || undefined,
        discountAmount: discountAmount ? Number(discountAmount) : undefined,
        createdAt: new Date().toISOString()
      };

      if (specialInstructions) {
        newOrder.adminResponse = `Special instructions: ${specialInstructions}`;
      }

      await DB.orders.insert(newOrder);

      if (appliedCoupon) {
        await DB.coupons.incrementUsage(appliedCoupon);
      }

      res.json({ success: true, order: newOrder });
    } catch (err) {
      console.error("Create order error:", err);
      res.status(500).json({ error: "Failed to record purchase transaction." });
    }
  });

  // Orders: Get my orders
  app.get("/api/orders/my", requireAuth, async (req: any, res) => {
    try {
      const orders = await DB.orders.getByUserId(req.userId);
      res.json({ orders });
    } catch (err) {
      console.error("Get my orders error:", err);
      res.status(500).json({ error: "Failed to load purchase history." });
    }
  });

  // Coupons: Validate a coupon code
  app.post("/api/coupons/validate", requireAuth, async (req: any, res) => {
    try {
      const { code, orderAmount } = req.body;
      if (!code) {
        res.status(400).json({ error: "Coupon code is required." });
        return;
      }

      const coupon = await DB.coupons.findByCode(code);
      if (!coupon) {
        res.status(400).json({ error: "Invalid coupon code." });
        return;
      }

      if (!coupon.isActive) {
        res.status(400).json({ error: "This coupon is currently inactive." });
        return;
      }

      // Check Expiry Date
      const today = new Date();
      today.setHours(0,0,0,0);
      const expiry = new Date(coupon.expiryDate);
      expiry.setHours(0,0,0,0);
      if (today > expiry) {
        res.status(400).json({ error: "This coupon has expired." });
        return;
      }

      // Check Minimum Order Amount
      if (orderAmount < coupon.minOrderAmount) {
        res.status(400).json({ error: `Minimum order of ৳${coupon.minOrderAmount} is required to apply this coupon.` });
        return;
      }

      // Check Usage Limit
      if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
        res.status(400).json({ error: "This coupon has reached its usage limit." });
        return;
      }

      // Check if already used by this user
      const userOrders = await DB.orders.getByUserId(req.userId);
      const couponUsed = userOrders.some(order => order.status !== "Cancelled" && order.appliedCoupon?.toUpperCase() === code.toUpperCase());
      if (couponUsed) {
        res.status(400).json({ error: "You have already used this coupon." });
        return;
      }

      // Calculate Discount
      let discountAmount = 0;
      if (coupon.discountType === "flat") {
        discountAmount = coupon.discountValue;
      } else if (coupon.discountType === "percentage") {
        discountAmount = Math.round((orderAmount * coupon.discountValue) / 100);
      }

      if (discountAmount > orderAmount) {
        discountAmount = orderAmount;
      }

      res.json({
        success: true,
        couponCode: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        newTotal: orderAmount - discountAmount
      });
    } catch (err) {
      console.error("Coupon validation error:", err);
      res.status(500).json({ error: "Failed to validate coupon." });
    }
  });


  // --- ADMIN API ENDPOINTS ---

  // Admin Auth: Login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (email === "paharirestoraandfastfood@gmail.com" && password === "PahariRestora-2120") {
        const token = "adm_" + generateId() + generateId();
        await DB.adminSessions.create(token);
        res.json({ success: true, token });
      } else {
        res.status(401).json({ error: "Invalid admin email or password." });
      }
    } catch (err) {
      console.error("Admin login error:", err);
      res.status(500).json({ error: "Admin signin system error." });
    }
  });

  // Admin Auth: Check Session
  app.get("/api/admin/check", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.json({ loggedIn: false });
        return;
      }
      const token = authHeader.split(" ")[1];
      const loggedIn = await DB.adminSessions.check(token);
      res.json({ loggedIn });
    } catch (err) {
      console.error("Admin check error:", err);
      res.json({ loggedIn: false });
    }
  });

  // Admin Auth: Logout
  app.post("/api/admin/logout", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        await DB.adminSessions.delete(token);
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Admin logout error:", err);
      res.status(500).json({ error: "Admin session clearance failed." });
    }
  });

  // Admin: Get Dashboard Stats
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const allOrders = await DB.orders.getAll();
      const allProfiles = await DB.profiles.getAll();
      const allFoodItems = await DB.foodItems.getAll();

      const todayOrders = allOrders.filter(o => o.createdAt.startsWith(today));
      const totalEarnings = allOrders
        .filter(o => o.status !== "Cancelled")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      res.json({
        totalOrders: allOrders.length,
        todayOrders: todayOrders.length,
        pendingOrders: allOrders.filter(o => o.status === "Pending").length,
        totalUsers: allProfiles.length,
        totalMenuItems: allFoodItems.length,
        totalEarnings,
        recentOrders: allOrders.slice(0, 5)
      });
    } catch (err) {
      console.error("Admin stats error:", err);
      res.status(500).json({ error: "Failed to generate system analytics." });
    }
  });

  // Admin: Get All Orders
  app.get("/api/admin/orders", requireAdmin, async (req, res) => {
    try {
      const orders = await DB.orders.getAll();
      res.json({ orders });
    } catch (err) {
      console.error("Admin get orders error:", err);
      res.status(500).json({ error: "Failed to fetch customer orders catalog." });
    }
  });

  // Admin: Update Order Status & Admin Response
  app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminResponse } = req.body;

      const order = await DB.orders.updateStatusAndResponse(id, status, adminResponse);
      res.json({ success: true, order });
    } catch (err) {
      console.error("Admin patch order error:", err);
      res.status(404).json({ error: "Order not found or update failed." });
    }
  });

  // Admin: Get All Menu Items (including unavailable ones)
  app.get("/api/admin/menu", requireAdmin, async (req, res) => {
    try {
      const items = await DB.foodItems.getAll(false);
      res.json({ items });
    } catch (err) {
      console.error("Admin get menu error:", err);
      res.status(500).json({ error: "Failed to retrieve full menu directory." });
    }
  });

  // Admin: Add Menu Item
  app.post("/api/admin/menu", requireAdmin, async (req, res) => {
    try {
      const { name, description, price, category, imageUrl, isAvailable } = req.body;
      if (!name || !price || !category) {
        res.status(400).json({ error: "Name, price, and category are required." });
        return;
      }

      const newItem: FoodItem = {
        id: "food_" + generateId(),
        name,
        description: description || "",
        price: parseFloat(price),
        category,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        createdAt: new Date().toISOString()
      };

      await DB.foodItems.insert(newItem);
      res.json({ success: true, item: newItem });
    } catch (err) {
      console.error("Admin add menu error:", err);
      res.status(500).json({ error: "Failed to register new food item." });
    }
  });

  // Admin: Edit Menu Item
  app.patch("/api/admin/menu/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, category, imageUrl, isAvailable } = req.body;

      const updateData: Partial<FoodItem> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (category !== undefined) updateData.category = category;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

      const updatedItem = await DB.foodItems.update(id, updateData);
      res.json({ success: true, item: updatedItem });
    } catch (err) {
      console.error("Admin patch menu error:", err);
      res.status(404).json({ error: "Food item not found." });
    }
  });

  // Admin: Delete Menu Item
  app.delete("/api/admin/menu/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await DB.foodItems.delete(id);
      res.json({ success: true });
    } catch (err) {
      console.error("Admin delete menu item error:", err);
      res.status(404).json({ error: "Food item not found." });
    }
  });

  // Admin: Get All Users
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await DB.profiles.getAll();
      res.json({ users });
    } catch (err) {
      console.error("Admin get users error:", err);
      res.status(500).json({ error: "Failed to retrieve customers registry." });
    }
  });

  // Admin: Toggle User Ban Status
  app.patch("/api/admin/users/:id/ban", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isBanned } = req.body;

      await DB.profiles.updateBanStatus(id, !!isBanned);

      // Forcefully clear all active user sessions if the account is being suspended
      if (isBanned) {
        await DB.sessions.deleteByUserId(id);
      }

      const updatedUser = await DB.profiles.findById(id);
      res.json({ success: true, user: updatedUser });
    } catch (err) {
      console.error("Admin ban toggle error:", err);
      res.status(404).json({ error: "User profile not found." });
    }
  });

  // Admin: Delete User Profile & Orders
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete sessions
      await DB.sessions.deleteByUserId(id);
      
      // Delete profile record
      await DB.profiles.delete(id);

      res.json({ success: true });
    } catch (err) {
      console.error("Admin delete profile error:", err);
      res.status(404).json({ error: "User profile not found." });
    }
  });

  // Admin: Get Contact Messages
  app.get("/api/admin/contacts", requireAdmin, async (req, res) => {
    try {
      const messages = await DB.contactMessages.getAll();
      res.json({ messages });
    } catch (err) {
      console.error("Admin get contacts error:", err);
      res.status(500).json({ error: "Failed to fetch visitor feedback database." });
    }
  });

  // Admin: Respond to Contact Message
  app.patch("/api/admin/contacts/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminResponse } = req.body;

      const updatedMsg = await DB.contactMessages.updateResponse(id, adminResponse);
      res.json({ success: true, message: updatedMsg });
    } catch (err) {
      console.error("Admin patch contact error:", err);
      res.status(404).json({ error: "Feedback comment not found." });
    }
  });

  // Admin: Get SMTP Configuration Settings
  app.get("/api/admin/smtp", requireAdmin, async (req, res) => {
    try {
      const config = localData.smtp_settings || {
        host: process.env.SMTP_HOST || "",
        port: process.env.SMTP_PORT || "587",
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS ? "••••••••••••" : "",
        from: process.env.SMTP_FROM || "",
        isConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
      };
      
      // Mask password for security when returning to UI
      const maskedConfig = {
        ...config,
        pass: config.pass ? "••••••••••••" : ""
      };
      
      res.json({ config: maskedConfig });
    } catch (err) {
      res.status(500).json({ error: "Failed to load SMTP config." });
    }
  });

  // Admin: Save SMTP Configuration Settings
  app.post("/api/admin/smtp", requireAdmin, async (req, res) => {
    try {
      const { host, port, user, pass, from } = req.body;
      
      let finalPass = pass;
      // If password is sent as bullets, keep the existing saved password
      if (pass === "••••••••••••") {
        finalPass = localData.smtp_settings?.pass || process.env.SMTP_PASS || "";
      }
      
      localData.smtp_settings = {
        host: host || "",
        port: port || "587",
        user: user || "",
        pass: finalPass || "",
        from: from || "",
        isConfigured: !!(host && user && finalPass)
      };
      
      saveLocalDb();
      res.json({ success: true, message: "SMTP credentials successfully updated and saved in local database!" });
    } catch (err) {
      console.error("Save SMTP config error:", err);
      res.status(500).json({ error: "Failed to save SMTP credentials." });
    }
  });

  // Admin: Connection Test and Email System validation
  app.post("/api/admin/smtp/test", requireAdmin, async (req, res) => {
    try {
      const { host, port, user, pass, from, testEmail } = req.body;
      
      let finalPass = pass;
      if (pass === "••••••••••••") {
        finalPass = localData.smtp_settings?.pass || process.env.SMTP_PASS || "";
      }
      
      if (!host || !user || !finalPass) {
        res.status(400).json({ error: "SMTP Host, User, and Password are all required to run connection test." });
        return;
      }
      
      const targetEmail = testEmail || user;
      const parsedPort = port ? parseInt(port, 10) : 587;
      
      console.log(`🔌 [SMTP Test] Testing connection to ${host}:${parsedPort} with user ${user}...`);
      
      const transporter = nodemailer.createTransport({
        host,
        port: parsedPort,
        secure: parsedPort === 465,
        auth: {
          user,
          pass: finalPass,
        },
        connectionTimeout: 8000, // 8 seconds timeout
      });
      
      // Verify transporter first
      await transporter.verify();
      
      // Send verified test email
      await transporter.sendMail({
        from: from || `"Pahari Restora SMTP Test" <${user}>`,
        to: targetEmail,
        subject: `⚡ Pahari Restora - SMTP Email System Test`,
        text: `Success! Your SMTP configuration is correct and verified on ${new Date().toLocaleString()}.`,
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #10b981; border-radius: 12px; background-color: #f0fdf4;">
            <h2 style="color: #065f46; margin-top: 0;">🎉 SMTP Connection Success!</h2>
            <p style="color: #047857; font-size: 15px; line-height: 1.5;">
              Congratulations! Your SMTP email settings have been verified successfully. Pahari Restora is now fully equipped to send real registration OTP verification codes to user inboxes.
            </p>
            <div style="background-color: #ffffff; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; color: #065f46; margin: 20px 0;">
              <strong>Validated Settings:</strong><br />
              • SMTP Host: ${host}<br />
              • SMTP Port: ${parsedPort}<br />
              • Username: ${user}<br />
              • Secure: ${parsedPort === 465 ? "Yes (SSL/TLS)" : "No (STARTTLS)"}
            </div>
            <p style="color: #065f46; font-size: 11px; margin-bottom: 0;">
              Tested at ${new Date().toLocaleString()} PST.
            </p>
          </div>
        `
      });
      
      res.json({ success: true, message: `Successfully connected to SMTP and sent verified test email to ${targetEmail}!` });
    } catch (err: any) {
      console.error("❌ SMTP Test failure:", err);
      res.status(500).json({ error: `SMTP Connection Failed: ${err.message || String(err)}` });
    }
  });


  // Admin: Get all coupons
  app.get("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const coupons = await DB.coupons.getAll();
      res.json(coupons);
    } catch (err) {
      console.error("Admin: failed to fetch coupons:", err);
      res.status(500).json({ error: "Failed to fetch coupons." });
    }
  });

  // Admin: Create new coupon
  app.post("/api/admin/coupons", requireAdmin, async (req, res) => {
    try {
      const { code, discountType, discountValue, expiryDate, minOrderAmount, usageLimit, isActive } = req.body;
      
      if (!code || !discountType || discountValue === undefined || !expiryDate) {
        res.status(400).json({ error: "Please provide all required coupon fields." });
        return;
      }

      // Check if code already exists
      const existing = await DB.coupons.findByCode(code);
      if (existing) {
        res.status(400).json({ error: `Coupon code '${code.toUpperCase()}' already exists.` });
        return;
      }

      const id = "coupon_" + generateId();
      const newCoupon: Coupon = {
        id,
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        expiryDate,
        minOrderAmount: Number(minOrderAmount || 0),
        usageLimit: Number(usageLimit || 0),
        isActive: isActive !== false,
        usageCount: 0,
        createdAt: new Date().toISOString()
      };

      await DB.coupons.insert(newCoupon);
      res.status(201).json(newCoupon);
    } catch (err) {
      console.error("Admin: failed to create coupon:", err);
      res.status(500).json({ error: "Failed to create coupon." });
    }
  });

  // Admin: Update coupon
  app.patch("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { code, discountType, discountValue, expiryDate, minOrderAmount, usageLimit, isActive } = req.body;

      const updateData: Partial<Coupon> = {};
      if (code) updateData.code = code.toUpperCase().trim();
      if (discountType) updateData.discountType = discountType;
      if (discountValue !== undefined) updateData.discountValue = Number(discountValue);
      if (expiryDate) updateData.expiryDate = expiryDate;
      if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount);
      if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit);
      if (isActive !== undefined) updateData.isActive = !!isActive;

      // If code changes, verify it doesn't conflict
      if (code) {
        const existing = await DB.coupons.findByCode(code);
        if (existing && existing.id !== id) {
          res.status(400).json({ error: `Coupon code '${code.toUpperCase()}' is already in use.` });
          return;
        }
      }

      const updated = await DB.coupons.update(id, updateData);
      res.json(updated);
    } catch (err) {
      console.error("Admin: failed to update coupon:", err);
      res.status(500).json({ error: "Failed to update coupon." });
    }
  });

  // Admin: Delete coupon
  app.delete("/api/admin/coupons/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await DB.coupons.delete(id);
      res.json({ success: true });
    } catch (err) {
      console.error("Admin: failed to delete coupon:", err);
      res.status(500).json({ error: "Failed to delete coupon." });
    }
  });


  // --- VITE AND STATIC SERVING MIDDLEWARE ---

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Full-Stack Express Server successfully started at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server failure:", err);
});
