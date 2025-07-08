import { ArrowDown } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useAutoScroll } from "@/components/ui/chat/hooks/useAutoScroll";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
	smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
	({ className, children, smooth = false, ...props }, _ref) => {
		const {
			scrollRef,
			isAtBottom,
			autoScrollEnabled,
			scrollToBottom,
			disableAutoScroll,
		} = useAutoScroll({
			smooth,
			content: children,
		});

		return (
			<div
				className={`relative flex h-full w-full flex-col overflow-y-auto p-4 ${className}`}
				onTouchMove={disableAutoScroll}
				onWheel={disableAutoScroll}
				ref={scrollRef}
				{...props}
			>
				<div className="flex flex-col gap-6">{children}</div>
			</div>
		);
	}
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList };
