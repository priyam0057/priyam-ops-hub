import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, FolderKanban, LogOut, Code2, Calendar, TrendingUp } from "lucide-react";
import BackupButton from "@/components/project/BackupButton";

interface Project {
  id: string;
  project_name: string;
  status: string;
  description: string;
  updated_at: string;
  technology_stack: string[];
  start_date: string | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const statusData = projects.reduce((acc: any[], project) => {
    const existing = acc.find(item => item.name === project.status);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: project.status, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  // Calculate technology statistics
  const techStats = projects.reduce((acc: Record<string, number>, project) => {
    if (project.technology_stack) {
      project.technology_stack.forEach((tech: string) => {
        acc[tech] = (acc[tech] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const techData = Object.entries(techStats)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Priyam Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{projects.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Active projects</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-accent" />
                Technologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent">{Object.keys(techStats).length}</p>
              <p className="text-sm text-muted-foreground mt-1">Different tech stacks</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 border-chart-2/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" style={{ color: 'hsl(var(--chart-2))' }} />
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                {projects.filter(p => {
                  const updatedDate = new Date(p.updated_at);
                  const now = new Date();
                  return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Updated projects</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Project Status Overview</CardTitle>
              <CardDescription>Distribution of projects by status</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No projects yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Technology Usage</CardTitle>
              <CardDescription>Most used technologies across projects</CardDescription>
            </CardHeader>
            <CardContent>
              {techData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={techData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No technology data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with your projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start h-12 font-semibold" 
                onClick={() => navigate("/projects")}
              >
                <FolderKanban className="mr-2 h-5 w-5" />
                View All Projects
              </Button>
              <Button 
                className="w-full justify-start h-12 font-semibold"
                variant="secondary"
                onClick={() => navigate("/projects/new")}
              >
                <Plus className="mr-2 h-5 w-5" />
                Create New Project
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Project Timeline
              </CardTitle>
              <CardDescription>Upcoming milestones and deadlines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-primary/10">
                    <div>
                      <p className="font-medium text-sm">{project.project_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.start_date ? new Date(project.start_date).toLocaleDateString() : "No start date"}
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-medium">
                      {project.status}
                    </span>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-center text-muted-foreground py-6 text-sm">No projects to display</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your 5 most recently updated projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-muted to-muted/50 rounded-lg cursor-pointer hover:from-muted/80 hover:to-muted/40 transition-all duration-200 border border-primary/10"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{project.project_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BackupButton 
                        projectId={project.id} 
                        projectName={project.project_name}
                        variant="ghost"
                        size="icon"
                        showLabel={false}
                      />
                      <span className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium">
                        {project.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No projects yet. Create your first project!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
