import * as React from "react";
import { cn } from "../lib/utils";

const Nav = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("flex items-center space-x-4 lg:space-x-6", className)}
    {...props}
  />
));
Nav.displayName = "Nav";

const NavItem = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    active?: boolean;
  }
>(({ className, active, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "text-sm font-medium transition-colors hover:text-primary",
      active ? "text-primary" : "text-slate-700",
      className
    )}
    {...props}
  />
));
NavItem.displayName = "NavItem";

const NavMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center space-x-2", className)}
    {...props}
  />
));
NavMenu.displayName = "NavMenu";

const NavBrand = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center space-x-2 font-bold text-lg", className)}
    {...props}
  />
));
NavBrand.displayName = "NavBrand";

export { Nav, NavItem, NavMenu, NavBrand };
