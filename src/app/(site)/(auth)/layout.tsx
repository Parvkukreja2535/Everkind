import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="wrap grid items-start gap-12 py-12 lg:grid-cols-[1fr_1fr] lg:py-16">
      <div className="mx-auto w-full max-w-[440px]">{children}</div>
      <div className="relative hidden aspect-[10/11] overflow-hidden rounded-[18px] lg:block">
        <Image src="/images/home/hero-bright-flat.jpg" alt="" fill sizes="560px" className="object-cover" />
      </div>
    </div>
  );
}
