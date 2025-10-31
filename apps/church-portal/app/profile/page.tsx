"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/form-input";
import { FormTextarea } from "@/components/form-textarea";
import { Save } from "lucide-react";

const profileSchema = z.object({
  whoWeAre: z.string().optional(),
  vision: z.string().optional(),
  statementOfFaith: z.string().optional(),
  storyOfChurch: z.string().optional(),
  kidChurchInfo: z.string().optional(),
  whatToExpect: z.string().optional(),
  dressCode: z.string().optional(),
  worshipStyle: z.string().optional(),
  howToGive: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  externalDonationUrl: z.string().url().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      whoWeAre: "",
      vision: "",
      statementOfFaith: "",
      storyOfChurch: "",
      kidChurchInfo: "",
      whatToExpect: "",
      dressCode: "",
      worshipStyle: "",
      howToGive: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      externalDonationUrl: "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    // TODO: Implement GraphQL mutation
    console.log("Profile data:", data);
    alert("Profile updated successfully!");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Church Profile</h1>
        <p className="mt-1 text-gray-600">
          Share your church's vision, beliefs, and story
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormTextarea
            label="Who We Are"
            name="whoWeAre"
            register={register}
            error={errors.whoWeAre}
            placeholder="Describe your church community..."
            rows={4}
          />

          <FormTextarea
            label="Our Vision"
            name="vision"
            register={register}
            error={errors.vision}
            placeholder="Share your church's vision and mission..."
            rows={4}
          />

          <FormTextarea
            label="Statement of Faith"
            name="statementOfFaith"
            register={register}
            error={errors.statementOfFaith}
            placeholder="What does your church believe?..."
            rows={6}
          />

          <FormTextarea
            label="Story of Our Church"
            name="storyOfChurch"
            register={register}
            error={errors.storyOfChurch}
            placeholder="Share your church's history and story..."
            rows={4}
          />

          <FormTextarea
            label="Kids Church Info"
            name="kidChurchInfo"
            register={register}
            error={errors.kidChurchInfo}
            placeholder="Tell families about your children's ministry..."
            rows={3}
          />

          <FormTextarea
            label="What to Expect"
            name="whatToExpect"
            register={register}
            error={errors.whatToExpect}
            placeholder="Help first-time visitors know what to expect..."
            rows={3}
          />

          <FormInput
            label="Dress Code"
            name="dressCode"
            register={register}
            error={errors.dressCode}
            placeholder="e.g., Casual, Smart casual, Formal"
          />

          <FormInput
            label="Worship Style"
            name="worshipStyle"
            register={register}
            error={errors.worshipStyle}
            placeholder="e.g., Contemporary, Traditional, Blended"
          />

          <div className="border-t pt-6">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              How to Give
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Provide information about how people can support your church
              financially.
            </p>

            <div className="space-y-4">
              <FormTextarea
                label="Giving Instructions"
                name="howToGive"
                register={register}
                error={errors.howToGive}
                placeholder="Explain how people can give to your church..."
                rows={4}
              />

              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Bank Transfer Information (Optional)
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormInput
                    label="Bank Name"
                    name="bankName"
                    register={register}
                    error={errors.bankName}
                    placeholder="e.g., Mizuho Bank"
                  />
                  <FormInput
                    label="Account Name"
                    name="bankAccountName"
                    register={register}
                    error={errors.bankAccountName}
                    placeholder="Account holder name"
                  />
                </div>

                <FormInput
                  label="Account Number"
                  name="bankAccountNumber"
                  register={register}
                  error={errors.bankAccountNumber}
                  placeholder="1234567"
                />
              </div>

              <FormInput
                label="External Donation Link (Optional)"
                name="externalDonationUrl"
                register={register}
                error={errors.externalDonationUrl}
                placeholder="https://..."
                type="url"
              />
              <p className="text-xs text-gray-500">
                Link to external donation platform (e.g., PayPal, Stripe)
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
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
