import { Container } from '@/components/ui/Container';
import { Announcement } from '@/types';
import { format } from 'date-fns';
import { Megaphone } from 'lucide-react';
import Image from 'next/image';
import { getBaseUrl } from '@/lib/server-base-url';

// This function runs on the server to fetch the data
async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/announcements`, { cache: 'no-store' });
    if (!res.ok) {
      console.error("Failed to fetch announcements:", res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error("Error in getAnnouncements:", error);
    return [];
  }
}

// --- Helper Component for a single announcement post ---
function AnnouncementPost({ announcement }: { announcement: Announcement }) {
  return (
    <article className="bg-white rounded-2xl shadow-xl overflow-hidden group transition-shadow duration-300 hover:shadow-2xl">
      <div className="bg-gray-100 relative w-full max-h-[600px] flex items-center justify-center">
        {announcement.imageUrl && (
          <Image
            src={announcement.imageUrl}
            alt={announcement.title}
            width={1200}
            height={600}
            className="w-full h-auto object-contain max-h-[600px]"
            priority
          />
        )}
      </div>
      <div className="p-8 md:p-10">
        <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider">{format(new Date(announcement.createdAt), 'MMMM d, yyyy')}</p>
        <h2 className="font-extrabold text-3xl md:text-4xl text-gray-900 mt-2 mb-4 leading-tight">{announcement.title}</h2>
        <p className="text-gray-600 text-lg leading-relaxed">{announcement.description}</p>
      </div>
    </article>
  );
}

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="bg-gray-50 min-h-screen">
      <Container className="py-20 md:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center bg-indigo-100 text-indigo-800 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            <Megaphone className="w-4 h-4 mr-2" />
            Official Announcements
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl tracking-tighter">
            Stay Up to Date
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            The latest news, updates, and important notices from our platform.
          </p>
        </div>
        <div className="mt-16 max-w-4xl mx-auto">
          {announcements.length > 0 ? (
            <div className="space-y-12">
              {announcements.map(ann => (
                <AnnouncementPost key={ann.id} announcement={ann} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-6 bg-white rounded-lg shadow-md">
              <Megaphone className="w-16 h-16 mx-auto text-gray-300" />
              <h2 className="mt-4 text-2xl font-bold text-gray-800">No Announcements Yet</h2>
              <p className="mt-2 text-gray-500">Check back soon for the latest news and updates!</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
