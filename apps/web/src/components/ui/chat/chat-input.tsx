import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "../textarea";

interface ChatInputProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
	({ className, ...props }, ref) => {
		const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				const form = e.currentTarget.form;
				if (form) {
					const submitEvent = new Event("submit", {
						cancelable: true,
						bubbles: true,
					});
					form.dispatchEvent(submitEvent);
				}
			}
			// onKeyDown?.(e);
		};

		return (
			<Textarea
				autoComplete="off"
				className={cn(
					"flex h-16 max-h-12 w-full resize-none items-center rounded-md bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background",
					className
				)}
				name="message"
				onKeyDown={handleKeyDown}
				ref={ref}
				{...props}
			/>
		);
	}
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
