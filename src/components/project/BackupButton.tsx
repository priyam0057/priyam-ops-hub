import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectPDF } from "@/lib/pdfGenerator";

interface BackupButtonProps {
  projectId: string;
  projectName: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

const BackupButton = ({ projectId, projectName, variant = "outline", size = "default", showLabel = true }: BackupButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBackup = async () => {
    setLoading(true);
    try {
      // Fetch all project data
      const [projectRes, notesRes, issuesRes, teamRes, goalsRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).single(),
        supabase.from("project_notes").select("*").eq("project_id", projectId),
        supabase.from("project_issues").select("*").eq("project_id", projectId),
        supabase.from("project_team").select("*").eq("project_id", projectId),
        supabase.from("project_goals").select("*").eq("project_id", projectId)
      ]);

      const backupData = {
        project: projectRes.data,
        notes: notesRes.data || [],
        issues: issuesRes.data || [],
        team: teamRes.data || [],
        goals: goalsRes.data || [],
        backupDate: new Date().toISOString(),
        version: "1.0"
      };

      // Generate and download PDF
      const pdfDataUri = generateProjectPDF(backupData);
      const link = document.createElement("a");
      link.href = pdfDataUri;
      link.download = `${projectName.replace(/\s+/g, "-")}-backup-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Backup Created",
        description: "Project backup downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Could not create project backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBackup}
      disabled={loading}
      variant={variant}
      size={size}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-2">{loading ? "Backing up..." : "Backup"}</span>}
    </Button>
  );
};

export default BackupButton;
