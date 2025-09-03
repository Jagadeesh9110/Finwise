import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleOTPInputProps {
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const SimpleOTPInput = React.forwardRef<HTMLInputElement, SimpleOTPInputProps>(
  ({ maxLength, value, onChange, className, ...props }, ref) => {
    const [otp, setOtp] = React.useState<string[]>(new Array(maxLength).fill(""));
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

    React.useEffect(() => {
      const otpArray = value.split("").slice(0, maxLength);
      const paddedOtp = [...otpArray, ...new Array(maxLength - otpArray.length).fill("")];
      setOtp(paddedOtp);
    }, [value, maxLength]);

    const handleChange = (index: number, digit: string) => {
      if (digit.length > 1) return;
      
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      
      const newValue = newOtp.join("");
      onChange(newValue);

      if (digit && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").slice(0, maxLength);
      const pasteArray = pasteData.split("");
      const newOtp = [...new Array(maxLength).fill("")];
      
      pasteArray.forEach((char, index) => {
        if (index < maxLength && /^\d$/.test(char)) {
          newOtp[index] = char;
        }
      });
      
      setOtp(newOtp);
      onChange(newOtp.join(""));

      const nextEmptyIndex = newOtp.findIndex(val => val === "");
      const focusIndex = nextEmptyIndex === -1 ? maxLength - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    };

    const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el;
      if (index === 0 && ref) {
        if (typeof ref === 'function') {
          ref(el);
        } else {
          ref.current = el;
        }
      }
    };

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={setInputRef(index)}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              "h-10 w-10 text-center text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "transition-all duration-200"
            )}
            {...props}
          />
        ))}
      </div>
    );
  }
);

SimpleOTPInput.displayName = "SimpleOTPInput";

export { SimpleOTPInput };
