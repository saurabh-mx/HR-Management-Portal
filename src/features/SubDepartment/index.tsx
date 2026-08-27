import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Building, AlertCircle, ShieldAlert, Trash2, Plus, X, Edit2, Megaphone } from "lucide-react";
import { supabase } from '@/lib/supabase/supabaseClient';
import { logAuditAction } from "@/lib/auditLogger";
import { useAuth } from '@/auth/hooks/useAuth';
import { isHighCommandOrHR } from '@/auth/roles/roleMatrix';

interface SubDepartmentPost {
  id: string;
  sub_department: string;
  author: string;
  title: string;
  message: string;
  category: string;
  created_at: string;
}

const deptColors: Record<string, { light: string, dark: string }> = {
  'HEAT': { light: '#FDE8E8', dark: '#B83232' },
  'FTD': { light: '#E8F1FC', dark: '#245A9B' },
  'ASD': { light: '#E3F5F6', dark: '#00656B' },
  'K9': { light: '#FFF4CC', dark: '#8A6800' },
  'MEDIA TEAM': { light: '#F0E8F8', dark: '#5B2E8A' },
  'DOC': { light: '#F1F3F5', dark: '#4B5563' },
  'SBI': { light: '#FFF0DF', dark: '#9A4D00' },
  'MEU': { light: '#EBEAF9', dark: '#37317F' },
  'ALL': { light: '#E0E7FF', dark: '#4F46E5' } // Indigo for 'All'
};

const getDeptColors = (dept: string) => {
  return deptColors[dept] || deptColors['ALL'];
};

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

