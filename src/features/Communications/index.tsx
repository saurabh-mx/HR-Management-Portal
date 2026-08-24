import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Megaphone, AlertCircle, ShieldAlert, Trash2, Plus, X, Edit2 } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from '@/auth/hooks/useAuth';
import { isHighCommandOrHR } from '@/auth/roles/roleMatrix';


interface Post {
  id: string;
  author: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
}

const formatMessage = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const formattedLine = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/__(.*?)__/g, '<u class="underline-offset-2">$1</u>');
      
    if (line.startsWith('# ')) {
      return (
        <h3 key={i} className="text-lg font-bold text-white mt-3 mb-1" dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }} />
      );
    }
    return (
      <div key={i} className="min-h-[1.5em]" dangerouslySetInnerHTML={{ __html: formattedLine }} />
    );
  });
};

export default function CommunicationsFeed() {
  const { profile, adminSafeMode } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", message: "", category: "Announcement" });
  const [imageLink, setImageLink] = useState("");
  const [authorName, setAuthorName] = useState("Patrol Officer");
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToEdit, setPostToEdit] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    if (profile) {
      setAuthorName(`${profile.name} (${profile.badge_number})`);
      if (isHighCommandOrHR(profile)) setIsAdmin(true);
    }
  }, [profile]);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('Announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching posts:", error);
    else if (data) setPosts(data);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMessage = imageLink ? newPost.message + '\n\n[IMAGE]=' + imageLink : newPost.message;
    
    if (postToEdit) {
      const { error } = await supabase
        .from('Announcements')
        .update({ ...newPost, message: finalMessage })
        .eq('id', postToEdit);
        
      if (error) {
        console.error("Error updating post:", error);
        alert("Failed to update broadcast.");
      } else {
        logAuditAction("BROADCAST_UPDATED", "Multiple", `Updated ${newPost.category}: ${newPost.title}`, authorName);
        setPosts(posts.map(p => p.id === postToEdit ? { ...p, ...newPost, message: finalMessage } : p));
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from('Announcements')
        .insert([{ ...newPost, message: finalMessage, author: authorName }])
        .select();

      if (error) {
        console.error("Error creating post:", error);
        alert("Failed to broadcast message.");
      } else if (data) {
        logAuditAction("BROADCAST_CREATED", "Multiple", `Transmitted ${newPost.category}: ${newPost.title}`, authorName);
        setPosts([data[0], ...posts]);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNewPost({ title: "", message: "", category: "Announcement" });
    setImageLink("");
    setShowForm(false);
    setPostToEdit(null);
  };

  const handleEditClick = (post: Post) => {
    const parts = post.message.split('[IMAGE]=');
    setNewPost({ title: post.title, message: parts[0].trim(), category: post.category });
    setImageLink(parts[1] ? parts[1].trim() : "");
    setPostToEdit(post.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    const { error } = await supabase
      .from('Announcements')
      .delete()
      .eq('id', postToDelete);

    if (error) {
      alert("Failed to delete post.");
    } else {
      const post = posts.find(p => p.id === postToDelete);
      if (post) logAuditAction("BROADCAST_DELETED", "Multiple", `Deleted broadcast: ${post.title}`, authorName);
      setPosts(posts.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Sleek Glassmorphic Header */}
      <div className="relative mb-8">
        <div className="py-2 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <Megaphone className="w-7 h-7 text-brand animate-pulse" />
              DEPARTMENT <span className="font-bold text-brand">COMMUNICATIONS</span>
            </h1>
            <div className="w-16 h-1 bg-brand mt-2 mb-2 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-sm text-slate-400 font-light tracking-wide flex items-center gap-2">
              Official Announcements, Alerts, and Shift Briefings.
            </p>
          </div>
          {/* ALWAYS SHOW CREATOR FORM TOGGLE TO ADMINS */}
          {isAdmin && (
            <div className="shrink-0 mt-4 md:mt-0">
              <button 
                onClick={() => {
                  if (showForm) {
                    resetForm();
                  } else {
                    setShowForm(true);
                  }
                }} 
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 shadow-xl border ${
                  showForm 
                  ? 'bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800 hover:border-slate-500 hover:shadow-slate-900/50' 
                  : 'bg-sky-600/90 hover:bg-sky-500 text-white border-sky-500/50 shadow-sky-900/30 hover:shadow-sky-500/30 hover:-translate-y-0.5'
                }`}
              >
                {showForm ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
                <span>{showForm ? "Cancel" : "Transmit Broadcast"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ONLY SHOW BROADCAST CREATOR FORM TO ADMINS */}
      {isAdmin && (
        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${showForm ? 'grid-rows-[1fr] opacity-100 mb-8 mt-4' : 'grid-rows-[0fr] opacity-0 mb-0 mt-0'}`}>
          <div className="overflow-hidden">
            <Card className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/60 backdrop-blur-xl border border-sky-900/50 shadow-[0_0_40px_rgba(14,165,233,0.1)] text-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-600 to-sky-400"></div>
          <CardHeader className="border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/40 pb-4">
            <CardTitle className="text-xl font-semibold text-sky-400 flex items-center gap-3">
              <Megaphone className="w-5 h-5 text-sky-500" />
              {postToEdit ? "Update Broadcast" : "Transmit New Broadcast"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreatePost} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Broadcast Title</label>
                  <input 
                    required 
                    type="text" 
                    value={newPost.title} 
                    onChange={e => setNewPost({...newPost, title: e.target.value})} 
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500" 
                    placeholder="e.g. BOLO: Black Sultan on Route 68" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select 
                    value={newPost.category} 
                    onChange={e => setNewPost({...newPost, category: e.target.value})} 
                    className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white transition-all focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="BOLO / Alert">BOLO / Alert</option>
                    <option value="Shift Briefing">Shift Briefing</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message Content</label>
                <textarea 
                  required 
                  rows={4}
                  value={newPost.message} 
                  onChange={e => setNewPost({...newPost, message: e.target.value})} 
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 resize-none" 
                  placeholder="Enter dispatch details, instructions, or notes..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image URL (Optional)</label>
                <input 
                  type="url" 
                  value={imageLink} 
                  onChange={e => setImageLink(e.target.value)} 
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 focus:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500" 
                  placeholder="https://example.com/image.png" 
                />
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-6 py-2.5 rounded-lg font-bold tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] flex items-center gap-2 hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" /> {postToEdit ? "Update Transmission" : "Send Transmission"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
          </div>
        </div>
      )}

      {/* Feed List - VISIBLE TO EVERYONE */}
      <div className="space-y-10 group/list pb-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-slate-500 font-medium">No active transmissions found.</p>
          </div>
        ) : (
          <>
            {/* TODAY SECTION */}
            {(() => {
              const todaysPosts = posts.filter(post => new Date(post.created_at).toDateString() === new Date().toDateString());
              if (todaysPosts.length === 0) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-light tracking-widest text-brand uppercase">Today</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
                  </div>
                  {todaysPosts.map((post) => (
                    <Card key={post.id} className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200 group transition-all duration-300 relative hover:z-20 hover:scale-[1.01] hover:-translate-y-1 hover:shadow-2xl hover:!opacity-100 hover:!blur-none group-hover/list:opacity-50 hover:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 border-l-4" style={{ borderLeftColor: post.category === "BOLO / Alert" ? "#f43f5e" : post.category === "Shift Briefing" ? "#f59e0b" : "#38bdf8" }}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                          {post.category === "BOLO / Alert" ? (
                            <ShieldAlert className="w-5 h-5 text-rose-500" />
                          ) : post.category === "Shift Briefing" ? (
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Megaphone className="w-5 h-5 text-sky-400" />
                          )}
                          <div>
                            <CardTitle className="text-base font-semibold text-white">{post.title}</CardTitle>
                            <p className="text-xs text-slate-400">
                              Transmitted by <span className="text-slate-300 font-medium">{post.author}</span> on {new Date(post.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                            post.category === "BOLO / Alert" 
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                              : post.category === "Shift Briefing"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          }`}>
                            {post.category}
                          </span>
                          {/* AUTHOR CAN EDIT/DELETE OR ADMIN IN SAFE MODE */}
                          {(post.author === authorName || (isAdmin && adminSafeMode)) && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleEditClick(post)}
                                className="text-slate-500 hover:text-sky-400 transition-colors p-1"
                                title="Edit Broadcast"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setPostToDelete(post.id)}
                                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                                title="Delete Broadcast"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const parts = post.message.split('[IMAGE]=');
                          const text = parts[0];
                          const imgUrl = parts[1]?.trim();
                          return (
                            <div className="space-y-4">
                              <div className="text-sm text-slate-300 whitespace-pre-wrap space-y-1">{formatMessage(text)}</div>
                              {imgUrl && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg bg-slate-950/50 flex justify-center">
                                  <img src={imgUrl} alt="Broadcast Attachment" className="w-full h-auto object-contain max-h-[800px] hover:scale-[1.01] transition-transform duration-500" />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}

            {/* PREVIOUS SECTION */}
            {(() => {
              const previousPosts = posts.filter(post => new Date(post.created_at).toDateString() !== new Date().toDateString());
              if (previousPosts.length === 0) return null;
              
              return (
                <div className="space-y-4 mt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-lg font-light tracking-widest text-slate-500 uppercase">Previous Transmissions</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
                  </div>
                  {previousPosts.map((post) => (
                    <Card key={post.id} className="bg-slate-900/30 backdrop-blur-md border-slate-800/40 shadow-md overflow-hidden text-slate-300 group transition-all duration-300 relative hover:z-20 hover:-translate-y-0.5 hover:shadow-xl hover:!opacity-100 hover:!blur-none group-hover/list:opacity-50 hover:bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500/60 opacity-80 border-l-2" style={{ borderLeftColor: post.category === "BOLO / Alert" ? "#f43f5e" : post.category === "Shift Briefing" ? "#f59e0b" : "#38bdf8" }}>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                          {post.category === "BOLO / Alert" ? (
                            <ShieldAlert className="w-4 h-4 text-rose-500/70" />
                          ) : post.category === "Shift Briefing" ? (
                            <AlertCircle className="w-4 h-4 text-amber-500/70" />
                          ) : (
                            <Megaphone className="w-4 h-4 text-sky-400/70" />
                          )}
                          <div>
                            <CardTitle className="text-sm font-semibold text-slate-200">{post.title}</CardTitle>
                            <p className="text-xs text-slate-500">
                              Transmitted by <span className="text-slate-400 font-medium">{post.author}</span> on {new Date(post.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold ${
                            post.category === "BOLO / Alert" 
                              ? "bg-rose-500/5 text-rose-400/70 border-rose-500/10" 
                              : post.category === "Shift Briefing"
                              ? "bg-amber-500/5 text-amber-400/70 border-amber-500/10"
                              : "bg-sky-500/5 text-sky-400/70 border-sky-500/10"
                          }`}>
                            {post.category}
                          </span>
                          {/* AUTHOR CAN EDIT/DELETE OR ADMIN IN SAFE MODE */}
                          {isAdmin && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleEditClick(post)}
                                className="text-slate-600 hover:text-sky-400 transition-colors p-1"
                                title="Edit Broadcast"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => setPostToDelete(post.id)}
                                className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                                title="Delete Broadcast"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const parts = post.message.split('[IMAGE]=');
                          const text = parts[0];
                          const imgUrl = parts[1]?.trim();
                          return (
                            <div className="space-y-4">
                              <div className="text-xs text-slate-400 whitespace-pre-wrap space-y-1">{formatMessage(text)}</div>
                              {imgUrl && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-slate-700/50 shadow-md bg-slate-950/50 flex justify-center">
                                  <img src={imgUrl} alt="Broadcast Attachment" className="w-full h-auto object-contain max-h-[800px] opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-950/60 backdrop-blur-xl border border-white/5 shadow-2xl hover:border-white/10 transition-all duration-500 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-white">Delete Broadcast</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Are you sure you want to delete this broadcast? This action is permanent and will remove the communication from all officer feeds.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setPostToDelete(null)}
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(14,165,233,0.2)] transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-lg shadow-rose-900/20"
                >
                  Delete Broadcast
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}