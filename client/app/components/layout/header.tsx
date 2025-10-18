"use client";

import Image from "next/image";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/app/components/ui/navigation-menu";
import { Mail, Menu, Phone, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import Link from "next/link";
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileClick = () => {
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <>
      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={closeMobileMenu}
        />

        {/* Mobile Menu Panel */}
        <div
          className={`fixed inset-y-0 left-0 w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <Image
              src="/logo_mobile-CAcWnLNi.svg"
              alt="Mobile Logo"
              width={107}
              height={54}
            />
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="px-4 py-6">
            {/* Navigation Links */}
            <nav className="space-y-6">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="block text-lg font-medium text-gray-900 hover:text-blue-900"
              >
                Acceuil
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className="block text-lg font-medium text-gray-900 hover:text-blue-900"
              >
                A propos
              </Link>
              <Link
                href="/book"
                onClick={closeMobileMenu}
                className="block text-lg font-medium text-gray-900 hover:text-blue-900"
              >
                Consultations
              </Link>
              <Link
                href="/blog"
                onClick={closeMobileMenu}
                className="block text-lg font-medium text-gray-900 hover:text-blue-900"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                onClick={closeMobileMenu}
                className="block text-lg font-medium text-gray-900 hover:text-blue-900"
              >
                Contact
              </Link>
            </nav>

            {/* CTA Button */}
            <div className="mt-8">
              <Link href="/book" onClick={closeMobileMenu}>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  Prendre Rendez-vous
                </Button>
              </Link>
            </div>
            {/* Contact Info */}
            <div className="mb-12 space-y-4 mt-8">
              <a
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                href="tel:+2120123456789"
              >
                <Phone size={20} />
                <span>+212 0 00 00 00 00</span>
              </a>
              <a
                className="flex items-center gap-3 text-gray-700 hover:text-blue-600"
                href="mailto:contact@malikalkhabir.ma"
              >
                <Mail size={20} />
                <span>contact@malikalkhabir.ma</span>
              </a>
            </div>
            <Link href="/admin" className="flex gap-1 items-center">
              <span className="text-sm underline">Espace Admin</span>
            </Link>
          </div>
        </div>
      </div>
      <aside
        role="banner"
        className="bg-neutral-100 relative text-center py-4 px-4 justify-center md:justify-start flex items-center gap-2"
      >
        <a
          className="text-xs md:text-sm flex gap-1 items-center"
          href="tel:+2120123456789"
        >
          <Phone size={20} />
          <span className="text-xs md:text-sm">+212 1 23 45 67 89</span>
        </a>
        <Separator orientation="vertical" />

        <a
          className="text-xs md:text-sm flex gap-1 items-center"
          href="mailto:contact@malikalkhabir.ma"
        >
          <Mail size={20} />
          <span className="text-xs md:text-sm">contact@malikalkhabir.ma</span>
        </a>
        <Link
          href="/admin"
          className="absolute right-4 flex gap-1 items-center"
        >
          <span className="text-xs hidden md:block md:text-sm underline">
            Espace Admin
          </span>
        </Link>
      </aside>
      <header className="w-full flex justify-center border-b border-gray-200">
        <div className="w-full 1200:w-[1200px] relative">
          <div className="w-full h-20 relative flex items-center justify-center lg:justify-between lg:px-4">
            <Link href="/">
              <Image
                className="hidden lg:block"
                src="/logo_large-BrBZf0MI.svg"
                alt="Large Logo"
                width={250}
                height={28}
              />
              <Image
                className="lg:hidden block"
                src="/logo_mobile-CAcWnLNi.svg"
                alt="Large Logo"
                width={107}
                height={54}
              />
            </Link>
            <Menu
              className="lg:hidden absolute left-4 cursor-pointer"
              onClick={handleMobileClick}
            />
            <div className="relative">
              <NavigationMenu className="hidden lg:block">
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/">Acceuil</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/about">A propos</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/book">Consultations</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/blog">Blog</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>{" "}
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href="/contact">Contact</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <span className="hidden lg:flex" role="button">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Link href="/book">Prendre Rendez-vous</Link>
              </Button>
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
