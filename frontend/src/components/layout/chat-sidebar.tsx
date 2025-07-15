import type * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import SearchBar from "../searchbar";

export function ChatsSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader className="py-5 px-4">
        {/* <span className="text-2xl text-center">WhatsApp Chats</span> */}
        <SearchBar />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="">
          <SidebarGroupContent className="flex w-full flex-col">
            {props.children}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
