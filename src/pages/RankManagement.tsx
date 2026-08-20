import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp } from "lucide-react";

export default function RankManagement() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Rank & Promotions</h1>
          <p className="text-sm text-slate-400">Track personnel career progression, performance reviews, and promotion eligibility.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Eligible for Promotion</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">3 Personnel</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending Reviews</CardTitle>
            <Award className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">1 Review</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Recent Promotion Track</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <p className="font-medium text-white">Jai Singh</p>
                <p className="text-xs text-slate-500">Operations Associate $\rightarrow$ Senior Associate</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">Approved</span>
            </div>
            <div className="flex justify-between items-center pb-3">
              <div>
                <p className="font-medium text-white">Alex Hawk</p>
                <p className="text-xs text-slate-500">Lieutenant $\rightarrow$ Captain / HR</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">Approved</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}