import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

const StatCard = ({ title, value, icon: Icon, iconColor = "text-accent" }: StatCardProps) => {
  return (
    <Card className="p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-4xl font-bold">{value}</p>
        </div>
        <Icon className={`h-16 w-16 ${iconColor}`} />
      </div>
    </Card>
  );
};

export default StatCard;
