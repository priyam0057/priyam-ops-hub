import { Link, LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
}

export function NavLink({ className, activeClassName, ...props }: NavLinkProps) {
  return <Link className={cn(className)} {...props} />;
}
