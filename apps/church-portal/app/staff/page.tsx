"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/form-input";
import { FormTextarea } from "@/components/form-textarea";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

const staffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

type StaffFormData = z.infer<typeof staffSchema>;

// Mock data
const mockStaff = [
  {
    id: "1",
    name: "John Smith",
    title: "Senior Pastor",
    role: "Lead Pastor",
    bio: "Pastor John has been serving at our church for over 10 years...",
    email: "john@church.com",
    order: 0,
  },
];

export default function StaffPage() {
  const [staff, setStaff] = useState(mockStaff);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
  });

  const onSubmit = async (data: StaffFormData) => {
    // TODO: Implement GraphQL mutation
    console.log("Staff data:", data);
    alert("Staff member saved successfully!");
    setIsAdding(false);
    setEditingId(null);
    reset();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      // TODO: Implement GraphQL mutation
      setStaff(staff.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff & Leadership</h1>
          <p className="mt-1 text-gray-600">
            Manage your church's pastoral team and leaders
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
          Add Staff Member
        </button>
      </div>

      <div className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isAdding ? "Add Staff Member" : "Edit Staff Member"}
              </h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormInput
                  label="Name"
                  name="name"
                  register={register}
                  error={errors.name}
                  placeholder="John Smith"
                  required
                />
                <FormInput
                  label="Title"
                  name="title"
                  register={register}
                  error={errors.title}
                  placeholder="Senior Pastor"
                />
              </div>

              <FormInput
                label="Role"
                name="role"
                register={register}
                error={errors.role}
                placeholder="Lead Pastor"
              />

              <FormInput
                label="Email"
                name="email"
                type="email"
                register={register}
                error={errors.email}
                placeholder="pastor@church.com"
              />

              <FormTextarea
                label="Bio"
                name="bio"
                register={register}
                error={errors.bio}
                placeholder="Share about this person's background and ministry..."
                rows={4}
              />

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
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

        {/* Staff List */}
        {staff.length > 0 ? (
          <div className="space-y-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="rounded-lg border bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {member.name}
                    </h3>
                    {member.title && (
                      <p className="text-sm text-gray-600">{member.title}</p>
                    )}
                    {member.role && (
                      <p className="mt-1 text-sm text-gray-500">{member.role}</p>
                    )}
                    {member.bio && (
                      <p className="mt-3 text-sm text-gray-700">{member.bio}</p>
                    )}
                    {member.email && (
                      <p className="mt-2 text-sm text-gray-500">
                        {member.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(member.id)}
                      className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-12 text-center shadow-sm">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No staff members yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by adding your first staff member.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
