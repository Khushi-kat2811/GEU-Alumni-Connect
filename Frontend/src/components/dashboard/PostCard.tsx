// import { useState } from "react";
// import { Heart, MessageCircle, User, Trash2 } from "lucide-react";
// import { postsApi, type Post } from "@/lib/api";
// import { useAuth } from "@/contexts/AuthContext";
// import { useQueryClient } from "@tanstack/react-query";
// import { formatDistanceToNow } from "date-fns";

// interface PostCardProps {
//   post: Post;
// }

// const PostCard = ({ post }: PostCardProps) => {
//   const { user }    = useAuth();
//   const queryClient = useQueryClient();
//   const [showComments, setShowComments] = useState(false);
//   const [comment, setComment]           = useState("");

//   const isOwner = user?.id === post.user_id;

//   const toggleLike = async () => {
//     if (!user) return;
//     await postsApi.toggleLike(post.id);
//     queryClient.invalidateQueries({ queryKey: ["posts"] });
//   };

//   const deletePost = async () => {
//     if (!isOwner) return;
//     await postsApi.delete(post.id);
//     queryClient.invalidateQueries({ queryKey: ["posts"] });
//   };

//   const submitComment = async () => {
//     if (!comment.trim() || !user) return;
//     await postsApi.addComment(post.id, comment.trim());
//     setComment("");
//     queryClient.invalidateQueries({ queryKey: ["posts"] });
//   };

//   const name     = post.profiles?.full_name || "Alumni";
//   const headline = post.profiles?.headline  || "";

//   return (
//     <div className="bg-card rounded-xl shadow p-4 mb-3">
//       {/* Post header */}
//       <div className="flex items-center gap-3 mb-3">
//         <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
//           {post.profiles?.avatar_url ? (
//             <img
//               src={post.profiles.avatar_url}
//               className="w-10 h-10 rounded-full object-cover"
//               alt=""
//             />
//           ) : (
//             <User className="w-5 h-5 text-primary" />
//           )}
//         </div>
//         <div className="flex-1 min-w-0">
//           <p className="font-semibold text-sm text-foreground">{name}</p>
//           {headline && <p className="text-xs text-muted-foreground">{headline}</p>}
//           <p className="text-xs text-muted-foreground">
//             {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
//           </p>
//         </div>
//         {isOwner && (
//           <button
//             onClick={deletePost}
//             className="text-muted-foreground hover:text-destructive transition-colors p-1"
//             title="Delete post"
//           >
//             <Trash2 className="w-4 h-4" />
//           </button>
//         )}
//       </div>

//       {/* Content */}
//       {post.content && (
//         <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{post.content}</p>
//       )}
//       {post.image_url && (
//         <img
//           src={post.image_url}
//           alt="Post image"
//           className="w-full rounded-lg mb-3 max-h-96 object-cover"
//         />
//       )}

//       {/* Actions */}
//       <div className="flex items-center gap-4 border-t border-border pt-2">
//         <button
//           onClick={toggleLike}
//           className={`flex items-center gap-1 text-sm transition-colors ${
//             post.liked_by_user
//               ? "text-secondary font-semibold"
//               : "text-muted-foreground hover:text-secondary"
//           }`}
//         >
//           <Heart className={`w-4 h-4 ${post.liked_by_user ? "fill-secondary" : ""}`} />
//           {post.likes_count}
//         </button>
//         <button
//           onClick={() => setShowComments(!showComments)}
//           className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
//         >
//           <MessageCircle className="w-4 h-4" /> {post.comments_count}
//         </button>
//       </div>

//       {/* Comment box */}
//       {showComments && (
//         <div className="mt-3 space-y-2">
//           <div className="flex gap-2">
//             <input
//               value={comment}
//               onChange={(e) => setComment(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && submitComment()}
//               placeholder="Write a comment..."
//               className="flex-1 text-sm border border-input bg-background rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
//             />
//             <button
//               onClick={submitComment}
//               className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
//             >
//               Post
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PostCard;
import { useState } from "react";
import { Heart, MessageCircle, Trash2, MoreHorizontal, Share2 } from "lucide-react";
import { postsApi, type Post } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user }    = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment]           = useState("");
  const [likeAnim, setLikeAnim]         = useState(false);

  const isOwner = user?.id === post.user_id;

  const toggleLike = async () => {
    if (!user) return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    await postsApi.toggleLike(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const deletePost = async () => {
    if (!isOwner) return;
    await postsApi.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    toast.success("Post deleted");
  };

  const submitComment = async () => {
    if (!comment.trim() || !user) return;
    await postsApi.addComment(post.id, comment.trim());
    setComment("");
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    toast.success("Comment added");
  };

  const name     = post.profiles?.full_name || "Alumni";
  const headline = post.profiles?.headline  || "";
  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover-lift">
      {/* Post header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-border/50">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              className="w-11 h-11 rounded-full object-cover"
              alt=""
            />
          ) : (
            <span className="text-primary text-sm font-bold">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{name}</p>
          {headline && <p className="text-xs text-muted-foreground truncate">{headline}</p>}
          <p className="text-[11px] text-muted-foreground/70">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        {isOwner ? (
          <button
            onClick={deletePost}
            className="text-muted-foreground/50 hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/5"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <button className="text-muted-foreground/40 hover:text-muted-foreground p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-3">
        {post.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full rounded-xl max-h-[420px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
          />
        </div>
      )}

      {/* Stats bar */}
      {(post.likes_count > 0 || post.comments_count > 0) && (
        <div className="flex items-center justify-between px-4 py-1.5 text-xs text-muted-foreground">
          {post.likes_count > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Heart className="w-2.5 h-2.5 text-secondary fill-secondary" />
              </span>
              {post.likes_count} {post.likes_count === 1 ? "like" : "likes"}
            </span>
          )}
          {post.comments_count > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="hover:underline hover:text-foreground transition-colors"
            >
              {post.comments_count} {post.comments_count === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t border-border/60 mx-4">
        <button
          onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg my-1 transition-all ${
            post.liked_by_user
              ? "text-secondary"
              : "text-muted-foreground hover:text-secondary hover:bg-secondary/5"
          }`}
        >
          <Heart
            className={`w-[18px] h-[18px] transition-transform ${
              post.liked_by_user ? "fill-secondary" : ""
            } ${likeAnim ? "scale-125" : "scale-100"}`}
          />
          Like
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg my-1 transition-colors"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          Comment
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-lg my-1 transition-colors">
          <Share2 className="w-[18px] h-[18px]" />
          Share
        </button>
      </div>

      {/* Comment box */}
      {showComments && (
        <div className="border-t border-border/60 p-4 bg-muted/20 animate-fade-up">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Write a comment..."
              className="flex-1 text-sm border border-input bg-card rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            <button
              onClick={submitComment}
              disabled={!comment.trim()}
              className="gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;