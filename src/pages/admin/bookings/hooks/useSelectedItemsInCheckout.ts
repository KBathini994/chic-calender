import { useMemo } from 'react';
import type { Service, Package } from '../types';
import { getTotalDuration, calculatePackagePrice } from '../utils/bookingUtils';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  adjustedPrice: number;
  duration: number;
  type: "service";
  packageId: string | null;
  stylist: string;
  stylistName: string;
  time: string;
  formattedDuration: string;
}

interface PackageItem {
  id: string;
  name: string;
  price: number;
  adjustedPrice: number;
  duration: number;
  type: "package";
  packageId: string | null;
  stylist: string;
  stylistName: string;
  time: string;
  formattedDuration: string;
  services: Array<{
    id: string;
    name: string;
    price: number;
    adjustedPrice: number;
    duration: number;
    stylist: string;
    stylistName: string;
    time: string;
    isCustomized: boolean;
  }>;
}

type CheckoutItem = ServiceItem | PackageItem;

interface UseSelectedItemsInCheckoutProps {
  selectedServices: string[];
  selectedPackages: string[];
  services: Service[];
  packages: Package[];
  selectedStylists: Record<string, string>;
  selectedTimeSlots: Record<string, string>;
  appointmentId?: string;
  customizedServices: Record<string, string[]>;
  getServiceDisplayPrice: (serviceId: string) => number;
  getStylistName: (stylistId: string) => string | null;
  formatDuration: (minutes: number) => string;
}

export const useSelectedItemsInCheckout = ({
  selectedServices,
  selectedPackages,
  services,
  packages,
  selectedStylists,
  selectedTimeSlots,
  appointmentId,
  customizedServices,
  getServiceDisplayPrice,
  getStylistName,
  formatDuration,
}: UseSelectedItemsInCheckoutProps) => {
  const selectedItems = useMemo(() => {
    const items = [
      ...selectedServices.map((serviceId) => {
        const service = services?.find((s) => s.id === serviceId);
        if (!service) return null;

        return {
          id: serviceId,
          name: service.name,
          price: service.selling_price,
          adjustedPrice: getServiceDisplayPrice(serviceId),
          duration: service.duration,
          type: "service" as const,
          packageId: null as string | null,
          stylist: selectedStylists[serviceId] || "",
          stylistName: selectedStylists[serviceId] ? getStylistName(selectedStylists[serviceId]) : "",
          time: selectedTimeSlots[serviceId] || "",
          formattedDuration: formatDuration(service.duration)
        };
      }),
      ...selectedPackages.map((packageId) => {
        const pkg = packages?.find((p) => p.id === packageId);
        if (!pkg) return null;

        const packageServices = pkg.package_services?.map(ps => {
          const servicePrice = ps.package_selling_price || ps.service.selling_price;
          const adjustedServicePrice = getServiceDisplayPrice(ps.service.id);
          
          return {
            id: ps.service.id,
            name: ps.service.name,
            price: servicePrice,
            adjustedPrice: adjustedServicePrice,
            duration: ps.service.duration,
            stylist: selectedStylists[ps.service.id] || "",
            stylistName: selectedStylists[ps.service.id] ? getStylistName(selectedStylists[ps.service.id]) : "",
            time: selectedTimeSlots[ps.service.id] || "",
            isCustomized: false
          };
        }) || [];

        // Add customized services
        if (pkg.is_customizable && customizedServices[packageId]) {
          const additionalServices = customizedServices[packageId]
            .filter(serviceId => !packageServices.some(ps => ps.id === serviceId))
            .map(serviceId => {
              const service = services?.find(s => s.id === serviceId);
              if (!service) return null;
              
              const servicePrice = service.selling_price;
              const adjustedServicePrice = getServiceDisplayPrice(serviceId);
              
              return {
                id: service.id,
                name: service.name,
                price: servicePrice,
                adjustedPrice: adjustedServicePrice,
                duration: service.duration,
                stylist: selectedStylists[service.id] || "",
                stylistName: selectedStylists[service.id] ? getStylistName(selectedStylists[service.id]) : "",
                time: selectedTimeSlots[service.id] || "",
                isCustomized: true
              };
            })
            .filter(Boolean);

          packageServices.push(...(additionalServices as any[]));
        }

        const totalDuration = packageServices.reduce((sum, s) => sum + s.duration, 0);
        const packageTotalPrice = calculatePackagePrice(pkg, customizedServices[packageId] || [], services);

        // Calculate package adjusted price correctly by preserving the package discount structure
        // First, get the original total of services without package discounts
        const rawServicesTotal = packageServices.reduce((sum, s) => {
          // For base package services, use the original service price (not the package price)
          const service = services?.find(serv => serv.id === s.id);
          return sum + (service?.selling_price || 0);
        }, 0);
        
        // Calculate the package discount ratio (how much discount the package itself provides)
        const packageDiscountRatio = rawServicesTotal > 0 ? packageTotalPrice / rawServicesTotal : 1;
        
        // Now calculate the adjusted price by applying the same package discount ratio to the adjusted service prices
        const packageAdjustedPrice = packageServices.reduce((sum, s) => {
          // Apply the original package discount ratio to the adjusted service price
          return sum + s.adjustedPrice * packageDiscountRatio;
        }, 0);

        return {
          id: packageId,
          name: pkg.name,
          price: packageTotalPrice,
          adjustedPrice: packageAdjustedPrice, // Use the calculated adjusted price
          duration: totalDuration,
          type: "package" as const,
          packageId: null as string | null,
          stylist: "",
          stylistName: "",
          time: "",
          services: packageServices,
          formattedDuration: formatDuration(totalDuration)
        };
      })
    ].filter(Boolean);

    return items as unknown as CheckoutItem[];
  }, [
    selectedServices,
    selectedPackages,
    services,
    packages,
    selectedStylists,
    selectedTimeSlots,
    customizedServices,
    getServiceDisplayPrice,
    getStylistName,
    formatDuration
  ]);

  return { selectedItems };
};
