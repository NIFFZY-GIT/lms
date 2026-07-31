import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Announcement } from '@/types';
import { format } from 'date-fns';
import { Megaphone } from 'lucide-react';
import Image from 'next/image';
import { getPublicAnnouncements } from '@/lib/announcements';
import { AdSenseBanner } from '@/components/ui/AdSenseBanner';

// Cache and refresh periodically for smoother navigations.
export const revalidate = 300;

// --- Helper Component for a single announcement post ---
function AnnouncementPost({ announcement, priority }: { announcement: Announcement; priority: boolean }) {
  return (
    <article className="landing-card overflow-hidden">
      {announcement.imageUrl && (
        <div className="relative flex max-h-[600px] w-full items-center justify-center bg-slate-100">
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            width={1200}
            height={600}
            sizes="(min-width: 1024px) 56rem, 100vw"
            className="h-auto max-h-[600px] w-full object-contain"
            priority={priority}
          />
        </div>
      )}
      <div className="p-6 sm:p-8 md:p-10">
        <p className="landing-eyebrow">{format(new Date(announcement.createdAt), 'MMMM d, yyyy')}</p>
        <h2 className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl">
          {announcement.title}
        </h2>
        <p className="landing-sub mt-4">{announcement.description}</p>
      </div>
    </article>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getPublicAnnouncements();
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_IN_CONTENT_SLOT ?? '';

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Official Announcements"
        eyebrowIcon={Megaphone}
        title="Stay up to date"
        subtitle="The latest news, updates, and important notices from our platform."
      />

      <Container className="py-14 md:py-20">
        <AdSenseBanner slot={adSlot} className="mx-auto mb-12 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" />

        <div className="mx-auto max-w-4xl">
          {announcements.length > 0 ? (
            <div className="space-y-10">
              {announcements.map((ann, index) => (
                // Only the first post is above the fold.
                <AnnouncementPost key={ann.id} announcement={ann} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="landing-card px-6 py-20 text-center">
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                <Megaphone className="h-8 w-8" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-bold text-slate-900">No announcements yet</h2>
              <p className="landing-sub mt-2">Check back soon for the latest news and updates.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
