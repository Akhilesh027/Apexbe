import { Link } from "react-router-dom";

interface CategoryIconProps {
  icon: string;
  label: string;
  to?: string;
}

const CategoryIcon = ({ icon, label, to = "/" }: CategoryIconProps) => {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 group">
      <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-3xl group-hover:shadow-lg transition-shadow">
        {icon}
      </div>
      <span className="text-xs text-center text-foreground group-hover:text-accent transition-colors">
        {label}
      </span>
    </Link>
  );
};

export default CategoryIcon;
