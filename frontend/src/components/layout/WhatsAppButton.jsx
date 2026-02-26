import { MessageCircle } from 'lucide-react';

export const WhatsAppButton = () => {
  const phoneNumber = '2348012345678';
  const message = encodeURIComponent('Hello, I would like to inquire about your civil engineering services.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 whatsapp-pulse"
      aria-label="Contact us on WhatsApp"
      data-testid="whatsapp-btn"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
};
