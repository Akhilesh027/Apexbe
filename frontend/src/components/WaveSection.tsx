import { ReactNode } from "react";

interface WaveSectionProps {
  children: ReactNode;
  bgColor?: string;
  waveColor?: string;
}

const WaveSection = ({ children, bgColor = "bg-navy", waveColor = "bg-background" }: WaveSectionProps) => {
  return (
    <div className="relative">
      <div className={`${bgColor} py-12`}>
        {children}
      </div>
      <div className="relative h-16 overflow-hidden">
        <svg
          className={`absolute bottom-0 w-full ${waveColor}`}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ height: '100%' }}
        >
          <path
            d="M0,0 C150,80 350,80 600,50 C850,20 1050,20 1200,50 L1200,120 L0,120 Z"
            className={bgColor.replace('bg-', 'fill-')}
          />
        </svg>
      </div>
    </div>
  );
};

export default WaveSection;
