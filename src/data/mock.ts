export const PRODUCT_IMAGES = {
  headphones: [
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100847931_de8ea52e.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100856877_2e8d9795.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100847831_0a5e0cff.jpg",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100850320_f0bea040.jpg",
  ],
  watch: [
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100879701_30462bec.png",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100883193_2c442004.png",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100879991_39a48925.png",
    "https://d64gsuwffb70l.cloudfront.net/6a297041a1033fa5766e0ad0_1781100909935_bc2ac73b.png",
  ],
};

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  status: "active" | "draft" | "archived";
  sold: number;
  variants: string[];
}

const imgs = [...PRODUCT_IMAGES.headphones, ...PRODUCT_IMAGES.watch];

export const products: Product[] = [
  { id: "P-1001", name: "Aurora Wireless Headphones", category: "Audio", price: 199.0, stock: 142, image: imgs[0], status: "active", sold: 1284, variants: ["Black", "Purple", "White"] },
  { id: "P-1002", name: "Nebula Noise-Cancelling Pro", category: "Audio", price: 299.0, stock: 58, image: imgs[1], status: "active", sold: 942, variants: ["Black", "Silver"] },
  { id: "P-1003", name: "Pulse Studio Headphones", category: "Audio", price: 149.0, stock: 8, image: imgs[2], status: "active", sold: 631, variants: ["Black"] },
  { id: "P-1004", name: "Echo Bass Headphones", category: "Audio", price: 89.0, stock: 0, image: imgs[3], status: "active", sold: 2103, variants: ["Black", "Blue"] },
  { id: "P-1005", name: "Quantum Smart Watch", category: "Wearables", price: 349.0, stock: 96, image: imgs[4], status: "active", sold: 1842, variants: ["40mm", "44mm"] },
  { id: "P-1006", name: "Vertex Fitness Watch", category: "Wearables", price: 229.0, stock: 33, image: imgs[5], status: "active", sold: 1120, variants: ["S", "M", "L"] },
  { id: "P-1007", name: "Lumen Display Watch", category: "Wearables", price: 279.0, stock: 71, image: imgs[6], status: "draft", sold: 0, variants: ["Graphite", "Rose"] },
  { id: "P-1008", name: "Orbit GPS Watch", category: "Wearables", price: 399.0, stock: 14, image: imgs[7], status: "active", sold: 487, variants: ["44mm"] },
  { id: "P-1009", name: "Aurora Headphones Lite", category: "Audio", price: 129.0, stock: 210, image: imgs[0], status: "active", sold: 758, variants: ["Black", "Purple"] },
  { id: "P-1010", name: "Nebula Travel Edition", category: "Audio", price: 259.0, stock: 5, image: imgs[1], status: "active", sold: 392, variants: ["Black"] },
  { id: "P-1011", name: "Vertex Watch Sport", category: "Wearables", price: 189.0, stock: 120, image: imgs[5], status: "active", sold: 904, variants: ["S", "M", "L"] },
  { id: "P-1012", name: "Quantum Watch Ultra", category: "Wearables", price: 499.0, stock: 42, image: imgs[4], status: "active", sold: 611, variants: ["44mm", "48mm"] },
];

export interface Order {
  id: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  status: "paid" | "pending" | "shipped" | "delivered" | "cancelled";
  date: string;
}

export const orders: Order[] = [
  { id: "#ORD-9241", customer: "Liam Carter", email: "liam@mail.com", items: 2, total: 398.0, status: "delivered", date: "2026-06-10" },
  { id: "#ORD-9240", customer: "Sophia Reyes", email: "sophia@mail.com", items: 1, total: 349.0, status: "shipped", date: "2026-06-10" },
  { id: "#ORD-9239", customer: "Noah Patel", email: "noah@mail.com", items: 3, total: 617.0, status: "paid", date: "2026-06-09" },
  { id: "#ORD-9238", customer: "Emma Liang", email: "emma@mail.com", items: 1, total: 199.0, status: "pending", date: "2026-06-09" },
  { id: "#ORD-9237", customer: "Mason Cole", email: "mason@mail.com", items: 2, total: 528.0, status: "delivered", date: "2026-06-08" },
  { id: "#ORD-9236", customer: "Ava Morgan", email: "ava@mail.com", items: 4, total: 876.0, status: "paid", date: "2026-06-08" },
  { id: "#ORD-9235", customer: "Ethan Wu", email: "ethan@mail.com", items: 1, total: 129.0, status: "cancelled", date: "2026-06-07" },
  { id: "#ORD-9234", customer: "Mia Hernandez", email: "mia@mail.com", items: 2, total: 458.0, status: "shipped", date: "2026-06-07" },
];

export interface Merchant {
  id: string;
  name: string;
  subdomain: string;
  plan: "Starter" | "Growth" | "Scale";
  revenue: number;
  orders: number;
  status: "active" | "trialing" | "past_due";
}

export const merchants: Merchant[] = [
  { id: "M-01", name: "SoundWave Co.", subdomain: "soundwave", plan: "Scale", revenue: 184200, orders: 3421, status: "active" },
  { id: "M-02", name: "TimeKeepers", subdomain: "timekeepers", plan: "Growth", revenue: 98300, orders: 1892, status: "active" },
  { id: "M-03", name: "Urban Threads", subdomain: "urbanthreads", plan: "Growth", revenue: 76500, orders: 1450, status: "trialing" },
  { id: "M-04", name: "GreenLeaf Goods", subdomain: "greenleaf", plan: "Starter", revenue: 21400, orders: 612, status: "active" },
  { id: "M-05", name: "Pixel Studio", subdomain: "pixelstudio", plan: "Scale", revenue: 211800, orders: 4012, status: "past_due" },
  { id: "M-06", name: "Coastal Living", subdomain: "coastal", plan: "Starter", revenue: 14200, orders: 388, status: "active" },
];

export interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  joined: string;
}

export const customers: Customer[] = [
  { id: "C-1", name: "Liam Carter", email: "liam@mail.com", orders: 12, spent: 2840, joined: "2025-02-11" },
  { id: "C-2", name: "Sophia Reyes", email: "sophia@mail.com", orders: 8, spent: 1920, joined: "2025-03-22" },
  { id: "C-3", name: "Noah Patel", email: "noah@mail.com", orders: 15, spent: 3610, joined: "2024-11-04" },
  { id: "C-4", name: "Emma Liang", email: "emma@mail.com", orders: 5, spent: 880, joined: "2025-05-19" },
  { id: "C-5", name: "Mason Cole", email: "mason@mail.com", orders: 9, spent: 2104, joined: "2025-01-30" },
  { id: "C-6", name: "Ava Morgan", email: "ava@mail.com", orders: 21, spent: 5240, joined: "2024-08-15" },
];

export const revenueData = [
  { month: "Jan", revenue: 42000, orders: 820 },
  { month: "Feb", revenue: 51000, orders: 940 },
  { month: "Mar", revenue: 48500, orders: 880 },
  { month: "Apr", revenue: 61200, orders: 1120 },
  { month: "May", revenue: 72400, orders: 1340 },
  { month: "Jun", revenue: 84100, orders: 1510 },
];

export const categoryData = [
  { name: "Audio", value: 54, color: "#7C3AED" },
  { name: "Wearables", value: 31, color: "#06b6d4" },
  { name: "Accessories", value: 15, color: "#22c55e" },
];
