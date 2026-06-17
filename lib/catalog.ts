import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { WatchListing } from "@/types";

const DATA_PATH = path.join(process.cwd(), "data", "watches.json");

export async function getListings(): Promise<WatchListing[]> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return JSON.parse(raw) as WatchListing[];
}

export async function getVisibleListings(showHiddenSold = false) {
  const listings = await getListings();
  return listings.filter((watch) => {
    const isSold = watch.quantity <= 0 || watch.status === "sold";
    return showHiddenSold || !isSold || !watch.hideWhenSold;
  });
}

export async function getListingBySlug(slug: string) {
  const listings = await getVisibleListings(true);
  return listings.find((watch) => watch.slug === slug);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(price);
}

export function isSoldOut(watch: Pick<WatchListing, "quantity" | "status">) {
  return watch.quantity <= 0 || watch.status === "sold";
}

export function primaryImage(watch: WatchListing) {
  return watch.images[0] ?? "/placeholder-watch.jpg";
}
