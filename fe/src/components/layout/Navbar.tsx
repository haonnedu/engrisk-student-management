"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger />

        {/* Logo */}
        <Link href="/" className="font-bold text-xl">
          Ms. Jenny
        </Link>
      </div>

      {/* Actions right*/}
      <div className="ml-auto flex items-center gap-2">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground relative h-8 w-8 rounded-full"
              >
                <User className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.email || user?.phone}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.role}
                  </p>
                </div>
              </div>
              <DropdownMenuItem onClick={logout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="secondary" size="sm">
              Login
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
