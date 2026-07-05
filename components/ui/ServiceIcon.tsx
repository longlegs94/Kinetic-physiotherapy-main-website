import {
  Activity,
  HandHelping,
  Bone,
  Dumbbell,
  Sparkles,
  Car,
  Baby,
  Zap,
  Footprints,
  HeartPulse,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps a service short name to a consistent line icon.
 * Falls back to a generic recovery icon.
 */
const iconMap: Record<string, LucideIcon> = {
  Physio: Activity,
  Massage: HandHelping,
  Chiro: Bone,
  Kinesiology: Dumbbell,
  Acupuncture: Sparkles,
  ICBC: Car,
  "Pregnancy Massage": Baby,
  Shockwave: Zap,
  "Orthotics & Bracing": Footprints,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? HeartPulse;
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}

export { Stethoscope };
