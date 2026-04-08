import { useQuery } from "@tanstack/react-query";
import { postsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CreatePost from "@/components/dashboard/CreatePost";
import PostCard from "@/components/dashboard/PostCard";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => postsApi.list(),
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
