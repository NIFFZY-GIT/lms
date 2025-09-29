// src/app/page.tsx — redirect root to default locale

import { redirect } from 'next/navigation';

export default function LandingPage() {
  // Redirect the root path to the default locale so the localized layout (with Navbar) is used.
  redirect('/si');
}



// Ensure you have these placeholder images for testing:
// /public/images/avatars/avatar-1.jpg
// /public/images/avatars/avatar-2.jpg
// /public/images/avatars/avatar-3.jpg
// /public/images/avatars/avatar-4.jpg
// /public/images/avatars/avatar-6.jpg
// /public/images/courses/react-course.jpg (e.g., a laptop with React code)
// /public/images/courses/ml-course.jpg (e.g., data visualization, AI concepts)
// /public/images/courses/uiux-course.jpg (e.g., a person designing on a tablet)
// /public/images/how-it-works-1.jpg (e.g., someone browsing courses on a tablet)
// /public/images/how-it-works-2.jpg (e.g., someone engaged in a video lesson or coding)
// /public/images/how-it-works-3.jpg (e.g., a certificate being held, someone in a professional setting)
// /public/images/impact-accelerated-learning.jpg (e.g., someone quickly typing, a brain graphic)
// /public/images/impact-global-community.jpg (e.g., diverse people collaborating online)
// /public/images/impact-verified-credentials.jpg (e.g., a professional looking at a certificate)
// /public/videos/hero-video.mp4 (e.g., montage of people learning, coding, collaborating, achieving goals)