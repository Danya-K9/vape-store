export const PHONE = '+375295397510';
const BASE_ICONS = {
  telegram: '/tg_ikon.png',
  instagram: '/instagram_ikon.png',
  viber: '/viber_ikon.png',
  whatsapp: '/whatsapp_ikon.png',
};

// Header (white bar)
export const SOCIAL_ICONS_HEADER = {
  ...BASE_ICONS,
};

// Footer (black bar)
export const SOCIAL_ICONS_FOOTER = {
  ...BASE_ICONS,
};

// Default (used on some pages like Contacts) — match header style
export const SOCIAL_ICONS = SOCIAL_ICONS_HEADER;
