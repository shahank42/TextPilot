import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "../button";
import MessageLoading from "./message-loading";

// ChatBubble
const chatBubbleVariant = cva("group relative flex items-end gap-2", {
	variants: {
		variant: {
			received: "self-start",
			sent: "flex-row-reverse self-end",
		},
		layout: {
			default: "",
			ai: "w-full max-w-full items-center",
		},
	},
	defaultVariants: {
		variant: "received",
		layout: "default",
	},
});

interface ChatBubbleProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
	({ className, variant, layout, children, ...props }, ref) => (
		<div
			className={cn(
				chatBubbleVariant({ variant, layout, className }),
				"group relative"
			)}
			ref={ref}
			{...props}
		>
			{React.Children.map(children, (child) =>
				React.isValidElement(child) && typeof child.type !== "string"
					? React.cloneElement(child, {
							variant,
							layout,
						} as React.ComponentProps<typeof child.type>)
					: child
			)}
		</div>
	)
);
ChatBubble.displayName = "ChatBubble";

// ChatBubbleAvatar
interface ChatBubbleAvatarProps {
	src?: string;
	fallback?: string;
	className?: string;
}

const ChatBubbleAvatar: React.FC<ChatBubbleAvatarProps> = ({
	src,
	fallback,
	className,
}) => (
	<Avatar className={className}>
		<AvatarImage alt="Avatar" src={src} />
		<AvatarFallback>{fallback}</AvatarFallback>
	</Avatar>
);

// ChatBubbleMessage
const chatBubbleMessageVariants = cva("p-4", {
	variants: {
		variant: {
			received:
				"rounded-r-lg rounded-tl-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground/90",
			sent: "rounded-l-lg rounded-tr-lg bg-primary text-primary-foreground hover:bg-primary/80",
		},
		layout: {
			default: "",
			ai: "w-full rounded-none border-t bg-transparent",
		},
	},
	defaultVariants: {
		variant: "received",
		layout: "default",
	},
});

interface ChatBubbleMessageProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof chatBubbleMessageVariants> {
	isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<
	HTMLDivElement,
	ChatBubbleMessageProps
>(
	(
		{ className, variant, layout, isLoading = false, children, ...props },
		ref
	) => (
		<div
			className={cn(
				chatBubbleMessageVariants({ variant, layout, className }),
				"max-w-full whitespace-pre-wrap break-words"
			)}
			ref={ref}
			{...props}
		>
			{isLoading ? (
				<div className="flex items-center space-x-2">
					<MessageLoading />
				</div>
			) : (
				children
			)}
		</div>
	)
);
ChatBubbleMessage.displayName = "ChatBubbleMessage";

// ChatBubbleTimestamp
interface ChatBubbleTimestampProps
	extends React.HTMLAttributes<HTMLDivElement> {
	timestamp: string;
}

const ChatBubbleTimestamp: React.FC<ChatBubbleTimestampProps> = ({
	timestamp,
	className,
	...props
}) => (
	<div className={cn("mt-2 text-right text-xs", className)} {...props}>
		{timestamp}
	</div>
);

// ChatBubbleAction
type ChatBubbleActionProps = ButtonProps & {
	icon: React.ReactNode;
};

const ChatBubbleAction: React.FC<ChatBubbleActionProps> = ({
	icon,
	onClick,
	className,
	variant = "ghost",
	size = "icon",
	...props
}) => (
	<Button
		className={className}
		onClick={onClick}
		size={size}
		variant={variant}
		{...props}
	>
		{icon}
	</Button>
);

interface ChatBubbleActionWrapperProps
	extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "sent" | "received";
	className?: string;
}

const ChatBubbleActionWrapper = React.forwardRef<
	HTMLDivElement,
	ChatBubbleActionWrapperProps
>(({ variant, className, children, ...props }, ref) => (
	<div
		className={cn(
			"-translate-y-1/2 absolute top-1/2 flex opacity-0 transition-opacity duration-200 group-hover:opacity-100",
			variant === "sent"
				? "-left-1 -translate-x-full flex-row-reverse"
				: "-right-1 translate-x-full",
			className
		)}
		ref={ref}
		{...props}
	>
		{children}
	</div>
));
ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper";

export {
	ChatBubble,
	ChatBubbleAvatar,
	ChatBubbleMessage,
	ChatBubbleTimestamp,
	chatBubbleVariant,
	chatBubbleMessageVariants,
	ChatBubbleAction,
	ChatBubbleActionWrapper,
};
