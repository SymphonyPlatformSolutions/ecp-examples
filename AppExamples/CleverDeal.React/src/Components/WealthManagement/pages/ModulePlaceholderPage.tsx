import { BriefcaseBusiness } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ModulePlaceholderPageProps {
  title: string;
  description: string;
}

export default function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-1 text-[14px] text-slate-500">{description}</p>
      </div>

      <Card className="border-slate-200 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
        <CardHeader className="border-b border-slate-100">
          <CardTitle>Module Coming Next</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-slate-100 p-4 text-slate-500">
            <BriefcaseBusiness className="h-8 w-8" />
          </div>
          <div>
            <div className="text-[18px] font-semibold text-slate-900">{title}</div>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-slate-500">{description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
