import { Gift, Truck, Wallet, type LucideIcon } from "lucide-react";
import type { RewardSummary } from "./promo-store";

/** The icon for each kind of reward a report tile can describe. */
export const REWARD_ICONS: Record<RewardSummary["kind"], LucideIcon> = {
  discount: Wallet,
  items: Gift,
  shipping: Truck,
};
