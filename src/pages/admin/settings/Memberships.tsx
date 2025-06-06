
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash, Check, X, PercentIcon, DollarSign, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemberships, type Membership, type MembershipFormValues } from "@/hooks/use-memberships";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const membershipFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  validity_period: z.coerce.number().min(1, "Validity period must be a positive number"),
  validity_unit: z.enum(["days", "months"]),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number().min(0, "Discount value must be a non-negative number"),
  max_discount_value: z.coerce.number().min(0, "Maximum discount value must be a non-negative number").nullable(),
  min_billing_amount: z.coerce.number().min(0, "Minimum billing amount must be a non-negative number").nullable(),
  apply_to_all: z.boolean().default(true),
});

export default function Memberships() {
  const { memberships, isLoading, fetchMemberships, createMembership, updateMembership, deleteMembership } = useMemberships();
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectionTabValue, setSelectionTabValue] = useState("services");

  const form = useForm<z.infer<typeof membershipFormSchema>>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      name: "",
      description: "",
      validity_period: 30,
      validity_unit: "days",
      discount_type: "percentage",
      discount_value: 0,
      max_discount_value: null,
      min_billing_amount: null,
      apply_to_all: true,
    },
  });

  // Watch for changes to apply_to_all
  const applyToAll = form.watch("apply_to_all");

  useEffect(() => {
    fetchMemberships();
    fetchServices();
    fetchPackages();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("id, name, selling_price, category_id").order("name");
    if (data) {
      setServices(data);
    }
  };

  const fetchPackages = async () => {
    const { data } = await supabase.from("packages").select("id, name, price").order("name");
    if (data) {
      setPackages(data);
    }
  };

  const handleOpenMembershipDialog = (membership?: Membership) => {
    if (membership) {
      setEditingMembership(membership);
      form.reset({
        name: membership.name,
        description: membership.description || "",
        validity_period: membership.validity_period,
        validity_unit: membership.validity_unit,
        discount_type: membership.discount_type,
        discount_value: membership.discount_value,
        max_discount_value: membership.max_discount_value || null,
        min_billing_amount: membership.min_billing_amount || null,
        apply_to_all: membership.applicable_services.length === 0 && membership.applicable_packages.length === 0,
      });
      setSelectedServices(membership.applicable_services);
      setSelectedPackages(membership.applicable_packages);
    } else {
      setEditingMembership(null);
      form.reset({
        name: "",
        description: "",
        validity_period: 30,
        validity_unit: "days",
        discount_type: "percentage",
        discount_value: 0,
        max_discount_value: null,
        min_billing_amount: null,
        apply_to_all: true,
      });
      setSelectedServices([]);
      setSelectedPackages([]);
    }
    setOpenMembershipDialog(true);
  };

  const onSubmit = async (values: z.infer<typeof membershipFormSchema>) => {
    try {
      const membershipData: MembershipFormValues = {
        name: values.name,
        description: values.description,
        validity_period: values.validity_period,
        validity_unit: values.validity_unit,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        max_discount_value: values.max_discount_value,
        min_billing_amount: values.min_billing_amount,
        applicable_services: values.apply_to_all ? [] : selectedServices,
        applicable_packages: values.apply_to_all ? [] : selectedPackages,
      };

      if (editingMembership) {
        await updateMembership(editingMembership.id, membershipData);
        toast.success("Membership updated successfully");
      } else {
        await createMembership(membershipData);
        toast.success("Membership created successfully");
      }
      setOpenMembershipDialog(false);
    } catch (error) {
      console.error("Error saving membership:", error);
      toast.error("Failed to save membership");
    }
  };

  const handleDeleteMembership = async (id: string) => {
    if (confirm("Are you sure you want to delete this membership?")) {
      try {
        await deleteMembership(id);
        toast.success("Membership deleted successfully");
      } catch (error) {
        console.error("Error deleting membership:", error);
        toast.error("Failed to delete membership");
      }
    }
  };

  const handleServiceSelection = (serviceId: string) => {
    setSelectedServices(current => {
      if (current.includes(serviceId)) {
        return current.filter(id => id !== serviceId);
      } else {
        return [...current, serviceId];
      }
    });
  };

  const handlePackageSelection = (packageId: string) => {
    setSelectedPackages(current => {
      if (current.includes(packageId)) {
        return current.filter(id => id !== packageId);
      } else {
        return [...current, packageId];
      }
    });
  };

  const handleOpenSelectionDialog = () => {
    if (!applyToAll) {
      setShowSelectionDialog(true);
    }
  };

  // Group services by category_id
  const servicesByCategory = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};
    services.forEach(service => {
      const categoryId = service.category_id || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(service);
    });
    return grouped;
  }, [services]);

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Memberships</h1>
        <Dialog open={openMembershipDialog} onOpenChange={setOpenMembershipDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Membership
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingMembership ? "Edit Membership" : "Create Membership"}</DialogTitle>
              <DialogDescription>
                {editingMembership ? "Update an existing membership." : "Add a new membership to your business."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Membership Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Membership Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="validity_period"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel>Validity Period</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="validity_unit"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel>Validity Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="discount_type"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage <PercentIcon className="w-4 h-4 ml-2" /></SelectItem>
                            <SelectItem value="fixed">Fixed <DollarSign className="w-4 h-4 ml-2" /></SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discount_value"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="max_discount_value"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel>Max Discount Value</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="min_billing_amount"
                    render={({ field }) => (
                      <FormItem className="w-1/2">
                        <FormLabel>Min Billing Amount</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="apply_to_all"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Apply to all services</FormLabel>
                        <FormDescription>
                          Apply this membership to all services and packages.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {!applyToAll && (
                  <div>
                    <FormItem>
                      <FormLabel>Include services and packages</FormLabel>
                      <FormControl>
                        <Button 
                          variant="outline" 
                          className="w-full mt-2" 
                          onClick={handleOpenSelectionDialog}
                          type="button"
                        >
                          Select services ({selectedServices.length}) and packages ({selectedPackages.length})
                        </Button>
                      </FormControl>
                    </FormItem>
                  </div>
                )}
                <DialogFooter>
                  <Button type="submit">
                    {editingMembership ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Applies To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships?.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell className="font-medium">{membership.name}</TableCell>
                <TableCell>{membership.description}</TableCell>
                <TableCell>{membership.validity_period} {membership.validity_unit}</TableCell>
                <TableCell>
                  {membership.discount_type === "percentage" ? `${membership.discount_value}%` : `₹${membership.discount_value}`}
                  {membership.max_discount_value ? ` (Max ₹${membership.max_discount_value})` : ""}
                </TableCell>
                <TableCell>{membership.applicable_services.length === 0 && membership.applicable_packages.length === 0 ? "All" : "Selected"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenMembershipDialog(membership)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteMembership(membership.id)}>
                      <Trash className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {memberships?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No memberships found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Combined Services and Packages Selection Dialog */}
      <Dialog open={showSelectionDialog} onOpenChange={setShowSelectionDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Select Services and Packages</DialogTitle>
            <DialogDescription>
              Choose the services and packages to which this membership applies.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="services" value={selectionTabValue} onValueChange={setSelectionTabValue}>
            <TabsList className="mb-4">
              <TabsTrigger value="services">Services ({selectedServices.length})</TabsTrigger>
              <TabsTrigger value="packages">Packages ({selectedPackages.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="services">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {Object.entries(servicesByCategory).map(([categoryId, categoryServices]) => (
                  <div key={categoryId} className="mb-6">
                    <h3 className="font-medium mb-2">{categoryId === 'uncategorized' ? 'Other Services' : categoryId}</h3>
                    <div className="space-y-2">
                      {categoryServices.map((service) => (
                        <div key={service.id} className="p-2 border rounded-md">
                          <label htmlFor={`service-${service.id}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() => handleServiceSelection(service.id)}
                            />
                            <span className="flex-grow">{service.name}</span>
                            <Badge variant="secondary">₹{service.selling_price}</Badge>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="packages">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-2 border rounded-md">
                      <label htmlFor={`package-${pkg.id}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`package-${pkg.id}`}
                          checked={selectedPackages.includes(pkg.id)}
                          onCheckedChange={() => handlePackageSelection(pkg.id)}
                        />
                        <span className="flex-grow">{pkg.name}</span>
                        <Badge variant="secondary">₹{pkg.price}</Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setShowSelectionDialog(false)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
