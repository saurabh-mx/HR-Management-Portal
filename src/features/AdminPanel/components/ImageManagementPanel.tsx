import { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { imageService } from "@/lib/imageService";
import type { AppImage } from "@/lib/imageService";
import { Trash2, GripVertical, Plus, Image as ImageIcon, CheckCircle, XCircle, Loader2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

function SortableItem({ image, onDelete, onToggleActive }: { image: AppImage, onDelete: (id: string) => void, onToggleActive: (id: string, active: boolean) => void }) {
  const [imgError, setImgError] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: image.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 bg-slate-900 border ${image.is_active ? 'border-slate-700' : 'border-slate-800 opacity-50'} p-3 rounded-lg mb-3 shadow-lg group`}>
      <button {...attributes} {...listeners} className="cursor-grab text-slate-600 hover:text-white p-1">
        <GripVertical size={20} />
      </button>
      <div className="w-24 h-14 bg-slate-950 rounded border border-slate-800 flex-shrink-0 overflow-hidden relative flex items-center justify-center">
        {!imgError ? (
          <img 
            src={image.url} 
            alt="thumbnail" 
            onError={() => setImgError(true)} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900/50">
            <ImageOff size={16} className="text-rose-500/70" />
            <span className="text-[8px] text-rose-500/50 mt-1 uppercase font-bold tracking-widest">Broken</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate font-mono text-xs text-slate-300">
          {image.url.split('/').pop() || image.url}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
          {image.type}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onToggleActive(image.id, !image.is_active)}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
          title={image.is_active ? "Deactivate" : "Activate"}
        >
          {image.is_active ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-500" />}
        </button>
        <button 
          onClick={() => onDelete(image.id)} 
          className="p-1.5 rounded bg-slate-800 hover:bg-red-900/50 text-red-500/70 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function ImageManagementPanel() {
  const [images, setImages] = useState<AppImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkType, setBulkType] = useState("gallery");
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await imageService.getImages();
      setImages(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        
        // Only allow swapping if they are the same type
        if (items[oldIndex].type !== items[newIndex].type) {
            toast.error("Cannot mix types in sequence");
            return items;
        }

        const newArray = arrayMove(items, oldIndex, newIndex);
        
        // Update sequence logic in background
        const typeFilter = newArray.filter(i => i.type === items[oldIndex].type);
        const updates = typeFilter.map((img, index) => ({ id: img.id, sequence_order: index }));
        
        imageService.updateSequence(updates).then(() => {
            toast.success("Sequence updated");
        }).catch(err => {
            console.error(err);
            toast.error("Failed to update sequence");
            loadImages(); // revert on fail
        });

        return newArray;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image record?")) return;
    try {
      await imageService.deleteImage(id);
      setImages(images.filter(img => img.id !== id));
      toast.success("Image deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete image");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await imageService.toggleActive(id, active);
      setImages(images.map(img => img.id === id ? { ...img, is_active: active } : img));
      toast.success(active ? "Image activated" : "Image deactivated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status");
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkUrls.trim()) return;
    const urls = bulkUrls.split('\n').filter(url => url.trim().length > 0);
    
    if (urls.length === 0) return;

    setSaving(true);
    try {
      await imageService.addMultipleImages(urls, bulkType);
      toast.success(`Successfully added ${urls.length} images`);
      setIsBulkModalOpen(false);
      setBulkUrls("");
      loadImages();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add images");
    } finally {
      setSaving(false);
    }
  };

  // Group images by type
  const galleryImages = images.filter(img => img.type === 'gallery');
  const backgroundImages = images.filter(img => img.type === 'background');
  const aboutImages = images.filter(img => img.type === 'about');

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 flex flex-col h-full bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 shrink-0">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-white flex items-center gap-3 tracking-wider uppercase">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-blue-400" />
            </div>
            Image Management
          </h2>
          <p className="text-[11px] text-slate-500 font-medium ml-[52px] -mt-1">Manage global backgrounds, gallery sequence, and about images.</p>
        </div>
        <button 
          onClick={() => setIsBulkModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors text-[10px] tracking-wider uppercase shadow-lg shadow-emerald-900/20"
        >
          <Plus size={16} /> Bulk Add URLs
        </button>
      </div>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
        {/* Gallery Section */}
        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-medium text-slate-300 mb-6 flex items-center gap-2">
                <ImageIcon size={18} className="text-brand" /> Landing Gallery
            </h3>
            
            {galleryImages.length === 0 ? (
                <div className="text-slate-600 text-center py-8 border border-dashed border-slate-800 rounded">No gallery images found</div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={galleryImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                        {galleryImages.map(image => (
                        <SortableItem key={image.id} image={image} onDelete={handleDelete} onToggleActive={handleToggleActive} />
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </div>

        {/* Background Section */}
        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-medium text-slate-300 mb-6 flex items-center gap-2">
                <ImageIcon size={18} className="text-blue-500" /> App Backgrounds
            </h3>
            
            {backgroundImages.length === 0 ? (
                <div className="text-slate-600 text-center py-8 border border-dashed border-slate-800 rounded">No background images found</div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={backgroundImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                        {backgroundImages.map(image => (
                        <SortableItem key={image.id} image={image} onDelete={handleDelete} onToggleActive={handleToggleActive} />
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </div>

        {/* About Section */}
        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-medium text-slate-300 mb-6 flex items-center gap-2">
                <ImageIcon size={18} className="text-amber-500" /> About Images
            </h3>
            
            {aboutImages.length === 0 ? (
                <div className="text-slate-600 text-center py-8 border border-dashed border-slate-800 rounded">No about images found</div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={aboutImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                        {aboutImages.map(image => (
                        <SortableItem key={image.id} image={image} onDelete={handleDelete} onToggleActive={handleToggleActive} />
                        ))}
                    </SortableContext>
                </DndContext>
            )}
        </div>
      </div>

      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 w-full max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-light text-slate-100">Add Image URLs</DialogTitle>
            <DialogDescription className="text-slate-400">
              Paste direct image URLs below (one per line). External links (like Imgur) or local paths (like /group-photo.jpg) are supported.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Category Type</label>
              <select 
                value={bulkType} 
                onChange={e => setBulkType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-3 focus:outline-none focus:border-brand"
              >
                <option value="gallery">Gallery (Landing Page)</option>
                <option value="background">Background (App Layout)</option>
                <option value="about">About (Landing Page)</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Image URLs</label>
              <textarea 
                value={bulkUrls}
                onChange={e => setBulkUrls(e.target.value)}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded p-3 h-40 focus:outline-none focus:border-brand font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <button 
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button 
              onClick={handleBulkAdd}
              disabled={saving || !bulkUrls.trim()}
              className="px-6 py-2 bg-brand text-slate-950 font-bold tracking-widest uppercase text-xs rounded hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Save Images'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
