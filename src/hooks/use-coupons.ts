
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Coupon = {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description?: string;
  is_active: boolean;
  apply_to_all: boolean;
};

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .order("code");

      if (error) {
        console.error("Error fetching coupons:", error);
        throw error;
      }

      setCoupons(data as Coupon[] || []);
      return data;
    } catch (error: any) {
      console.error("Error in fetchCoupons:", error);
      toast.error("Failed to load coupons");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const getCouponById = useCallback(
    async (id: string) => {
      try {
        if (coupons.length > 0) {
          const cachedCoupon = coupons.find((coupon) => coupon.id === id);
          if (cachedCoupon) {
            return cachedCoupon;
          }
        }

        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Database error fetching coupon:", error);
          throw error;
        }
        
        return data as Coupon;
      } catch (error: any) {
        console.error("Error fetching coupon by ID:", error);
        return null;
      }
    },
    [coupons]
  );

  const validateCouponCode = useCallback(
    async (code: string) => {
      try {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("code", code)
          .eq("is_active", true)
          .single();

        if (error) {
          console.error("Error validating coupon code:", error);
          throw error;
        }
        
        return data as Coupon;
      } catch (error: any) {
        console.error("Error validating coupon code:", error);
        return null;
      }
    },
    []
  );

  // Helper function to calculate coupon discount
  const calculateCouponDiscount = useCallback(
    (coupon: Coupon, subtotal: number) => {
      if (!coupon) return 0;
      
      return coupon.discount_type === 'percentage'
        ? subtotal * (coupon.discount_value / 100)
        : Math.min(coupon.discount_value, subtotal); // Don't exceed the subtotal
    },
    []
  );

  // Filtered coupons based on search query
  const filteredCoupons = useCallback(() => {
    if (!searchQuery) return coupons;
    
    return coupons.filter(coupon => 
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [coupons, searchQuery]);

  return {
    coupons,
    filteredCoupons: filteredCoupons(),
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchCoupons,
    getCouponById,
    validateCouponCode,
    calculateCouponDiscount,
  };
}
