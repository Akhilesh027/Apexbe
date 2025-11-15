import { Link } from "react-router-dom";

interface StoreCardProps {
  name: string;
  tagline: string;
  image: string;
  to?: string;
}

const StoreCard = ({ name, tagline, image, to = "/vendors" }: StoreCardProps) => {
  return (
    <Link to={to}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group">
        <div className="aspect-square p-8 flex items-center justify-center">
          <img 
            src={image} 
            alt={name} 
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
          />
        </div>
        <div className="p-4 text-center bg-white">
          <h3 className="font-bold text-navy text-lg mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground">{tagline}</p>
        </div>
      </div>
    </Link>
  );
};

export default StoreCard;
