import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
}

interface Props {
  projectId: string;
}

const ProjectIssuesTab = ({ projectId }: Props) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "Open"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIssues();
  }, [projectId]);

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from("project_issues")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch issues",
        variant: "destructive"
      });
    } else {
      setIssues(data || []);
    }
  };

  const handleCreate = async () => {
    const { error } = await supabase
      .from("project_issues")
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
        description: "Issue created successfully"
      });
      setFormData({ title: "", description: "", priority: "Medium", status: "Open" });
      setOpen(false);
      fetchIssues();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("project_issues")
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
        description: "Issue deleted"
      });
      fetchIssues();
    }
  };

  const handleToggleStatus = async (issue: Issue) => {
    const newStatus = issue.status === "Open" ? "Closed" : "Open";
    const { error } = await supabase
      .from("project_issues")
      .update({ status: newStatus })
      .eq("id", issue.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      fetchIssues();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-destructive";
      case "Medium": return "bg-secondary";
      case "Low": return "bg-muted";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Issue
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
              <DialogDescription>Add a bug or error to track</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue_title">Title</Label>
                <Input
                  id="issue_title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_description">Description</Label>
                <Textarea
                  id="issue_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Issue</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="p-4 bg-muted rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold">{issue.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(issue.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(issue.priority)}>
                {issue.priority}
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() => handleToggleStatus(issue)}
              >
                {issue.status}
              </Badge>
            </div>
          </div>
        ))}
        {issues.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No issues yet</p>
        )}
      </div>
    </div>
  );
};

export default ProjectIssuesTab;
