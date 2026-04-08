import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi } from "@/lib/api";
import { Send, ImagePlus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CreatePost = () => {
  const { user }      = useAuth();
  const queryClient   = useQueryClient();
  const [content, setContent]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !imageFile) || !user) return;
    setLoading(true);
    try {
      await postsApi.create(content.trim(), imageFile);
      setContent("");
      removeImage();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow p-4 mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind? Share updates, achievements..."
        className="w-full resize-none border border-input bg-background rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
      />

      {imagePreview && (
        <div className="relative mt-2 inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-0.5 hover:bg-foreground/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ImagePlus className="w-5 h-5" /> Photo
        </button>
        <button
          type="submit"
          disabled={loading || (!content.trim() && !imageFile)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Send className="w-4 h-4" /> Post
        </button>
      </div>
    </form>
  );
};

export default CreatePost;
