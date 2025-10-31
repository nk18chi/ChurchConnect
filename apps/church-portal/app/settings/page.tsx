"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/form-input";
import { FormSelect } from "@/components/form-select";
import { Save } from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(1, "Church name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  postalCode: z.string().optional(),
  prefectureId: z.string().min(1, "Prefecture is required"),
  cityId: z.string().min(1, "City is required"),
  denominationId: z.string().min(1, "Denomination is required"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const prefectures = [
  { value: "1", label: "Tokyo" },
  { value: "2", label: "Osaka" },
  { value: "3", label: "Kyoto" },
];

const cities = [
  { value: "1", label: "Shibuya" },
  { value: "2", label: "Shinjuku" },
  { value: "3", label: "Minato" },
];

const denominations = [
  { value: "1", label: "Non-denominational" },
  { value: "2", label: "Baptist" },
  { value: "3", label: "Presbyterian" },
];

export default function SettingsPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "My Church",
      email: "info@mychurch.com",
      phone: "",
      website: "",
      address: "",
      postalCode: "",
      prefectureId: "",
      cityId: "",
      denominationId: "",
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    // TODO: Implement GraphQL mutation
    console.log("Settings data:", data);
    alert("Settings updated successfully!");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Church Settings</h1>
        <p className="mt-1 text-gray-600">
          Manage your church's basic information and settings
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
            <div className="mt-4 space-y-4">
              <FormInput
                label="Church Name"
                name="name"
                register={register}
                error={errors.name}
                placeholder="My Church"
                required
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  register={register}
                  error={errors.email}
                  placeholder="info@church.com"
                  required
                />
                <FormInput
                  label="Phone"
                  name="phone"
                  register={register}
                  error={errors.phone}
                  placeholder="+81 3-1234-5678"
                />
              </div>

              <FormInput
                label="Website"
                name="website"
                type="url"
                register={register}
                error={errors.website}
                placeholder="https://www.church.com"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900">Location</h2>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormSelect
                  label="Prefecture"
                  name="prefectureId"
                  register={register}
                  error={errors.prefectureId}
                  options={prefectures}
                  required
                />
                <FormSelect
                  label="City"
                  name="cityId"
                  register={register}
                  error={errors.cityId}
                  options={cities}
                  required
                />
              </div>

              <FormInput
                label="Address"
                name="address"
                register={register}
                error={errors.address}
                placeholder="1-2-3 Street Name"
                required
              />

              <FormInput
                label="Postal Code"
                name="postalCode"
                register={register}
                error={errors.postalCode}
                placeholder="123-4567"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Church Details
            </h2>
            <div className="mt-4">
              <FormSelect
                label="Denomination"
                name="denominationId"
                register={register}
                error={errors.denominationId}
                options={denominations}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-6">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
