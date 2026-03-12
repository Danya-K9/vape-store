export const PHONE = '+375295397510';
const BASE_ICONS = {
  telegram: '/tg_ikon.png',
  instagram: '/instagram_ikon.png',
  viber: '/viber_ikon.png',
  whatsapp: '/whatsapp_ikon.png',
};

// Header (white bar): keep current YouTube, use new TikTok
export const SOCIAL_ICONS_HEADER = {
  ...BASE_ICONS,
  tiktok: '/tiktok_header.png',
  youtube: '/youtube_ikon.png',
};

// Footer (black bar): keep current TikTok, revert YouTube to previous image
export const SOCIAL_ICONS_FOOTER = {
  ...BASE_ICONS,
  tiktok: '/tiktok_ikon.webp',
  youtube: '/youtube_footer.png',
};

// Default (used on some pages like Contacts) — match header style
export const SOCIAL_ICONS = SOCIAL_ICONS_HEADER;
