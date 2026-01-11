import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormSelectOption {
    value: string;
    label: string;
}

export interface FormSelectProps
    extends Omit<React.ComponentProps<"select">, "children"> {
    label: string;
    options: FormSelectOption[];
    error?: string;
    helperText?: string;
    required?: boolean;
    containerClassName?: string;
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
    (
        {
            label,
            options,
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
        const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, "-") || "select"}`;

        return (
            <div className={cn("space-y-2", containerClassName)}>
                <label
                    htmlFor={selectId}
                    className="text-sm font-medium text-foreground block"
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            "flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer pr-9",
                            error &&
                                "border-destructive focus-visible:ring-destructive",
                            className
                        )}
                        style={{
                            colorScheme: 'dark',
                        }}
                        {...props}
                    >
                        {options.map((option) => (
                            <option 
                                key={option.value} 
                                value={option.value}
                                style={{
                                    backgroundColor: 'var(--background)',
                                    color: 'var(--foreground)',
                                }}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                            className="h-4 w-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </div>
                </div>
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

FormSelect.displayName = "FormSelect";

export { FormSelect };

