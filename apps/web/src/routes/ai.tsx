import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/ai")({
	component: RouteComponent,
});

function RouteComponent() {
	const { messages, input, handleInputChange, handleSubmit } = useChat({
		api: `${import.meta.env.VITE_SERVER_URL}/ai`,
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	return (
		<div className="mx-auto grid w-full grid-rows-[1fr_auto] overflow-hidden p-4">
			<div className="space-y-4 overflow-y-auto pb-4">
				{messages.length === 0 ? (
					<div className="mt-8 text-center text-muted-foreground">
						Ask me anything to get started!
					</div>
				) : (
					messages.map((message) => (
						<div
							className={`rounded-lg p-3 ${
								message.role === "user"
									? "ml-8 bg-primary/10"
									: "mr-8 bg-secondary/20"
							}`}
							key={message.id}
						>
							<p className="mb-1 font-semibold text-sm">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							<div className="whitespace-pre-wrap">{message.content}</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			<form
				className="flex w-full items-center space-x-2 border-t pt-2"
				onSubmit={handleSubmit}
			>
				<Input
					autoComplete="off"
					autoFocus
					className="flex-1"
					name="prompt"
					onChange={handleInputChange}
					placeholder="Type your message..."
					value={input}
				/>
				<Button size="icon" type="submit">
					<Send size={18} />
				</Button>
			</form>
		</div>
	);
}