export default function SubDepartmentFeed() {
  const { profile, adminSafeMode } = useAuth();
  const [posts, setPosts] = useState<SubDepartmentPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubDepartmentLead, setIsSubDepartmentLead] = useState(false);
  
  const [selectedSubDept, setSelectedSubDept] = useState<string>("All");
  const [availableSubDepts, setAvailableSubDepts] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", message: "", category: "Announcement" });
  const [authorName, setAuthorName] = useState("Command");
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [postToEdit, setPostToEdit] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setAuthorName(`${profile.name} (${profile.badge_number})`);
      const admin = isHighCommandOrHR(profile);
      setIsAdmin(admin);
      
      if (profile.sub_department && profile.sub_department !== 'N/A') {
        setSelectedSubDept(profile.sub_department);
      }
      
      fetchSubDepartments(admin);
    }
    fetchEmployees();
  }, [profile]);

  async function fetchEmployees() {
    const { data } = await supabase.from('employees').select('name, badge_number, rank, department, sub_department, led_sub_departments, cert_asd, cert_heat, cert_k9, cert_meu, cert_fto, cert_cid');
    if (data) setEmployees(data);
  }

  const isEmpInDept = (emp: any, dept: string) => {
    if (emp.sub_department === dept) return true;
    if (emp.led_sub_departments?.includes(dept)) return true;
    switch(dept) {
      case 'ASD': return !!emp.cert_asd;
      case 'HEAT': return !!emp.cert_heat;
      case 'K9': return !!emp.cert_k9;
      case 'MEU': return !!emp.cert_meu;
      case 'FTD': return !!emp.cert_fto;
      case 'SBI': return !!emp.cert_cid; 
      default: return false;
    }
  };

  useEffect(() => {
    fetchPosts();
    checkLeadStatus();
  }, [selectedSubDept, profile, availableSubDepts, isAdmin]);

  const checkLeadStatus = () => {
    if (!profile) return;
    const leads = profile.led_sub_departments || [];
    setIsSubDepartmentLead(leads.includes(selectedSubDept));
  };

  const isAuthorizedForDept = (dept: string, adminStatus: boolean) => {
    if (!profile) return false;
    if (adminStatus) return true;
    if (profile.sub_department === dept) return true;
    if (profile.led_sub_departments?.includes(dept)) return true;
    
    switch(dept) {
      case 'ASD': return !!profile.cert_asd;
      case 'HEAT': return !!profile.cert_heat;
      case 'K9': return !!profile.cert_k9;
      case 'MEU': return !!profile.cert_meu;
      case 'FTD': return !!profile.cert_fto;
      case 'SBI': return !!profile.cert_cid; 
      default: return false;
    }
  };

  async function fetchSubDepartments(adminStatus = isAdmin) {
    const { data } = await supabase.from('employees').select('sub_department');
    if (data) {
      const depts = new Set<string>(['HEAT', 'FTD', 'ASD', 'K9', 'MEDIA TEAM', 'DOC', 'SBI', 'MEU']);
      data.forEach(emp => {
        if (emp.sub_department && emp.sub_department !== 'N/A' && emp.sub_department.trim() !== '') {
          const dept = emp.sub_department.trim().toUpperCase();
          if (dept !== 'SAO') {
            depts.add(dept);
          }
        }
      });
      
      const allDepts = Array.from(depts).sort();
      const authorizedDepts = allDepts.filter(d => isAuthorizedForDept(d, adminStatus));
      setAvailableSubDepts(authorizedDepts);
      
      if (selectedSubDept !== "All" && !authorizedDepts.includes(selectedSubDept)) {
        setSelectedSubDept("All");
      }
    }
  }

  async function fetchPosts() {
    let query = supabase
      .from('sub_department_posts')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (selectedSubDept !== "All") {
      query = query.eq('sub_department', selectedSubDept);
    } else {
      if (!isAdmin) {
        if (availableSubDepts.length === 0) {
          setPosts([]);
          return;
        }
        query = query.in('sub_department', availableSubDepts);
      }
    }
    
    const { data, error } = await query;
    if (error) console.error("Error fetching posts:", error);
    else if (data) setPosts(data);
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubDept === "All") {
      alert("Please select a specific sub-department before posting.");
      return;
    }
    
    if (postToEdit) {
      const { error } = await supabase
        .from('sub_department_posts')
        .update({ ...newPost, sub_department: selectedSubDept })
        .eq('id', postToEdit);
        
      if (error) {
        console.error("Error updating post:", error);
        alert("Failed to update post.");
      } else {
        logAuditAction("SUB_DEPT_POST_UPDATED", selectedSubDept, `Updated ${newPost.category}: ${newPost.title}`, authorName);
        fetchPosts();
        resetForm();
      }
    } else {
      const { data, error } = await supabase
        .from('sub_department_posts')
        .insert([{ ...newPost, sub_department: selectedSubDept, author: authorName }])
        .select();

      if (error) {
        console.error("Error creating post:", error);
        alert("Failed to post message.");
      } else if (data) {
        logAuditAction("SUB_DEPT_POST_CREATED", selectedSubDept, `Posted ${newPost.category}: ${newPost.title}`, authorName);
        setPosts([data[0], ...posts]);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setNewPost({ title: "", message: "", category: "Announcement" });
    setShowForm(false);
    setPostToEdit(null);
  };

  const handleEditClick = (post: SubDepartmentPost) => {
    setNewPost({ title: post.title, message: post.message, category: post.category });
    setSelectedSubDept(post.sub_department);
    setPostToEdit(post.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    const { error } = await supabase
      .from('sub_department_posts')
      .delete()
      .eq('id', postToDelete);

    if (error) {
      alert("Failed to delete post.");
    } else {
      const post = posts.find(p => p.id === postToDelete);
      if (post) logAuditAction("SUB_DEPT_POST_DELETED", post.sub_department, `Deleted post: ${post.title}`, authorName);
      setPosts(posts.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
    }
  };

  const canPost = isAdmin || isSubDepartmentLead;
  const currentColors = getDeptColors(selectedSubDept);
  
  const filteredPosts = posts.filter(post => selectedCategory === "All" || post.category === selectedCategory);
  const displayPosts = [...filteredPosts].sort((a, b) => {
    if (selectedCategory === "All") {
      if (a.category === "Announcement" && b.category !== "Announcement") return -1;
      if (b.category === "Announcement" && a.category !== "Announcement") return 1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-8 space-y-8 bg-transparent min-h-full">
      {/* Header and Top Bar Navigation */}
      <div className="relative mb-6 z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-4">
              <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-inner">
                <Building className="w-7 h-7 text-indigo-400" />
              </div>
              Sub-Department <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">Feed</span>
            </h1>
            <p className="text-sm text-slate-400 font-medium tracking-wide mt-3 ml-2">
              Stay updated with specialized announcements, strikes, and responses.
            </p>
          </div>
          
          {canPost && selectedSubDept !== "All" && (
            <button 
              onClick={() => {
                if (showForm) resetForm();
                else setShowForm(true);
              }} 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-xl border hover:-translate-y-0.5"
              style={{
                backgroundColor: showForm ? 'rgba(15, 23, 42, 0.8)' : currentColors.dark,
                color: showForm ? 'white' : currentColors.light,
                borderColor: showForm ? 'rgba(51, 65, 85, 1)' : currentColors.light + '40', // 40 hex opacity
                boxShadow: showForm ? '' : `0 10px 25px -5px ${currentColors.dark}80`
              }}
            >
              {showForm ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
              <span>{showForm ? "Cancel" : "Create Post"}</span>
            </button>
          )}
        </div>

        {/* Custom Tab Navigation */}
        <div className="w-full relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-slate-800 after:-z-10">
          <div className="flex w-full overflow-x-auto gap-3 pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {['All', ...availableSubDepts].map(dept => {
              const isActive = selectedSubDept === dept;
              const colors = getDeptColors(dept === 'All' ? 'ALL' : dept);
              
              return (
                <button
                  key={dept}
                  onClick={() => {
                    setSelectedSubDept(dept);
                    if (showForm) resetForm();
                  }}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden group
                    ${isActive 
                      ? 'shadow-lg scale-[1.02]' 
                      : 'bg-slate-900/40 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  style={isActive ? { 
                    backgroundColor: colors.dark, 
                    color: colors.light, 
                    border: `1px solid ${colors.light}60`, // 60 hex opacity
                    boxShadow: `0 4px 20px -2px ${colors.dark}90`
                  } : {}}
                >
                  {/* Subtle hover glow effect for inactive tabs */}
                  {!isActive && (
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                      style={{ backgroundColor: colors.light }}
                    />
                  )}
                  <span className="relative z-10">{dept === 'All' ? 'All Sub-Departments' : dept}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex w-full overflow-x-auto gap-2 pb-2 mt-4 scrollbar-none">
           {['All', 'Announcement', 'Departmental Strike', 'Response'].map(cat => (
             <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border
                  ${selectedCategory === cat 
                    ? 'bg-slate-700 text-white shadow-md border-slate-600' 
                    : 'bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
                  }`}
             >
               {cat === 'All' ? 'All Posts' : cat}
             </button>
           ))}
        </div>
      </div>

      {/* Creator Form */}
      {canPost && (
        <div className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out ${showForm ? 'grid-rows-[1fr] opacity-100 mb-8 mt-4' : 'grid-rows-[0fr] opacity-0 mb-0 mt-0'}`}>
          <div className="overflow-hidden">
            <Card className="bg-slate-950/80 backdrop-blur-2xl border-0 shadow-2xl text-slate-200 relative overflow-hidden ring-1 ring-white/10">
              <div 
                className="absolute top-0 left-0 w-full h-1.5"
                style={{ background: `linear-gradient(to right, ${currentColors.dark}, ${currentColors.light})` }}
              ></div>
              <CardHeader className="border-b border-slate-800/80 pb-5 pt-6 bg-slate-900/20">
                <CardTitle className="text-xl font-bold flex items-center gap-3" style={{ color: currentColors.light }}>
                  <Edit2 className="w-5 h-5" />
                  {postToEdit ? "Update Post" : `Create Post for ${selectedSubDept}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 px-6 pb-8">
                <form onSubmit={handleCreatePost} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5 relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {['Departmental Strike', 'Response'].includes(newPost.category) ? 'Officer Name / Callsign' : 'Title'}
                      </label>
                      <input 
                        required 
                        type="text" 
                        value={newPost.title} 
                        onChange={e => {
                          setNewPost({...newPost, title: e.target.value});
                          if (['Departmental Strike', 'Response'].includes(newPost.category)) setShowSuggestions(true);
                        }} 
                        onFocus={() => {
                          if (['Departmental Strike', 'Response'].includes(newPost.category)) setShowSuggestions(true);
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                        className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-600 shadow-inner" 
                        placeholder={['Departmental Strike', 'Response'].includes(newPost.category) ? "Start typing name or callsign..." : "Enter post title..."} 
                      />
                      
                      {/* Autocomplete Dropdown */}
                      {showSuggestions && ['Departmental Strike', 'Response'].includes(newPost.category) && newPost.title.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-slate-950/90 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/50 custom-scrollbar">
                          {employees
                            .filter(emp => newPost.category === 'Response' || isEmpInDept(emp, selectedSubDept))
                            .filter(emp =>
                              (emp.name && emp.name.toLowerCase().includes(newPost.title.toLowerCase())) ||
                              (emp.badge_number && emp.badge_number.toLowerCase().includes(newPost.title.toLowerCase()))
                            )
                            .slice(0, 8)
                            .map((emp, idx) => (
                              <div
                                key={idx}
                                className="px-4 py-3 hover:bg-slate-800/80 hover:scale-[1.02] cursor-pointer text-sm flex justify-between items-center transition-all"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  const rank = emp.rank ? ` - ${emp.rank}` : '';
                                  const fullName = `${emp.name} (${emp.badge_number})${rank}`;
                                  setNewPost({ ...newPost, title: fullName });
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="font-medium text-slate-200">
                                  {emp.name} <span className="text-slate-500 font-normal">({emp.badge_number})</span>
                                </span>
                                <div className="flex flex-col items-end">
                                  {emp.rank && <span className="text-[10px] uppercase font-bold text-slate-400">{emp.rank}</span>}
                                  <span className="text-[10px] uppercase font-bold text-indigo-400">{emp.department}</span>
                                </div>
                              </div>
                            ))}
                          {employees
                            .filter(emp => newPost.category === 'Response' || isEmpInDept(emp, selectedSubDept))
                            .filter(emp => (emp.name && emp.name.toLowerCase().includes(newPost.title.toLowerCase())) || (emp.badge_number && emp.badge_number.toLowerCase().includes(newPost.title.toLowerCase()))).length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 italic">No matches found{newPost.category === 'Departmental Strike' ? ' in this department' : ''}.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                      <select 
                        value={newPost.category} 
                        onChange={e => setNewPost({...newPost, category: e.target.value})} 
                        className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner appearance-none"
                      >
                        <option value="Announcement">Announcement</option>
                        <option value="Departmental Strike">Departmental Strike</option>
                        <option value="Response">Response</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Message</label>
                    <textarea 
                      required 
                      rows={5}
                      value={newPost.message} 
                      onChange={e => setNewPost({...newPost, message: e.target.value})} 
                      className="w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 resize-none transition-all placeholder:text-slate-600 shadow-inner leading-relaxed" 
                      placeholder="Type your message here... Use **bold** or __underline__ for formatting." 
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <button 
                      type="submit" 
                      className="px-8 py-3 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg flex items-center gap-2 hover:-translate-y-0.5"
                      style={{
                        backgroundColor: currentColors.dark,
                        color: currentColors.light,
                        boxShadow: `0 10px 25px -5px ${currentColors.dark}80`
                      }}
                    >
                      <Send className="w-4 h-4" /> {postToEdit ? "Update Post" : "Publish Post"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-6 pb-12 mt-4">
        {displayPosts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800/50 backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <AlertCircle className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-xl text-slate-300 font-semibold mb-2">No active posts found</p>
            <p className="text-sm text-slate-500">There are currently no posts matching this selection.</p>
          </div>
        ) : (
          displayPosts.map((post) => {
            const postColors = getDeptColors(post.sub_department);
            const isStrike = post.category === "Departmental Strike";
            const isResponse = post.category === "Response";
            
            return (
              <Card key={post.id} className={`bg-slate-900/40 backdrop-blur-xl border-y border-r shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden text-slate-200 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group relative
                ${isResponse ? 'ml-8 md:ml-12 border-l-2 bg-slate-800/20' : 'border-l-4'}
                ${isStrike ? 'bg-rose-950/10' : ''}
              `} 
                style={{ 
                  borderLeftColor: postColors.dark,
                  borderTopColor: isStrike ? 'rgba(244, 63, 94, 0.2)' : 'rgba(51, 65, 85, 0.4)',
                  borderRightColor: isStrike ? 'rgba(244, 63, 94, 0.2)' : 'rgba(51, 65, 85, 0.4)',
                  borderBottomColor: isStrike ? 'rgba(244, 63, 94, 0.2)' : 'rgba(51, 65, 85, 0.4)'
                }}>
                
                {/* Subtle background glow based on department */}
                <div className="absolute top-0 right-0 w-64 h-64 opacity-5 blur-[100px] rounded-full pointer-events-none transition-opacity group-hover:opacity-10"
                     style={{ backgroundColor: postColors.dark }}></div>
                     
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 bg-slate-900/20">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 shadow-inner">
                      {post.category === "Departmental Strike" ? (
                        <ShieldAlert className="w-5 h-5 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                      ) : post.category === "Response" ? (
                        <AlertCircle className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      ) : (
                        <Megaphone className="w-5 h-5" style={{ color: postColors.light }} />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-white mb-1.5 tracking-wide">{post.title}</CardTitle>
                      <p className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-300">{post.author}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span className="font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider" 
                              style={{ backgroundColor: postColors.dark, color: postColors.light }}>
                          {post.sub_department}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>{new Date(post.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-bold tracking-wider uppercase shadow-sm ${
                      post.category === "Departmental Strike" 
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                        : post.category === "Response"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}>
                      {post.category}
                    </span>
                    
                    {(post.author === authorName || (isAdmin && adminSafeMode)) && (
                      <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700/50 pl-4">
                        <button 
                          onClick={() => handleEditClick(post)}
                          className="text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-700 rounded-md transition-all p-1.5 border border-slate-700 hover:border-slate-500 shadow-sm"
                          title="Edit Post"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setPostToDelete(post.id)}
                          className="text-slate-500 hover:text-white bg-slate-800/50 hover:bg-rose-600 rounded-md transition-all p-1.5 border border-slate-700 hover:border-rose-500 shadow-sm"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-6 py-6">
                  <div className="space-y-4">
                    <div className="text-sm text-slate-200 whitespace-pre-wrap space-y-2 leading-relaxed font-medium opacity-90">{formatMessage(post.message)}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-rose-400" />
            <div className="p-8">
              <div className="flex flex-col items-center text-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-wide">Delete Post</h3>
              </div>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed text-center font-medium">
                Are you sure you want to delete this post? This action is permanent and cannot be undone.
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setPostToDelete(null)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 bg-slate-800 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all shadow-sm w-full"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg shadow-rose-900/50 border border-rose-500 w-full"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
