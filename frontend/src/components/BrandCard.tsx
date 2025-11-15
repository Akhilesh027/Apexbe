import { Link } from "react-router-dom";

interface BrandCardProps {
  name: string;
  logo: string;
  to?: string;
}

const BrandCard = ({ name, logo, to = "/vendors" }: BrandCardProps) => {
  return (
    <Link to={to}>
      <div className="bg-white rounded-xl shadow-md p-4 flex items-center justify-center h-24 hover:shadow-lg transition-shadow group">
        <img 
          src={logo} 
          alt={name} 
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform" 
        />
      </div>
    </Link>
  );
};

export default BrandCard;
