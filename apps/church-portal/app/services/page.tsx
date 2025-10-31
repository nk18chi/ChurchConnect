"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/form-input";
import { FormSelect } from "@/components/form-select";
import { Plus, Edit2, Trash2, Save, X, Clock } from "lucide-react";

const serviceSchema = z.object({
  dayOfWeek: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  languageId: z.string().min(1, "Language is required"),
  serviceType: z.string().optional(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

const days = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const languages = [
  { value: "1", label: "Japanese" },
  { value: "2", label: "English" },
  { value: "3", label: "Korean" },
];

// Mock data
const mockServices = [
  {
    id: "1",
    dayOfWeek: 0,
    startTime: "10:00",
    endTime: "11:30",
    language: "English",
    serviceType: "Sunday Service",
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState(mockServices);
  const [isAdding, setIsAdding] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const onSubmit = async (data: ServiceFormData) => {
    // TODO: Implement GraphQL mutation
    console.log("Service data:", data);
    alert("Service time saved successfully!");
    setIsAdding(false);
    reset();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this service time?")) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Times</h1>
          <p className="mt-1 text-gray-600">
            Manage your weekly service schedule
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            reset();
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Service Time
        </button>
      </div>

      <div className="space-y-4">
        {isAdding && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Service Time
              </h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormSelect
                  label="Day of Week"
                  name="dayOfWeek"
                  register={register}
                  error={errors.dayOfWeek}
                  options={days}
                  required
                />
                <FormSelect
                  label="Language"
                  name="languageId"
                  register={register}
                  error={errors.languageId}
                  options={languages}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormInput
                  label="Start Time"
                  name="startTime"
                  type="time"
                  register={register}
                  error={errors.startTime}
                  required
                />
                <FormInput
                  label="End Time"
                  name="endTime"
                  type="time"
                  register={register}
                  error={errors.endTime}
                />
                <FormInput
                  label="Service Type"
                  name="serviceType"
                  register={register}
                  error={errors.serviceType}
                  placeholder="e.g., Sunday Service"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    reset();
                  }}
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
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {services.length > 0 ? (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {days[service.dayOfWeek].label}
                    </h3>
                    <p className="mt-1 text-gray-600">
                      {service.startTime}
                      {service.endTime && ` - ${service.endTime}`}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {service.language}
                      </span>
                      {service.serviceType && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {service.serviceType}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No service times yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first service time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
