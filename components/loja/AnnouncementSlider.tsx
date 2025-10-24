"use client";
import Marquee from 'react-fast-marquee';

interface AnnouncementSliderProps {
  messages: string[];
  backgroundColor: string;
  textColor?: string;
  speed?: number;
}

export default function AnnouncementSlider({ 
  messages, 
  backgroundColor,
  textColor = '#FFFFFF',
  speed = 50,
  fontSize = 14
}: AnnouncementSliderProps & { fontSize?: number }) {
  
  console.log('[AnnouncementSlider] Received messages:', messages);

  if (!messages || messages.length === 0) {
    console.log('[AnnouncementSlider] No messages, hiding');
    return null;
  }

  return (
    <div 
      className="w-full py-2.5"
      style={{ backgroundColor }}
    >
      <Marquee 
        speed={speed}
        gradient={false}
        pauseOnHover={true}
        className="text-sm font-medium"
      >
        {messages.map((mensagem, index) => (
          <span 
            key={index} 
            className="mx-8"
            style={{ color: textColor, fontSize: `${fontSize}px` }}
          >
            {mensagem}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
