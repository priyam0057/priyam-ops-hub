import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Trash2, AlertTriangle } from "lucide-react";

interface Credential {
  id: string;
  key: string;
  value: string;
}

interface Props {
  projectId: string;
}

const ProjectCredentialsTab = ({ projectId }: Props) => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ key: "", value: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchCredentials();
  }, [projectId]);

  const fetchCredentials = async () => {
    const { data, error } = await supabase
      .from("project_credentials")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch credentials",
        variant: "destructive"
      });
    } else {
      setCredentials(data || []);
    }
  };

  const handleCreate = async () => {
    const { error } = await supabase
      .from("project_credentials")
      .insert({
        project_id: projectId,
        ...formData
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Credential added successfully"
      });
      setFormData({ key: "", value: "" });
      setOpen(false);
      fetchCredentials();
    }
  };

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: "Credential copied to clipboard"
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("project_credentials")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Credential deleted"
      });
      fetchCredentials();
    }
  };

  return (
    <div className="space-y-4 py-4">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Warning:</strong> For development convenience only. Do not store production master keys.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Credential
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credential</DialogTitle>
              <DialogDescription>Store API keys and passwords securely</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cred_key">Key Name</Label>
                <Input
                  id="cred_key"
                  placeholder="API_KEY"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cred_value">Value</Label>
                <Input
                  id="cred_value"
                  type="password"
                  placeholder="sk_test_..."
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Add Credential</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {credentials.map((cred) => (
          <div key={cred.id} className="p-4 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold">{cred.key}</h4>
              <p className="text-sm text-muted-foreground font-mono">
                {cred.value.slice(0, 4)}{'*'.repeat(Math.min(cred.value.length - 4, 20))}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(cred.value)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(cred.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {credentials.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No credentials stored</p>
        )}
      </div>
    </div>
  );
};

export default ProjectCredentialsTab;
