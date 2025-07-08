import { ArchiveX, Command, File, Inbox, Send, Trash2 } from "lucide-react";
import type * as React from "react";

import { Label } from "@/components/ui/label";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { ChatsList } from "../../routes/whatsapp/-components/whatsapp-chats-list";

export function SidebarChats({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar className="border-r-0" {...props}>
			{/* <SidebarHeader className="py-5">
        <span className="text-2xl text-center">My WhatsApp Chats</span>
      </SidebarHeader> */}

			<SidebarContent>
				<SidebarGroup className="border-y p-0">
					<SidebarGroupContent className="flex w-full flex-col">
						{props.children}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
