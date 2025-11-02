import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Cloud, Download, Trash2, Upload, Loader2, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || "";

interface DriveFile {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
}

interface GoogleDriveManagerProps {
  projectId: string;
  projectName: string;
}

const GoogleDriveManager = ({ projectId, projectName }: GoogleDriveManagerProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('google_drive_token');
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
      fetchFiles(token);
    }
  }, []);

  const handleGoogleAuth = () => {
    const redirectUri = window.location.origin;
    const scope = 'https://www.googleapis.com/auth/drive.file';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
    
    // Open popup for authentication
    const popup = window.open(authUrl, 'Google Auth', 'width=500,height=600');
    
    // Listen for the access token
    window.addEventListener('message', (event) => {
      if (event.data.type === 'google-auth') {
        const token = event.data.token;
        localStorage.setItem('google_drive_token', token);
        setAccessToken(token);
        setIsAuthenticated(true);
        fetchFiles(token);
        popup?.close();
        toast({
          title: "Connected",
          description: "Successfully connected to Google Drive"
        });
      }
    });
  };

  const fetchFiles = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'list', accessToken: token }
      });

      if (error) throw error;
      setFiles(data.files || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files from Google Drive",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackup = async () => {
    if (!accessToken) return;

    setUploading(true);
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

      // Convert to JSON string
      const jsonString = JSON.stringify(backupData, null, 2);
      
      // Convert to base64
      const base64Content = btoa(jsonString);

      const fileName = `${projectName.replace(/\s+/g, "-")}-backup-${new Date().toISOString().split("T")[0]}.json`;

      const { error } = await supabase.functions.invoke('google-drive', {
        body: { 
          action: 'upload', 
          accessToken, 
          fileName,
          fileContent: base64Content
        }
      });

      if (error) throw error;

      toast({
        title: "Backup Uploaded",
        description: "Project backup uploaded to Google Drive successfully"
      });

      fetchFiles(accessToken);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not upload backup to Google Drive",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'download', accessToken, fileId }
      });

      if (error) throw error;

      // Convert array back to Uint8Array and create blob
      const uint8Array = new Uint8Array(data.content);
      const blob = new Blob([uint8Array], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "File downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download file from Google Drive",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'delete', accessToken, fileId }
      });

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Backup deleted from Google Drive"
      });

      fetchFiles(accessToken);
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete file from Google Drive",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
    return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  if (!isAuthenticated) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Google Drive Backups
          </CardTitle>
          <CardDescription>
            Connect your Google Drive to backup and manage your project files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <FolderOpen className="h-16 w-16 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Connect to Google Drive to store and manage your project backups in the cloud
            </p>
            <Button onClick={handleGoogleAuth} size="lg" className="gap-2">
              <Cloud className="h-5 w-5" />
              Connect Google Drive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              Google Drive Backups
            </CardTitle>
            <CardDescription>
              Manage your project backups stored in Google Drive
            </CardDescription>
          </div>
          <Button onClick={handleUploadBackup} disabled={uploading} className="gap-2">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload Backup"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && files.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No backups found</p>
            <p className="text-xs text-muted-foreground">Upload your first backup to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-muted to-muted/50 rounded-lg border border-primary/10"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{file.name}</h4>
                  <div className="flex gap-3 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {file.size ? formatFileSize(file.size) : 'Unknown size'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(file.id, file.name)}
                    disabled={loading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={loading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{file.name}" from Google Drive. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(file.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleDriveManager;
