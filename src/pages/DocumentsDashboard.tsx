import { useState } from "react";
import { BookOpen, FileText, FileSpreadsheet, ShieldAlert, ExternalLink, ChevronRight, Book } from "lucide-react";

export default function DocumentsDashboard() {
  const documents = [
    {
      id: 'sop',
      title: 'Standard Operating Procedures',
      description: 'San Andreas State Police — Official Standard Operating Procedures for all field personnel.',
      icon: <Book className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1O_G17ln-H-2MLofUvsf6gl4NGmEbmn04icIRm2lnHKQ/preview',
      original: 'https://docs.google.com/document/d/1O_G17ln-H-2MLofUvsf6gl4NGmEbmn04icIRm2lnHKQ/view'
    },
    {
      id: 'roster',
      title: 'Master Roster',
      description: 'San Andreas State Police — Official Personnel and Rank Directory.',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      url: 'https://docs.google.com/spreadsheets/d/1yucIZVIu4KlfED4G0zujeGv6oDSZYNK_kbY2uMnpFSk/preview',
      original: 'https://docs.google.com/spreadsheets/d/1yucIZVIu4KlfED4G0zujeGv6oDSZYNK_kbY2uMnpFSk/view'
    },
    {
      id: 'uniform',
      title: 'LEO Uniform Guide',
      description: 'San Andreas State Police — Standardized Uniform and Appearance Regulations.',
      icon: <ShieldAlert className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1WQFtopQVk7K1QxLjvxB6z20EgitXSJVKxNrv7mAt18A/preview',
      original: 'https://docs.google.com/document/d/1WQFtopQVk7K1QxLjvxB6z20EgitXSJVKxNrv7mAt18A/view'
    },
    {
      id: 'impound',
      title: 'State Impound SOP',
      description: 'San Andreas State Police — Guidelines and protocols for vehicle seizures.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1EaRgGD-dzD4PhqXNh0wZSoGCyzVWbZswb_bfqXN2hMc/preview',
      original: 'https://docs.google.com/document/d/1EaRgGD-dzD4PhqXNh0wZSoGCyzVWbZswb_bfqXN2hMc/view'
    },
    {
      id: 'penal code',
      title: 'Penal Code',
      description: 'San Andreas State Police — penal code regulations.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/preview',
      original: 'https://docs.google.com/spreadsheets/d/1mIAwJtkIUgG9cpyUjEYHEfKROksWSjc3dzu_unqVg-o/view'
    }
    ,
    {
      id: 'case law',
      title: 'Case Law',
      description: 'San Andreas State Police — relevant case law and legal precedents.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1nUmUonFXReZJ1cFiuuMI5bdBAy41o1OvQnGsoRkgAOU/preview',
      original: 'https://docs.google.com/document/d/1nUmUonFXReZJ1cFiuuMI5bdBAy41o1OvQnGsoRkgAOU/view'
    },
    {
      id: '‌Amendments',
      title: 'Amendments',
      description: 'San Andreas State Police — relevant amendments and updates.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1ZZ4uWbraVBspQQjYb4GOwg4JIAiTOqF8-ot9v5yQWww/preview',
      original: 'https://docs.google.com/document/d/1ZZ4uWbraVBspQQjYb4GOwg4JIAiTOqF8-ot9v5yQWww/view'
    }
    ,
    {
      id: 'Robbery Handbook',
      title: 'Robbery Handbook',
      description: 'San Andreas State Police — guidelines for handling robbery cases.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1ntSUrX-Y79J9IDu7jcMyPInVc6LEYT0J84QhpKeyJLE/preview',
      original: 'https://docs.google.com/document/d/1ntSUrX-Y79J9IDu7jcMyPInVc6LEYT0J84QhpKeyJLE/view'
    },
    {
      id: 'MDT Templates',
      title: 'MDT Templates',
      description: 'San Andreas State Police — templates for MDT entries.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0/preview',
      original: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0/view'
    }
    ,
    {
      id: 'MDT Templates',
      title: 'MDT Templates',
      description: 'San Andreas State Police — templates for MDT entries.',
      icon: <FileText className="w-4 h-4" />,
      url: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0/preview',
      original: 'https://docs.google.com/document/d/1rB1SVjRxFpC9DNhyr0doN5MdL6bWs_CO7cPnNW6TuwM/edit?tab=t.0/view'
    }
  ];

  const [activeDoc, setActiveDoc] = useState(documents[0]);

  return (
    // Outer wrapper with the tech-grid background pattern
    <div className="relative min-h-[90vh] w-full p-6 text-slate-200 bg-transparent bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
      
      {/* Main container, stretches wide and sets the height */}
      <div className="mx-auto flex h-[85vh] w-full max-w-[1400px] gap-6" style={{ maxWidth: 'none', width: '100%' }}>
        
        {/* LEFT SIDEBAR: CONTENTS MENU */}
        <div className="flex w-72 flex-col rounded-xl border border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-sm shrink-0 shadow-lg shadow-black/50 overflow-hidden">
          <div className="border-b border-slate-800/80 p-4">
            <h3 className="text-xs font-bold tracking-widest text-cyan-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> CONTENTS
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {documents.map((doc) => {
              const isActive = activeDoc.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "border border-transparent text-slate-400 hover:bg-brand/10 group hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-cyan-400" : "text-slate-500"}>{doc.icon}</span>
                    <span className="text-left">{doc.title}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-cyan-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE: DOCUMENT VIEWER */}
        <div className="flex flex-1 flex-col rounded-xl border border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-sm shadow-lg shadow-black/50 overflow-hidden">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 bg-slate-900/50 p-6 gap-4 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wide">{activeDoc.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{activeDoc.description}</p>
            </div>
            
            <a
              href={activeDoc.original}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-400 transition-all hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
            >
              <ExternalLink className="w-4 h-4" />
              View Original Document
            </a>
          </div>

          {/* Iframe Content Area */}
          <div className="flex-1 w-full relative bg-slate-950 p-2">
            <iframe
              src={activeDoc.url}
              className="absolute inset-0 h-full w-full rounded-b-xl border-0"
              style={{ minHeight: '85vh' , width: '70vh' }}
              title={activeDoc.title}
              allow="autoplay"
            ></iframe>
          </div>
        </div>
        
      </div>
    </div>
  );
}