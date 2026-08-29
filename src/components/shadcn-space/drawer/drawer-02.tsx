"use client";

import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import {
  ShoppingBagIcon,
  ShoppingCartIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
  PlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "react-toastify";

const FREE_SHIPPING_THRESHOLD = 1500; // Rs. 1500 threshold for free note/gift demo

type ProjectItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  originalPrice: number;
  discountPercentage: number;
  category: string | null;
};

type CartItem = {
  id: string;
  projectItemId: string;
  createdAt: string;
  projectItem: ProjectItem;
};

type SuggestionItem = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  originalPrice: number;
  discountPercentage: number;
  category: string | null;
  rating?: number;
  reviews?: string;
};

export default function ShoppingCartDrawerDemo({ children }: { children?: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const progressSectionRef = useRef<HTMLDivElement>(null);

  // Fetch cart items from database
  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      setItems(data.items || []);
      // Sync Navbar badge
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active projects for suggestions
  const fetchSuggestions = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        const formatted: SuggestionItem[] = data.projects.map((p: any) => ({
          id: p.id,
          title: p.title,
          thumbnailUrl: p.thumbnailUrl,
          originalPrice: p.originalPrice,
          discountPercentage: p.discountPercentage,
          category: p.category,
          rating: 4.7, // Static rating demo
          reviews: "45", // Static reviews demo
        }));
        setSuggestions(formatted);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchSuggestions();

    // Listen to global cart updates (e.g. from Project Details page add to cart)
    const handleCartUpdated = () => {
      fetchCart();
    };
    window.addEventListener("cart-updated", handleCartUpdated);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  const getPrice = (item: CartItem | SuggestionItem) => {
    const p = "projectItem" in item ? item.projectItem : item;
    if (!p) return 0;
    return p.discountPercentage > 0
      ? Math.round(p.originalPrice * (1 - p.discountPercentage / 100))
      : p.originalPrice;
  };

  const removeItem = async (projectItemId: string) => {
    try {
      const res = await fetch(`/api/cart?projectItemId=${projectItemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.projectItemId !== projectItemId));
        toast.success("Item removed from cart! 🛒");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cart-updated"));
        }
      }
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const addSuggestion = async (suggestion: SuggestionItem) => {
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectItemId: suggestion.id }),
      });
      if (res.status === 401) {
        toast.info("Please login to add items to cart.");
      } else {
        toast.success("Added to cart! 🛒");
        fetchCart();
      }
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const totalCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + getPrice(item), 0);
  const total = subtotal;

  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  // Filter out suggestions that are already in the cart
  const filteredSuggestions = suggestions
    .filter((s) => !items.some((item) => item.projectItemId === s.id))
    .slice(0, 3);

  useEffect(() => {
    if (subtotal >= FREE_SHIPPING_THRESHOLD && subtotal > 0) {
      if (!hasFiredConfetti) {
        if (progressSectionRef.current) {
          try {
            const rect = progressSectionRef.current.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { x, y },
            });
          } catch (e) {
            // Safe fallback if confetti isn't initialized
          }
        }
        setHasFiredConfetti(true);
      }
    } else {
      setHasFiredConfetti(false);
    }
  }, [subtotal, hasFiredConfetti]);

  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger asChild>
        {children || (
          <Button variant="outline" className="cursor-pointer">
            <ShoppingCartIcon className="size-4" />
            View Cart
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent className="fixed inset-y-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background [--drawer-inset:0px] [--drawer-bleed-background:transparent] m-0 bg-transparent! border-0! shadow-none! data-[swipe-axis=x]:[--drawer-content-width:100%] data-[swipe-axis=x]:sm:[--drawer-content-width:39.125rem] **:data-[slot=drawer-content]:m-4 **:data-[slot=drawer-content]:bg-popover **:data-[slot=drawer-content]:text-popover-foreground **:data-[slot=drawer-content]:border **:data-[slot=drawer-content]:shadow-2xl **:data-[slot=drawer-content]:rounded-2xl **:data-[slot=drawer-content]:w-full">
        <DrawerHeader className="flex-row items-center justify-between gap-0 border-b p-6">
          <div className="flex items-center gap-3">
            <ShoppingBagIcon className="size-5" />
            <DrawerTitle className="text-xl font-medium">
              {totalCount} Items
            </DrawerTitle>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon-sm" className="cursor-pointer">
              <XIcon className="size-5" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div
          ref={progressSectionRef}
          className="flex flex-col items-center gap-4 border-b px-10 py-6 text-center"
        >
          <p className="text-base font-medium text-foreground">
            {remainingForFreeShipping > 0
              ? `Spend another Rs. ${remainingForFreeShipping.toFixed(2)} to unlock special benefits!`
              : "You've unlocked special cart benefits!"}
          </p>
          <Progress
            value={shippingProgress}
            className="w-full [&>div]:h-2 **:data-[slot=progress-track]:bg-primary/10"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-8 p-6">
            <div className="flex flex-col gap-6">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading cart items...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Your cart is empty.</div>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                      <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted relative">
                        {item.projectItem.thumbnailUrl ? (
                          <img
                            src={item.projectItem.thumbnailUrl}
                            alt={item.projectItem.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center size-full text-2xl bg-indigo-950 text-indigo-200">📦</div>
                        )}
                      </div>
                      <div className="flex flex-1 min-w-0 items-start gap-5">
                        <div className="flex flex-1 min-w-0 flex-col justify-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <p className="truncate text-base font-semibold text-foreground">{item.projectItem.title}</p>
                            {item.projectItem.category && (
                              <p className="text-xs text-muted-foreground">
                                {item.projectItem.category}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {/* In notes/projects marketplace, item qty is always 1 copy per user.
                                Show simple static "1 Copy" display and direct delete button */}
                            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded">1 Copy</span>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="cursor-pointer text-muted-foreground shadow-xs hover:text-destructive"
                              onClick={() => removeItem(item.projectItemId)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold text-emerald-400">
                            Rs. {getPrice(item).toFixed(2)}
                          </p>
                          {item.projectItem.discountPercentage > 0 && (
                            <p className="text-xs text-muted-foreground line-through">
                              Rs. {item.projectItem.originalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {index !== items.length - 1 && <Separator />}
                  </div>
                ))
              )}
            </div>

            {filteredSuggestions.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-base font-medium text-foreground">You May Also Like</p>
                <ScrollArea>
                  <div className="flex gap-4 pb-3">
                    {filteredSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="w-52 shrink-0 overflow-hidden rounded-2xl border bg-card"
                      >
                        <div className="relative h-32 w-full border-b bg-muted">
                          {suggestion.thumbnailUrl ? (
                            <img
                              src={suggestion.thumbnailUrl}
                              alt={suggestion.title}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center size-full text-2xl bg-indigo-950 text-indigo-200">📦</div>
                          )}
                          <Button
                            size="icon-sm"
                            className="absolute top-3 right-3 size-9 cursor-pointer rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
                            onClick={() => addSuggestion(suggestion)}
                          >
                            <PlusIcon className="size-4" />
                          </Button>
                        </div>
                        <div className="flex flex-col gap-1 p-3">
                          <p className="text-sm font-semibold truncate text-foreground">
                            {suggestion.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <StarIcon className="size-3 fill-amber-400 text-amber-400" />
                            <span>{suggestion.rating}</span>
                            <span>({suggestion.reviews})</span>
                          </div>
                          <p className="text-sm font-bold text-emerald-400">
                            Rs. {getPrice(suggestion).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            <div className="flex flex-col gap-3 text-base text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-4">
                <p className="flex-1 text-foreground">Subtotal ({totalCount} items)</p>
                <p className="font-bold text-foreground">Rs. {subtotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DrawerFooter className="border-t p-6 bg-card">
          <Link href="/cart" className="w-full" passHref>
            <Button className="h-12 w-full cursor-pointer bg-indigo-600 text-white hover:bg-indigo-500">
              Go to Cart Page — Rs. {total.toFixed(2)}
            </Button>
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
