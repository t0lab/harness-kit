import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  href?: string;
};

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  href = "/",
}: LogoProps) {
  const content = (
    <>
      <Image
        src="/icon.svg"
        alt="Harness Kit logo"
        width={32}
        height={32}
        className={cn("size-8 shrink-0 object-contain", iconClassName)}
      />
      {showText ? <span className={cn("shrink-0", textClassName)}>Harness Kit</span> : null}
    </>
  );

  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      {content}
    </Link>
  );
}
