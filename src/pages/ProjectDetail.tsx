import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import BackupButton from "@/components/project/BackupButton";
import GoogleDriveManager from "@/components/project/GoogleDriveManager";
import ProjectDetailsTab from "@/components/project/ProjectDetailsTab";
import ProjectNotesTab from "@/components/project/ProjectNotesTab";
import ProjectIssuesTab from "@/components/project/ProjectIssuesTab";
import ProjectCredentialsTab from "@/components/project/ProjectCredentialsTab";
import ProjectTeamTab from "@/components/project/ProjectTeamTab";
import ProjectGoalsTab from "@/components/project/ProjectGoalsTab";

interface Project {
  id: string;
  project_name: string;
  description: string;
  status: string;
  start_date: string;
  technology_stack: string[];
  repo_link: string;
  live_link: string;
}

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project",
        variant: "destructive"
      });
      navigate("/projects");
    } else {
      setProject(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {project.project_name}
              </h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
            </div>
          </div>
          <BackupButton 
            projectId={project.id} 
            projectName={project.project_name}
            size="lg"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="credentials">Credentials</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <ProjectDetailsTab project={project} onUpdate={fetchProject} />
              </TabsContent>
              
              <TabsContent value="notes">
                <ProjectNotesTab projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="issues">
                <ProjectIssuesTab projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="credentials">
                <ProjectCredentialsTab projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="team">
                <ProjectTeamTab projectId={project.id} />
              </TabsContent>
              
              <TabsContent value="goals">
                <ProjectGoalsTab projectId={project.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <GoogleDriveManager projectId={project.id} projectName={project.project_name} />
      </div>
    </div>
  );
};

export default ProjectDetail;
