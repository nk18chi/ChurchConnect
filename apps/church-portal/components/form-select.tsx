"use client";

import { UseFormRegister, FieldError } from "react-hook-form";

interface FormSelectProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export function FormSelect({
  label,
  name,
  register,
  error,
  options,
  required,
  placeholder = "Select an option",
}: FormSelectProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
