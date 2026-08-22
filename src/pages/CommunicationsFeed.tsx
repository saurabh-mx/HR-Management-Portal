import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Megaphone, AlertCircle, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Post {
  id: string;
  author: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
}

export default function CommunicationsFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", message: "", category: "Announcement" });
  const [authorName, setAuthorName] = useState("Patrol Officer");

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
      .select('name, badge_number, is_admin')
      .eq('discord_tag', session.user.email.split('@')[0])
      .single();
    
    if (data) {
      setAuthorName(`${data.name} (${data.badge_number})`);
      if (data.is_admin) setIsAdmin(true); // Set admin status here
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
      setPosts([data[0], ...posts]);
      setNewPost({ title: "", message: "", category: "Announcement" });
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this broadcast?")) return;

    const { error } = await supabase
      .from('Announcements')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Failed to delete post.");
    } else {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-sky-500 animate-pulse" />
          Announcements
        </h1>
        <p className="text-sm text-slate-400 mt-1">Department-wide dispatch notices, BOLOs, and shift briefings.</p>
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
            <Card key={post.id} className="bg-slate-900 border-slate-800 text-slate-200">
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
                  {isAdmin && (
                    <button 
                      onClick={() => handleDeletePost(post.id)}
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
    </div>
  );
}