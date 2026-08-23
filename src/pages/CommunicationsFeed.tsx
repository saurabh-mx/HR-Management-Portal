import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Megaphone, AlertCircle, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from "@/context/AuthContext";

interface Post {
  id: string;
  author: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
}

export default function CommunicationsFeed() {
  const { adminSafeMode } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", message: "", category: "Announcement" });
  const [authorName, setAuthorName] = useState("Patrol Officer");
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('Announcements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error("Error fetching posts:", error);
    else if (data) setPosts(data);
  }

  async function fetchCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    // Grab their real officer name and admin status from the employees table
    const { data } = await supabase
      .from('employees')
      .select('name, badge_number, is_admin, role')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();
    
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin || ['High Command', 'HR'].includes(data.role)) setIsAdmin(true); // Set admin status here
    } else {
      setAuthorName(session.user.email);
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('Announcements')
      .insert([{ ...newPost, author: authorName }])
      .select();

    if (error) {
      console.error("Error creating post:", error);
      alert("Failed to broadcast message.");
    } else if (data) {
      logAuditAction("BROADCAST_CREATED", "Multiple", `Transmitted ${newPost.category}: ${newPost.title}`, authorName);
      setPosts([data[0], ...posts]);
      setNewPost({ title: "", message: "", category: "Announcement" });
    }
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
      <div className="relative overflow-hidden rounded-2xl mb-8 shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-slate-800/60">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-slate-200 uppercase drop-shadow-lg flex items-center gap-4">
              <Megaphone className="w-10 h-10 text-brand animate-pulse" />
              DEPARTMENT <span className="font-bold text-brand">COMMUNICATIONS</span>
            </h1>
            <div className="w-24 h-1 bg-brand mt-4 mb-3 shadow-[0_0_15px_hsl(var(--brand-main)/0.8)] rounded-full"></div>
            <p className="text-slate-300 text-lg font-light tracking-wide flex items-center gap-2">
              Official Announcements, Alerts, and Shift Briefings.
            </p>
          </div>
        </div>
      </div>

      {/* ONLY SHOW BROADCAST CREATOR FORM TO ADMINS */}
      {isAdmin && (
        <Card className="bg-slate-900 border-sky-900/50 text-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-sky-400">Transmit New Broadcast</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-medium text-slate-400">Broadcast Title</label>
                  <input 
                    required 
                    type="text" 
                    value={newPost.title} 
                    onChange={e => setNewPost({...newPost, title: e.target.value})} 
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" 
                    placeholder="e.g. BOLO: Black Sultan on Route 68" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400">Category</label>
                  <select 
                    value={newPost.category} 
                    onChange={e => setNewPost({...newPost, category: e.target.value})} 
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="BOLO / Alert">BOLO / Alert</option>
                    <option value="Shift Briefing">Shift Briefing</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Message Content</label>
                <textarea 
                  required 
                  rows={3}
                  value={newPost.message} 
                  onChange={e => setNewPost({...newPost, message: e.target.value})} 
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" 
                  placeholder="Enter dispatch details, instructions, or notes..." 
                />
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-md font-medium transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  Transmit Broadcast
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Feed List - VISIBLE TO EVERYONE */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Active Transmissions</h2>
        
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">No active transmissions found.</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="bg-slate-900/40 backdrop-blur-md border-slate-800/60 shadow-xl overflow-hidden text-slate-200">
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
                  {/* ONLY ADMINS CAN DELETE BROADCASTS */}
                  {isAdmin && adminSafeMode && (
                    <button 
                      onClick={() => setPostToDelete(post.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete Broadcast"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{post.message}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
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
                  className="px-4 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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