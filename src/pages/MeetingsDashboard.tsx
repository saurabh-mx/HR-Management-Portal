import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Users, Trash2, PlusCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Meeting {
  id: string;
  title: string;
  meeting_date: string;
  meeting_time: string;
  type: string;
  description: string;
  created_by: string;
  created_at: string;
}

export default function MeetingsDashboard() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authorName, setAuthorName] = useState("Command");
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    meeting_date: "",
    meeting_time: "",
    type: "Mandatory",
    description: ""
  });

  useEffect(() => {
    fetchMeetings();
    checkAccessAndProfile();
  }, []);

  async function checkAccessAndProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    const { data } = await supabase
      .from('employees')
      .select('name, badge_number, is_admin')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();
    
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin) setIsAdmin(true);
    }
  }

  async function fetchMeetings() {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('meeting_date', { ascending: true })
      .order('meeting_time', { ascending: true });
    
    if (error) console.error("Error fetching meetings:", error);
    else if (data) setMeetings(data);
  }

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('meetings')
      .insert([{ ...newMeeting, created_by: authorName }])
      .select();

    if (error) {
      alert("Failed to schedule meeting: " + error.message);
    } else if (data) {
      // Re-fetch to ensure exact correct sorting by date/time
      fetchMeetings();
      setNewMeeting({ title: "", meeting_date: "", meeting_time: "", type: "Mandatory", description: "" });
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this meeting?")) return;
    const { error } = await supabase.from('meetings').delete().eq('id', id);
    if (!error) setMeetings(meetings.filter(m => m.id !== id));
  };

  // Helper to format dates nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString(undefined, options);
  };

  // Helper to format 24h time to 12h AM/PM
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    const d = new Date();
    d.setHours(parseInt(hour, 10));
    d.setMinutes(parseInt(minute, 10));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <CalendarDays className="w-10 h-10 text-brand" />
              MEETINGS & <span className="font-bold text-brand">BRIEFINGS</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              Schedule and track departmental assemblies, trainings, and briefings.
            </p>
          </div>
        </div>
      </div>

      {/* ONLY SHOW SCHEDULING FORM TO ADMINS */}
      {isAdmin && (
        <Card className="bg-slate-900 border-blue-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-blue-400 flex items-center gap-2">
              <PlusCircle className="w-5 h-5" /> Schedule New Meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScheduleMeeting} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-medium text-slate-400">Meeting Title</label>
                <input required type="text" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="e.g. Traffic Stop Training" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Date</label>
                <input required type="date" value={newMeeting.meeting_date} onChange={e => setNewMeeting({...newMeeting, meeting_date: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Time (Local)</label>
                <input required type="time" value={newMeeting.meeting_time} onChange={e => setNewMeeting({...newMeeting, meeting_time: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <label className="text-xs font-medium text-slate-400">Agenda / Description</label>
                <input required type="text" value={newMeeting.description} onChange={e => setNewMeeting({...newMeeting, description: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Enter meeting details, location, or requirements..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Meeting Type</label>
                <select value={newMeeting.type} onChange={e => setNewMeeting({...newMeeting, type: e.target.value})} className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="Mandatory">Mandatory</option>
                  <option value="Training">Training</option>
                  <option value="Optional">Optional / Briefing</option>
                </select>
              </div>
              <div className="lg:col-span-4 flex justify-end mt-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm">
                  Schedule Meeting
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* MEETINGS LIST - VISIBLE TO EVERYONE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetings.length === 0 ? (
          <p className="text-slate-500 col-span-full">No upcoming meetings scheduled.</p>
        ) : (
          meetings.map((meeting) => (
            <Card key={meeting.id} className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200 flex flex-col">
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      meeting.type === 'Mandatory' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                      meeting.type === 'Training' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {meeting.type}
                    </span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-white leading-tight mt-1">{meeting.title}</CardTitle>
                </div>
                {/* ADMIN ONLY DELETE BUTTON */}
                {isAdmin && (
                  <button onClick={() => handleDeleteMeeting(meeting.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 -mt-1 -mr-1" title="Cancel Meeting">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-slate-300">{meeting.description}</p>
                
                <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <CalendarDays className="w-4 h-4 text-slate-500" />
                    <span>{formatDate(meeting.meeting_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{formatTime(meeting.meeting_time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      Scheduled by {meeting.created_by}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}