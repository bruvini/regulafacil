
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InfoBlockProps {
  title: string;
  icon: ReactNode;
  data: string[];
}

export const InfoBlock = ({ title, icon, data }: InfoBlockProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-medical-primary">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1 text-xs">
          {data.map((item, index) => (
            <li 
              key={index} 
              className={
                item === "Sem registros" 
                  ? "italic text-muted-foreground" 
                  : "text-foreground"
              }
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
