import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Users, Trash2, PlusCircle, X, Video } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from "@/context/AuthContext";

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

const getTimeStatusColor = (dateStr: string, timeStr: string) => {
  const meetingDate = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diffMs = now.getTime() - meetingDate.getTime();
  if (diffMs < 0) return 'text-emerald-400';
  if (diffMs >= 0 && diffMs < 3600000) return 'text-emerald-400 animate-pulse';
  return 'text-rose-400';
};

export default function MeetingsDashboard() {
  const { adminSafeMode } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState("Command");
  const [joinLink, setJoinLink] = useState("");
  const [joinLinkTitle, setJoinLinkTitle] = useState("");
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null);
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
      .select('name, badge_number, is_admin, role')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();

    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin || ['High Command', 'HR'].includes(data.role)) setIsAdmin(true);
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
    let finalDescription = newMeeting.description;
    if (joinLink) {
      finalDescription += `\n\n[LINK]=${joinLink}[TITLE]=${joinLinkTitle || 'Join Meeting'}`;
    }
    const { data, error } = await supabase
      .from('meetings')
      .insert([{ ...newMeeting, description: finalDescription, created_by: authorName }])
      .select();

    if (error) {
      alert("Failed to schedule meeting: " + error.message);
    } else if (data) {
      logAuditAction("MEETING_SCHEDULED", "Multiple", `Scheduled ${newMeeting.type} meeting: ${newMeeting.title} on ${newMeeting.meeting_date} at ${newMeeting.meeting_time}`, authorName);
      // Re-fetch to ensure exact correct sorting by date/time
      fetchMeetings();
      setNewMeeting({ title: "", meeting_date: "", meeting_time: "", type: "Mandatory", description: "" });
      setJoinLink("");
      setJoinLinkTitle("");
      setShowForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingToDelete);

    if (error) {
      alert("Failed to delete meeting.");
    } else {
      const meeting = meetings.find(m => m.id === meetingToDelete);
      if (meeting) logAuditAction("MEETING_DELETED", "Multiple", `Canceled meeting: ${meeting.title}`, authorName);
      setMeetings(meetings.filter(m => m.id !== meetingToDelete));
      setMeetingToDelete(null);
    }
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
      <div className="relative mb-8">
        <div className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <CalendarDays className="w-7 h-7 text-brand" />
              MEETINGS & <span className="font-bold text-brand">BRIEFINGS</span>
            </h1>
            <div className="w-16 h-1 bg-brand mt-2 mb-2 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-sm text-slate-400 font-light tracking-wide flex items-center gap-2">
              Schedule and track departmental assemblies, trainings, and briefings.
            </p>
          </div>
          {isAdmin && (
            <div className="shrink-0 mt-4 md:mt-0">
              <button 
                onClick={() => setShowForm(!showForm)} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-xl border ${
                  showForm 
                  ? 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800 hover:border-slate-500 hover:shadow-slate-900/50' 
                  : 'bg-blue-600/90 hover:bg-blue-500 text-white border-blue-500/50 shadow-blue-900/30 hover:shadow-blue-500/30 hover:-translate-y-0.5'
                }`}
              >
                {showForm ? <X className="w-5 h-5"/> : <PlusCircle className="w-5 h-5"/>} 
                <span>{showForm ? "Cancel" : "Schedule New Meeting"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ONLY SHOW SCHEDULING FORM TO ADMINS */}
      {isAdmin && (
        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${showForm ? 'grid-rows-[1fr] opacity-100 mb-8 mt-4' : 'grid-rows-[0fr] opacity-0 mb-0 mt-0'}`}>
          <div className="overflow-hidden">
            <Card className="bg-slate-900/60 backdrop-blur-xl border border-blue-900/50 shadow-[0_0_40px_rgba(59,130,246,0.1)] text-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <CardHeader className="border-b border-slate-800/60 bg-slate-900/40 pb-4">
            <CardTitle className="text-xl font-semibold text-blue-400 flex items-center gap-3">
              <PlusCircle className="w-5 h-5 text-blue-500" /> 
              Schedule New Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleScheduleMeeting} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meeting Title</label>
                <input required type="text" value={newMeeting.title} onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900" placeholder="e.g. Traffic Stop Training" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                <input required type="date" value={newMeeting.meeting_date} onChange={e => setNewMeeting({ ...newMeeting, meeting_date: e.target.value })} onClick={e => 'showPicker' in HTMLInputElement.prototype && e.currentTarget.showPicker()} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 cursor-pointer" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time (Local)</label>
                <input required type="time" value={newMeeting.meeting_time} onChange={e => setNewMeeting({ ...newMeeting, meeting_time: e.target.value })} onClick={e => 'showPicker' in HTMLInputElement.prototype && e.currentTarget.showPicker()} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900 cursor-pointer" />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Agenda / Description</label>
                <input required type="text" value={newMeeting.description} onChange={e => setNewMeeting({ ...newMeeting, description: e.target.value })} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900" placeholder="Enter meeting details, location, or requirements..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Meeting Type</label>
                <select value={newMeeting.type} onChange={e => setNewMeeting({ ...newMeeting, type: e.target.value })} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900">
                  <option value="Mandatory">Mandatory</option>
                  <option value="Training">Training</option>
                  <option value="Optional">Optional / Briefing</option>
                </select>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Join Link (Optional)</label>
                <input type="url" value={joinLink} onChange={e => setJoinLink(e.target.value)} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900" placeholder="https://zoom.us/j/..." />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Link Title (Optional)</label>
                <input type="text" value={joinLinkTitle} onChange={e => setJoinLinkTitle(e.target.value)} className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:bg-slate-900" placeholder="e.g. Join Zoom Meeting" />
              </div>
              <div className="lg:col-span-4 flex justify-end mt-4">
                <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-3 rounded-lg font-bold tracking-wide transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 text-sm">
                  SCHEDULE MEETING
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
          </div>
        </div>
      )}

      {/* MEETINGS LIST - VISIBLE TO EVERYONE */}
      <div className="space-y-10 group/list pb-12 mt-8">
        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500 font-medium">No upcoming meetings scheduled.</p>
          </div>
        ) : (
          <>
            {/* TODAY SECTION */}
            {(() => {
              // Note: meeting_date format is YYYY-MM-DD
              const todaysMeetings = meetings.filter(meeting => {
                const meetingDateStr = meeting.meeting_date;
                // Add T12:00:00 to avoid timezone offset issues when parsing YYYY-MM-DD
                return new Date(`${meetingDateStr}T12:00:00`).toDateString() === new Date().toDateString();
              });
              
              if (todaysMeetings.length === 0) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-light tracking-widest text-brand uppercase">Today</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todaysMeetings.map((meeting) => (
                      <Card key={meeting.id} className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200 flex flex-col group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-2xl hover:!opacity-100 hover:!blur-none group-hover/list:opacity-50 hover:bg-slate-900 border-l-4" style={{ borderLeftColor: meeting.type === 'Mandatory' ? "#f43f5e" : meeting.type === 'Training' ? "#10b981" : "#64748b" }}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${meeting.type === 'Mandatory' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                  meeting.type === 'Training' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                {meeting.type}
                              </span>
                            </div>
                            <CardTitle className="text-lg font-semibold text-white leading-tight mt-1">{meeting.title}</CardTitle>
                          </div>
                          {/* ADMIN ONLY DELETE BUTTON */}
                          {isAdmin && adminSafeMode && (
                            <button onClick={() => setMeetingToDelete(meeting.id)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 -mt-1 -mr-1" title="Cancel Meeting">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3">
                          {(() => {
                            let text = meeting.description;
                            let link = null;
                            let linkTitle = "Join Meeting";
                            if (meeting.description.includes("[LINK]=")) {
                              const parts = meeting.description.split("[LINK]=");
                              text = parts[0];
                              if (parts[1]) {
                                const titleSplit = parts[1].split("[TITLE]=");
                                link = titleSplit[0];
                                if (titleSplit[1]) linkTitle = titleSplit[1];
                              }
                            }
                            return (
                              <div className="flex-1 flex flex-col items-start gap-4">
                                <p className="text-sm text-slate-300 whitespace-pre-wrap">{text}</p>
                                {link && (
                                  <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 font-medium transition-all duration-300 text-sm shadow-sm">
                                    <Video className="w-4 h-4" />
                                    {linkTitle}
                                  </a>
                                )}
                              </div>
                            );
                          })()}
          
                          <div className="mt-auto pt-4 flex flex-col gap-2 border-t border-slate-800">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <CalendarDays className="w-4 h-4 text-slate-500" />
                              <span>{formatDate(meeting.meeting_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center gap-2 text-sm font-medium ${getTimeStatusColor(meeting.meeting_date, meeting.meeting_time)}`}>
                                <Clock className="w-4 h-4" />
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
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* UPCOMING/PREVIOUS SECTION */}
            {(() => {
              const otherMeetings = meetings.filter(meeting => {
                const meetingDateStr = meeting.meeting_date;
                return new Date(`${meetingDateStr}T12:00:00`).toDateString() !== new Date().toDateString();
              });
              
              if (otherMeetings.length === 0) return null;
              
              return (
                <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-lg font-light tracking-widest text-slate-500 uppercase">Other Meetings</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {otherMeetings.map((meeting) => (
                      <Card key={meeting.id} className="bg-slate-900/30 backdrop-blur-md border-slate-800/40 shadow-md overflow-hidden text-slate-300 flex flex-col group transition-all duration-300 relative hover:z-20 hover:-translate-y-0.5 hover:shadow-xl hover:!opacity-100 hover:!blur-none group-hover/list:opacity-50 hover:bg-slate-900/60 opacity-80 border-l-2" style={{ borderLeftColor: meeting.type === 'Mandatory' ? "#f43f5e" : meeting.type === 'Training' ? "#10b981" : "#64748b" }}>
                        <CardHeader className="pb-2 flex flex-row items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${meeting.type === 'Mandatory' ? 'bg-rose-500/5 text-rose-400/70 border-rose-500/10' :
                                  meeting.type === 'Training' ? 'bg-emerald-500/5 text-emerald-400/70 border-emerald-500/10' :
                                    'bg-slate-500/5 text-slate-400/70 border-slate-500/10'
                                }`}>
                                {meeting.type}
                              </span>
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-200 leading-tight mt-1">{meeting.title}</CardTitle>
                          </div>
                          {/* ADMIN ONLY DELETE BUTTON */}
                          {isAdmin && adminSafeMode && (
                            <button onClick={() => setMeetingToDelete(meeting.id)} className="text-slate-600 hover:text-rose-400 transition-colors p-1 -mt-1 -mr-1" title="Cancel Meeting">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-3">
                          {(() => {
                            let text = meeting.description;
                            let link = null;
                            let linkTitle = "Join Meeting";
                            if (meeting.description.includes("[LINK]=")) {
                              const parts = meeting.description.split("[LINK]=");
                              text = parts[0];
                              if (parts[1]) {
                                const titleSplit = parts[1].split("[TITLE]=");
                                link = titleSplit[0];
                                if (titleSplit[1]) linkTitle = titleSplit[1];
                              }
                            }
                            return (
                              <div className="flex-1 flex flex-col items-start gap-3">
                                <p className="text-xs text-slate-400 whitespace-pre-wrap">{text}</p>
                                {link && (
                                  <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/5 hover:bg-blue-600/10 text-blue-400/80 hover:text-blue-300 border border-blue-500/10 hover:border-blue-500/30 font-medium transition-all duration-300 text-[11px] shadow-sm">
                                    <Video className="w-3 h-3" />
                                    {linkTitle}
                                  </a>
                                )}
                              </div>
                            );
                          })()}
          
                          <div className="mt-auto pt-3 flex flex-col gap-2 border-t border-slate-800/50">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-500/70" />
                              <span>{formatDate(meeting.meeting_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className={`flex items-center gap-2 text-xs font-medium ${getTimeStatusColor(meeting.meeting_date, meeting.meeting_time)}`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{formatTime(meeting.meeting_time)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <Users className="w-3 h-3" />
                                By {meeting.created_by}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {meetingToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Cancel Meeting</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Are you sure you want to cancel this meeting? This action is permanent and will remove the event from the dashboard for all officers.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setMeetingToDelete(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-lg shadow-rose-900/20"
                >
                  Cancel Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}