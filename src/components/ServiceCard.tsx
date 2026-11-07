import Image from "next/image";
import Link from "next/link";
import { AvailabilityChip } from "./AvailabilityChip";
import { getCategory, priceLabel, serviceHref, type Service } from "@/lib/catalogue";

export function ServiceCard({ service }: { service: Service }) {
  const cat = getCategory(service.category);
  const muted = service.availability !== "available_now";
  return (
    <Link href={serviceHref(service)} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(0,0,0,0.45)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface">
        <Image src={service.image} alt="" fill sizes="(min-width:1024px) 300px, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
        <AvailabilityChip availability={service.availability} className="absolute left-3 top-3" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium text-text-muted">{cat?.name}{service.everkindAddition ? " · Everkind service" : ""}</span>
        <h3 className="text-[17px] font-semibold leading-snug">{service.name}</h3>
        <p className="text-sm leading-relaxed text-text-muted">{service.summary}</p>
        {service.options && <p className="text-sm text-text-muted"><span className="font-semibold text-green">Includes:</span> flat-pack assembly option</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm">
          <span className={muted ? "font-medium text-text-muted" : "font-semibold tabular-nums"}>{priceLabel(service)}</span>
          <span className="font-semibold text-green">View details →</span>
        </div>
      </div>
    </Link>
  );
}
