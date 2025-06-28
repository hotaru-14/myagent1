"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
  variant?: "error" | "warning";
}

export function ErrorMessage({ 
  message, 
  onDismiss,
  className = "",
  variant = "error"
}: ErrorMessageProps) {
  const variantClasses = {
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700"
  };

  return (
    <div className={`p-3 border rounded-lg text-sm flex items-start gap-2 ${variantClasses[variant]} ${className}`}>
      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">
          {variant === "error" ? "エラー" : "警告"}:
        </span>{" "}
        {message}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-black/5 rounded-md transition-colors"
          aria-label="エラーメッセージを閉じる"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
} 