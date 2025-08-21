
import { ReactNode } from 'react';

interface InfoBlockProps {
  title: string;
  icon: ReactNode;
  data: string[];
}

export const InfoBlock = ({ title, icon, data }: InfoBlockProps) => {
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm border">
      <h3 className="text-base font-semibold flex items-center gap-2 mb-3 text-primary">
        {icon}
        {title}
      </h3>
      <div>
        {data.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
            {data.map((item, index) => (
              <li key={index} className="leading-relaxed">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem registros.</p>
        )}
      </div>
    </div>
  );
};
