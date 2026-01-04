import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface FormInputProps extends React.ComponentProps<"input"> {
    label: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    containerClassName?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
    (
        {
            label,
            error,
            helperText,
            required = false,
            containerClassName,
            className,
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

        return (
            <div className={cn("space-y-2", containerClassName)}>
                <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-foreground block"
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
                <Input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        error && "border-destructive focus-visible:ring-destructive",
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-xs text-destructive mt-1.5">{error}</p>
                )}
                {!error && helperText && (
                    <p className="text-xs text-muted-foreground mt-1.5">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

FormInput.displayName = "FormInput";

export { FormInput };

