import { useState } from "react";
import { Volume2, Pencil, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditNameDialog } from "./EditNameDialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface MapHeaderProps {
  userName: string;
}

export function MapHeader({ userName }: MapHeaderProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);

  const handleLogout = () => {
    queryClient.clear();
    clear();
  };

  return (
    <>
      <header className="bg-card border-b border-border px-4 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <span className="text-lg font-semibold text-foreground">HushMap</span>
        </div>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0"
            >
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[1001]">
            <DropdownMenuLabel>Welcome, {userName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditNameDialogOpen(true)}>
              <Pencil className="h-4 w-4" />
              Edit Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <EditNameDialog
        open={editNameDialogOpen}
        onOpenChange={setEditNameDialogOpen}
        currentName={userName}
      />
    </>
  );
}
