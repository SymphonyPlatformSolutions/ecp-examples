import symphonyMarkImage from '../assets/SYM-S-logo-640 (1).png';

interface SymphonyMarkProps {
  className?: string;
}

export default function SymphonyMark({ className }: SymphonyMarkProps) {
  return <img src={symphonyMarkImage} alt="" aria-hidden="true" className={className} />;
}
