import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Save } from "lucide-react";

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

interface Props {
  project: Project;
  onUpdate: () => void;
}

const ProjectDetailsTab = ({ project, onUpdate }: Props) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    project_name: project.project_name,
    description: project.description,
    status: project.status,
    start_date: project.start_date,
    technology_stack: project.technology_stack.join(", "),
    repo_link: project.repo_link,
    live_link: project.live_link
  });
  const { toast } = useToast();

  const handleSave = async () => {
    const techStack = formData.technology_stack
      .split(",")
      .map(tech => tech.trim())
      .filter(tech => tech.length > 0);

    const { error } = await supabase
      .from("projects")
      .update({
        project_name: formData.project_name,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date || null,
        technology_stack: techStack,
        repo_link: formData.repo_link || null,
        live_link: formData.live_link || null
      })
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Project updated successfully"
      });
      setEditing(false);
      onUpdate();
    }
  };

  if (!editing) {
    return (
      <div className="space-y-6 py-4">
        <div className="flex justify-end">
          <Button onClick={() => setEditing(true)}>Edit Details</Button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
              {project.status}
            </span>
          </div>
          
          {project.start_date && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Start Date</h3>
              <p>{new Date(project.start_date).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {project.technology_stack.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {project.technology_stack.map((tech, i) => (
                <span key={i} className="px-3 py-1 bg-muted rounded text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {project.repo_link && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Repository</h3>
              <Button variant="outline" size="sm" onClick={() => window.open(project.repo_link, '_blank')}>
                <ExternalLink className="mr-2 h-3 w-3" />
                View Repository
              </Button>
            </div>
          )}
          
          {project.live_link && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Live Site</h3>
              <Button variant="outline" size="sm" onClick={() => window.open(project.live_link, '_blank')}>
                <ExternalLink className="mr-2 h-3 w-3" />
                View Live Site
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit_project_name">Project Name</Label>
        <Input
          id="edit_project_name"
          value={formData.project_name}
          onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit_description">Description</Label>
        <Textarea
          id="edit_description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit_status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="Development">Development</SelectItem>
              <SelectItem value="Testing">Testing</SelectItem>
              <SelectItem value="Live">Live</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_start_date">Start Date</Label>
          <Input
            id="edit_start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit_technology_stack">Technology Stack (comma-separated)</Label>
        <Input
          id="edit_technology_stack"
          value={formData.technology_stack}
          onChange={(e) => setFormData({ ...formData, technology_stack: e.target.value })}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit_repo_link">Repository Link</Label>
          <Input
            id="edit_repo_link"
            type="url"
            value={formData.repo_link}
            onChange={(e) => setFormData({ ...formData, repo_link: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_live_link">Live Link</Label>
          <Input
            id="edit_live_link"
            type="url"
            value={formData.live_link}
            onChange={(e) => setFormData({ ...formData, live_link: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        <Button variant="outline" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ProjectDetailsTab;
