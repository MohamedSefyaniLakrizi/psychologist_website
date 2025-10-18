import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Logout() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="truncate font-medium flex items-center cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut />
          Se déconnecter
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
