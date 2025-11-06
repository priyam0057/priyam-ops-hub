import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectDetailsTab from "@/components/project/ProjectDetailsTab";
import ProjectNotesTab from "@/components/project/ProjectNotesTab";
import ProjectIssuesTab from "@/components/project/ProjectIssuesTab";
import ProjectCredentialsTab from "@/components/project/ProjectCredentialsTab";
import ProjectTeamTab from "@/components/project/ProjectTeamTab";
import ProjectGoalsTab from "@/components/project/ProjectGoalsTab";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FolderArchive, FileText, Edit, Trash2 } from "lucide-react";
import { ManageBackupsDialog } from "@/components/project/ManageBackupsDialog";
import { generateProjectPDF } from "@/lib/pdfGenerator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [backupsDialogOpen, setBackupsDialogOpen] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('google_drive_token');
    setAccessToken(token);
  }, []);

  const handleQuickBackup = async () => {
    if (!project || !accessToken) {
      toast({
        title: "Error",
        description: "Please connect to Google Drive first",
        variant: "destructive"
      });
      return;
    }

    try {
      const [notesRes, issuesRes, teamRes, goalsRes] = await Promise.all([
        supabase.from("project_notes").select("*").eq("project_id", id),
        supabase.from("project_issues").select("*").eq("project_id", id),
        supabase.from("project_team").select("*").eq("project_id", id),
        supabase.from("project_goals").select("*").eq("project_id", id)
      ]);

      const projectData = {
        project,
        notes: notesRes.data || [],
        issues: issuesRes.data || [],
        team: teamRes.data || [],
        goals: goalsRes.data || []
      };

      const pdfDataUri = generateProjectPDF(projectData);
      const base64Content = pdfDataUri.split(',')[1];
      const fileName = `${project.project_name.replace(/\s+/g, "-")}-details-${new Date().toISOString().split("T")[0]}.pdf`;

      const { error } = await supabase.functions.invoke('google-drive', {
        body: { 
          action: 'upload', 
          accessToken,
          fileName,
          fileContent: base64Content,
          folderName: 'Project Details'
        }
      });

      if (error) throw error;

      toast({
        title: "Quick Backup Created",
        description: "Project details saved to Google Drive"
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Could not create quick backup",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: "Project has been permanently deleted"
      });

      navigate("/projects");
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete project",
        variant: "destructive"
      });
    }
  };

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
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {project.project_name}
            </h1>
          </div>
          <p className="text-muted-foreground ml-14">{project.description}</p>
          
          <div className="flex flex-wrap gap-2 ml-14">
            <Button 
              onClick={() => setBackupsDialogOpen(true)}
              className="gap-2"
            >
              <FolderArchive className="h-4 w-4" />
              Manage Backups
            </Button>
            <Button 
              onClick={handleQuickBackup}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Quick Backup (PDF)
            </Button>
            <Button 
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/projects/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{project.project_name}" and all associated data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
                    Delete Project
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Dev Notes</TabsTrigger>
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

        <ManageBackupsDialog
          open={backupsDialogOpen}
          onOpenChange={setBackupsDialogOpen}
          projectId={project.id}
          projectName={project.project_name}
          accessToken={accessToken || ''}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
