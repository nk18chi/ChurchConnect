"use client";

import { UseFormRegister, FieldError } from "react-hook-form";

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  placeholder?: string;
  required?: boolean;
}

export function FormInput({
  label,
  name,
  type = "text",
  register,
  error,
  placeholder,
  required,
}: FormInputProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        {...register(name)}
        className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholder={placeholder}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
