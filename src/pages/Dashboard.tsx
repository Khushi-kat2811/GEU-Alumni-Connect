import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CreatePost from "@/components/dashboard/CreatePost";
import PostCard from "@/components/dashboard/PostCard";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data: postsData } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!postsData || postsData.length === 0) return [];

      const postIds = postsData.map((p) => p.id);
      const userIds = [...new Set(postsData.map((p) => p.user_id))];

      const [{ data: profiles }, { data: likes }, { data: comments }, { data: userLikes }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, headline, avatar_url").in("user_id", userIds),
        supabase.from("post_likes").select("post_id").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
        user
          ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
          : Promise.resolve({ data: [] }),
      ]);

      const profilesMap: Record<string, { full_name: string; headline: string | null; avatar_url: string | null }> = {};
      (profiles || []).forEach((p) => { profilesMap[p.user_id] = p; });

      const likesMap: Record<string, number> = {};
      const commentsMap: Record<string, number> = {};
      const userLikedSet = new Set((userLikes || []).map((l) => l.post_id));

      (likes || []).forEach((l) => { likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1; });
      (comments || []).forEach((c) => { commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1; });

      return postsData.map((p) => ({
        ...p,
        profiles: profilesMap[p.user_id] || null,
        likes_count: likesMap[p.id] || 0,
        comments_count: commentsMap[p.id] || 0,
        liked_by_user: userLikedSet.has(p.id),
      }));
    },
    enabled: !!user,
  });

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <CreatePost />
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading posts...</p>
        ) : posts.length === 0 ? (
          <div className="bg-card rounded-xl shadow p-8 text-center">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
