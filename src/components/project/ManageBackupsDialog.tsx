import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Trash2, Upload, Loader2, FolderOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface DriveFile {
  id: string;
  name: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
}

interface ManageBackupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  accessToken: string;
}

export const ManageBackupsDialog = ({ open, onOpenChange, projectId, projectName, accessToken }: ManageBackupsDialogProps) => {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && accessToken) {
      fetchFiles();
    }
  }, [open, accessToken]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { 
          action: 'list', 
          accessToken,
          projectName
        }
      });

      if (error) throw error;
      setFiles(data.files || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch backups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const base64Content = btoa(content);

        const fileName = `${projectName.replace(/\s+/g, "-")}-backup-${new Date().toISOString().split("T")[0]}-${selectedFile.name}`;

        const { error } = await supabase.functions.invoke('google-drive', {
          body: { 
            action: 'upload', 
            accessToken,
            fileName,
            fileContent: base64Content,
            projectName
          }
        });

        if (error) throw error;

        toast({
          title: "Backup Uploaded",
          description: "Project backup uploaded to Google Drive successfully"
        });

        setSelectedFile(null);
        fetchFiles();
      };
      reader.readAsText(selectedFile);
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
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'download', accessToken, fileId }
      });

      if (error) throw error;

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
        description: "Backup downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download backup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'delete', accessToken, fileId }
      });

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Backup deleted successfully"
      });

      fetchFiles();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Could not delete backup",
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
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Backups - {projectName}</DialogTitle>
          <DialogDescription>
            Upload, download, or delete backups for this project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Upload Section */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-sm">Upload New Backup</h3>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".json,.zip"
                onChange={handleFileSelect}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            {selectedFile && (
              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Save to Drive
                </Button>
                <Button variant="outline" onClick={() => setSelectedFile(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Backups List */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-sm mb-3">Existing Backups</h3>
            {loading && files.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No backups found for this project</p>
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{file.name}</h4>
                      <div className="flex gap-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {file.size ? formatFileSize(file.size) : 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.modifiedTime).toLocaleDateString()}
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
                              This will permanently delete "{file.name}". This action cannot be undone.
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};