import { useState } from "react";
import { BookOpen, FileText, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader,} from "@/components/ui/card";

export default function DocumentsDashboard() {
  const documents = [
    {
      id: 'sop',
      title: 'SASP Standard Operating Procedure (SOP)',
      icon: <BookOpen className="w-4 h-4 mr-2" />,
      url: 'https://docs.google.com/document/d/1O_G17ln-H-2MLofUvsf6gl4NGmEbmn04icIRm2lnHKQ/preview'
    },
    {
      id: 'roster',
      title: 'SASP Master Roster',
      icon: <FileSpreadsheet className="w-4 h-4 mr-2" />,
      url: 'https://docs.google.com/spreadsheets/d/1yucIZVIu4KlfED4G0zujeGv6oDSZYNK_kbY2uMnpFSk/preview'
    },
    {
      id: 'uniform',
      title: 'LEO Uniform Guide',
      icon: <ShieldAlert className="w-4 h-4 mr-2" />,
      url: 'https://docs.google.com/document/d/1WQFtopQVk7K1QxLjvxB6z20EgitXSJVKxNrv7mAt18A/preview'
    },
    {
      id: 'impound',
      title: 'SASP State Impound SOP',
      icon: <FileText className="w-4 h-4 mr-2" />,
      url: 'https://docs.google.com/document/d/1EaRgGD-dzD4PhqXNh0wZSoGCyzVWbZswb_bfqXN2hMc/preview'
    }
  ];

  const [activeDoc, setActiveDoc] = useState(documents[0]);

  return (
    <div className="space-y-6 p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-500" />
          Department Documents
        </h1>
        <p className="text-sm text-slate-400 mt-1">Official San Andreas State Police literature, rosters, and operational guidelines.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-200 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-slate-800 pb-3 bg-slate-950">
          <div className="flex flex-wrap gap-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeDoc.id === doc.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {doc.icon}
                {doc.title}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <iframe
            src={activeDoc.url}
            className="w-full h-full border-0"
            title={activeDoc.title}
            allow="autoplay"
          ></iframe>
        </CardContent>
      </Card>
    </div>
  );
}