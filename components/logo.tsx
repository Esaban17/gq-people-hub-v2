import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 200, height = 180 }: LogoProps) {
  return (
    <Image
      src="/images/gq-logo.png"
      alt="Gruppo Quattro Logo"
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
