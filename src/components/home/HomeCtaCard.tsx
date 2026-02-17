import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type Cta = {
  label: string;
  to: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
};

export type HomeCtaCardProps = {
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  imageSide?: 'left' | 'right';
  primaryCta: Cta;
  secondaryCta?: Cta;
};

export function HomeCtaCard({
  title,
  description,
  imageUrl,
  imageAlt,
  imageSide = 'left',
  primaryCta,
  secondaryCta,
}: HomeCtaCardProps) {
  const PrimaryIcon = primaryCta.icon;
  const SecondaryIcon = secondaryCta?.icon;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 shadow-sm backdrop-blur">
      <div className={cn('flex gap-4 p-3 sm:p-4', imageSide === 'right' && 'flex-row-reverse')}>
        <div className="w-[42%] min-w-[140px] overflow-hidden rounded-xl bg-gray-100">
          <img src={imageUrl} alt={imageAlt} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col justify-center py-1">
          <h3 className="whitespace-pre-line text-lg font-semibold leading-snug text-gray-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className={cn(
                'h-9 rounded-lg px-4 text-sm font-semibold',
                primaryCta.variant === 'secondary'
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  : 'bg-red-500 text-white hover:bg-red-600'
              )}
            >
              <Link to={primaryCta.to} className="flex items-center gap-2">
                {PrimaryIcon ? <PrimaryIcon className="h-4 w-4" /> : null}
                <span>{primaryCta.label}</span>
              </Link>
            </Button>
            {secondaryCta ? (
              <Link
                to={secondaryCta.to}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {SecondaryIcon ? <SecondaryIcon className="h-4 w-4" /> : null}
                <span>{secondaryCta.label}</span>
                <span aria-hidden="true">›</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
