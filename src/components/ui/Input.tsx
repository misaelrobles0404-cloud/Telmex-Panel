import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Input({
    label,
    error,
    helperText,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="label">
                    {label}
                    {props.required && <span className="text-error ml-1">*</span>}
                </label>
            )}
            <input
                className={`input ${error ? 'border-error focus:ring-error' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export function Textarea({
    label,
    error,
    helperText,
    className = '',
    ...props
}: TextareaProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="label">
                    {label}
                    {props.required && <span className="text-error ml-1">*</span>}
                </label>
            )}
            <textarea
                className={`input ${error ? 'border-error focus:ring-error' : ''} ${className}`}
                rows={4}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({
    label,
    error,
    options,
    className = '',
    ...props
}: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="label">
                    {label}
                    {props.required && <span className="text-error ml-1">*</span>}
                </label>
            )}
            <select
                className={`input ${error ? 'border-error focus:ring-error' : ''} ${className}`}
                {...props}
            >
                <option value="">Seleccionar...</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1 text-sm text-error">{error}</p>
            )}
        </div>
    );
}
