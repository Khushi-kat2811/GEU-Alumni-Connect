import { useState } from "react";
import { Heart, MessageCircle, Trash2, MoreHorizontal } from "lucide-react";
import { postsApi, type Post, type PostComment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PostCardProps { post: Post; }

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const isOwner = user?.id === post.user_id;
  const isAdmin = user?.is_admin;

  // Fetch comments only when the section is opened
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => postsApi.comments(post.id),
    enabled: showComments,
  });

  const toggleLike = async () => {
    if (!user) return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    await postsApi.toggleLike(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const deletePost = async () => {
    if (!isOwner) return;
    if (!confirm("Delete this post?")) return;
    await postsApi.delete(post.id);
    queryClient.invalidateQueries({ queryKey: ["posts"] });
    toast.success("Post deleted");
  };

  const submitComment = async () => {
    if (!comment.trim() || !user) return;
    setPosting(true);
    try {
      await postsApi.addComment(post.id, comment.trim());
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally { setPosting(false); }
  };

  const removeComment = async (cid: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await postsApi.deleteComment(post.id, cid);
      queryClient.invalidateQueries({ queryKey: ["post-comments", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const name = post.profiles?.full_name || "Alumni";
  const headline = post.profiles?.headline || "";
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="glass-card rounded-2xl overflow-hidden hover-lift">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-border/50">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
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
          <button onClick={deletePost} title="Delete post"
            className="text-muted-foreground/50 hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/5">
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
        {post.content && <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img src={post.image_url} alt="Post"
            className="w-full rounded-xl max-h-[420px] object-cover cursor-pointer hover:opacity-95 transition-opacity" />
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
            <button onClick={() => setShowComments(!showComments)}
              className="hover:underline hover:text-foreground transition-colors">
              {post.comments_count} {post.comments_count === 1 ? "comment" : "comments"}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center border-t border-border/60 mx-4">
        <button onClick={toggleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg my-1 transition-all ${
            post.liked_by_user ? "text-secondary" : "text-muted-foreground hover:text-secondary hover:bg-secondary/5"
          }`}>
          <Heart className={`w-[18px] h-[18px] transition-transform ${post.liked_by_user ? "fill-secondary" : ""} ${likeAnim ? "scale-125" : "scale-100"}`} />
          Like
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg my-1 transition-colors">
          <MessageCircle className="w-[18px] h-[18px]" />
          Comment
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border/60 p-4 bg-muted/20 animate-fade-up space-y-3">
          {/* Existing comments */}
          {loadingComments ? (
            <p className="text-xs text-muted-foreground text-center py-2">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
          ) : (
            <ul className="space-y-2.5">
              {comments.map((c: PostComment) => {
                const cInitials = (c.full_name || "A").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                const canDelete = c.user_id === user?.id || isAdmin;
                return (
                  <li key={c.id} className="flex gap-2.5 items-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <span className="text-primary text-[10px] font-bold">{cInitials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 bg-card rounded-2xl px-3 py-2 border border-border/40">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-foreground">{c.full_name || "Alumni"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                        </span>
                        {canDelete && (
                          <button onClick={() => removeComment(c.id)} title="Delete comment"
                            className="ml-auto text-muted-foreground/40 hover:text-destructive transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">{c.content}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Compose */}
          <div className="flex gap-2 pt-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !posting && submitComment()}
              placeholder="Write a comment..."
              className="flex-1 text-sm border border-input bg-card rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
            <button onClick={submitComment} disabled={!comment.trim() || posting}
              className="gradient-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm">
              {posting ? "..." : "Post"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
