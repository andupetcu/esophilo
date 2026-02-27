"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, BookOpen, Sparkles, LogIn, Library, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/traditions", label: "Traditions", icon: BookOpen },
  { href: "/library", label: "Library", icon: Library },
  { href: "/search", label: "Search", icon: Search },
  { href: "/ask", label: "Ask the Sages", icon: Sparkles },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
];

export function Navigation() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-semibold text-primary">
            EsoPhilo
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href} className="gap-1.5 text-muted-foreground hover:text-foreground">
                <link.icon className="size-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Desktop sign in */}
        <div className="hidden items-center md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login" className="gap-1.5 text-muted-foreground hover:text-primary">
              <LogIn className="size-4" />
              Sign In
            </Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-heading text-xl text-primary">
                  EsoPhilo
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-2 pt-4">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    variant="ghost"
                    className="justify-start gap-2 text-muted-foreground hover:text-foreground"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={link.href}>
                      <link.icon className="size-4" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
                <div className="my-3 h-px bg-border" />
                <Button
                  variant="ghost"
                  className="justify-start gap-2 text-muted-foreground hover:text-primary"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/auth/login">
                    <LogIn className="size-4" />
                    Sign In
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
