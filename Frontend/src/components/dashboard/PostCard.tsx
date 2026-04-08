import { useState } from "react";
import { Heart, MessageCircle, User, Trash2 } from "lucide-react";
import { postsApi, type Post } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user }    = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment]           = useState("");

  const isOwner = user?.id === post.user_id;

  const toggleLike = async () => {
    if (!user) return;
    await postsApi.toggleLike(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const deletePost = async () => {
    if (!isOwner) return;
    await postsApi.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const submitComment = async () => {
    if (!comment.trim() || !user) return;
    await postsApi.addComment(post.id, comment.trim());
    setComment("");
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const name     = post.profiles?.full_name || "Alumni";
  const headline = post.profiles?.headline  || "";

  return (
    <div className="bg-card rounded-xl shadow p-4 mb-3">
      {/* Post header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              className="w-10 h-10 rounded-full object-cover"
              alt=""
            />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">{name}</p>
          {headline && <p className="text-xs text-muted-foreground">{headline}</p>}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={deletePost}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Delete post"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{post.content}</p>
      )}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post image"
          className="w-full rounded-lg mb-3 max-h-96 object-cover"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-border pt-2">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 text-sm transition-colors ${
            post.liked_by_user
              ? "text-secondary font-semibold"
              : "text-muted-foreground hover:text-secondary"
          }`}
        >
          <Heart className={`w-4 h-4 ${post.liked_by_user ? "fill-secondary" : ""}`} />
          {post.likes_count}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> {post.comments_count}
        </button>
      </div>

      {/* Comment box */}
      {showComments && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Write a comment..."
              className="flex-1 text-sm border border-input bg-background rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={submitComment}
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90"
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
