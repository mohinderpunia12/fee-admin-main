"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string; // For file inputs
  description?: string; // Helper text below field
}

interface FormModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit: (data: any) => void;
  title: string;
  description?: string;
  fields?: FormField[];
  initialData?: any;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export function FormModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onSubmit,
  title,
  description,
  fields,
  initialData,
  children,
  isLoading = false,
}: FormModalProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const isDialogOpen = open ?? isOpen ?? false;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleClose = (open: boolean) => {
    console.log('[FormModal] Modal close requested, open:', open);
    if (onOpenChange) onOpenChange(open);
    if (!open && onClose) onClose();
    // Only clear form when modal is actually closed (on success, modal closes)
    if (!open) {
      console.log('[FormModal] Modal closed, resetting form data');
      setFormData(initialData || {});
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      console.log('[FormModal] Form submission prevented - already loading');
      return;
    }
    console.log('[FormModal] Form submitted with data:', formData);
    // Don't clear form here - let the parent component handle success/error
    // Form will be cleared when modal closes (which happens on success)
    onSubmit(formData);
  };
  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFormData((prev: any) => ({ ...prev, [name]: file }));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children || (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {fields?.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ) : field.type === "file" ? (
                  <Input
                    id={field.name}
                    type="file"
                    accept={field.accept}
                    onChange={(e) => handleFileChange(field.name, e.target.files?.[0] || null)}
                    required={field.required}
                    disabled={isLoading}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={isLoading}
                  />
                )}
                {field.description && (
                  <p className="text-sm text-gray-500">{field.description}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
