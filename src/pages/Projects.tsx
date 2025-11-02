import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, ExternalLink } from "lucide-react";
import BackupButton from "@/components/project/BackupButton";

interface Project {
  id: string;
  project_name: string;
  status: string;
  description: string;
  technology_stack: string[];
  repo_link: string | null;
  live_link: string | null;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              My Projects
            </h1>
          </div>
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-xl transition-all hover:border-primary/50 bg-gradient-to-br from-card to-card/50"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{project.project_name}</CardTitle>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-medium">
                    {project.status}
                  </span>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.technology_stack && project.technology_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.technology_stack.slice(0, 3).map((tech, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-accent/20 text-accent rounded-md font-medium">
                        {tech}
                      </span>
                    ))}
                    {project.technology_stack.length > 3 && (
                      <span className="text-xs px-2.5 py-1 bg-accent/20 text-accent rounded-md font-medium">
                        +{project.technology_stack.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {project.repo_link && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.repo_link!, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Repo
                    </Button>
                  )}
                  {project.live_link && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.live_link!, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Live
                    </Button>
                  )}
                  <div onClick={(e) => e.stopPropagation()}>
                    <BackupButton 
                      projectId={project.id} 
                      projectName={project.project_name}
                      variant="ghost"
                      size="sm"
                      showLabel={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              <Button onClick={() => navigate("/projects/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Projects;
