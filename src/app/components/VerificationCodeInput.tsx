"use client";
import { useState, useRef, useEffect } from "react";

interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function VerificationCodeInput({
  value,
  onChange,
  disabled = false,
  error = false,
}: VerificationCodeInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow digits
    if (!/^\d*$/.test(inputValue)) return;

    const newValue = value.split("");
    newValue[index] = inputValue;
    const result = newValue.join("").slice(0, 6);
    onChange(result);

    // Auto-focus next input if current input has a value
    if (inputValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[index] === "") {
        // If current input is empty, go to previous input and clear it
        if (index > 0) {
          const newValue = value.split("");
          newValue[index - 1] = "";
          onChange(newValue.join(""));
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Clear current input
        const newValue = value.split("");
        newValue[index] = "";
        onChange(newValue.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    onChange(pastedData);
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(-1)}
          disabled={disabled}
          className={`
            w-12 h-12 text-center text-lg font-mono font-bold
            border-2 rounded-xl transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-pink-300/50
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error 
              ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500 focus:ring-red-300/50" 
              : focusedIndex === index
              ? "border-pink-500 bg-pink-50 text-pink-700"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }
          `}
        />
      ))}
    </div>
  );
} 