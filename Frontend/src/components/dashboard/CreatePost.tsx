// import { useState, useRef } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import { postsApi } from "@/lib/api";
// import { Send, ImagePlus, X } from "lucide-react";
// import { useQueryClient } from "@tanstack/react-query";
// import { toast } from "sonner";

// const CreatePost = () => {
//   const { user }      = useAuth();
//   const queryClient   = useQueryClient();
//   const [content, setContent]           = useState("");
//   const [loading, setLoading]           = useState(false);
//   const [imageFile, setImageFile]       = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setImageFile(file);
//     setImagePreview(URL.createObjectURL(file));
//   };

//   const removeImage = () => {
//     setImageFile(null);
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if ((!content.trim() && !imageFile) || !user) return;
//     setLoading(true);
//     try {
//       await postsApi.create(content.trim(), imageFile);
//       setContent("");
//       removeImage();
//       queryClient.invalidateQueries({ queryKey: ["posts"] });
//     } catch {
//       toast.error("Failed to create post");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow p-4 mb-4">
//       <textarea
//         value={content}
//         onChange={(e) => setContent(e.target.value)}
//         placeholder="What's on your mind? Share updates, achievements..."
//         className="w-full resize-none border border-input bg-background rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
//       />

//       {imagePreview && (
//         <div className="relative mt-2 inline-block">
//           <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
//           <button
//             type="button"
//             onClick={removeImage}
//             className="absolute top-1 right-1 bg-foreground/70 text-background rounded-full p-0.5 hover:bg-foreground/90 transition-colors"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       )}

//       <div className="flex justify-between items-center mt-2">
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="image/*"
//           onChange={handleImageSelect}
//           className="hidden"
//         />
//         <button
//           type="button"
//           onClick={() => fileInputRef.current?.click()}
//           className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
//         >
//           <ImagePlus className="w-5 h-5" /> Photo
//         </button>
//         <button
//           type="submit"
//           disabled={loading || (!content.trim() && !imageFile)}
//           className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
//         >
//           <Send className="w-4 h-4" /> Post
//         </button>
//       </div>
//     </form>
//   );
// };

// export default CreatePost;
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { postsApi, profilesApi, type Profile } from "@/lib/api";
import { Send, ImagePlus, X, Smile } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const CreatePost = () => {
  const { user }      = useAuth();
  const queryClient   = useQueryClient();
  const [content, setContent]           = useState("");
  const [loading, setLoading]           = useState(false);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [focused, setFocused]           = useState(false);
  const [profile, setProfile]           = useState<Profile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) profilesApi.get(user.id).then(setProfile).catch(() => {});
  }, [user]);

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
      setFocused(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post published!");
    } catch {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const initials = (profile?.full_name || "A")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form
      onSubmit={handleSubmit}
      className={`glass-card rounded-2xl p-4 mb-5 transition-all duration-300 ${
        focused ? "ring-2 ring-primary/20 shadow-lg shadow-primary/5" : ""
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
          ) : (
            <span className="text-primary text-sm font-bold">{initials}</span>
          )}
        </div>

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Share something with the alumni community..."
            className="w-full resize-none bg-muted/50 rounded-xl p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:bg-muted/80 transition-colors min-h-[52px]"
            rows={focused ? 3 : 1}
          />
        </div>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mt-3 ml-14 inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl object-cover shadow-sm" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-md hover:opacity-90 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Actions */}
      <div className={`flex justify-between items-center mt-3 ml-14 transition-all duration-300 ${focused ? "opacity-100" : "opacity-70"}`}>
        <div className="flex gap-1">
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
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ImagePlus className="w-4 h-4" /> Photo
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-secondary hover:bg-secondary/5 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Smile className="w-4 h-4" /> Activity
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || (!content.trim() && !imageFile)}
          className="gradient-primary text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-primary/20"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
};

export default CreatePost;