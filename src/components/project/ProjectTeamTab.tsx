import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Mail } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  contact: string;
}

interface Props {
  projectId: string;
}

const ProjectTeamTab = ({ projectId }: Props) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "", contact: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchTeam();
  }, [projectId]);

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from("project_team")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch team",
        variant: "destructive"
      });
    } else {
      setTeam(data || []);
    }
  };

  const handleCreate = async () => {
    const { error } = await supabase
      .from("project_team")
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
        description: "Team member added successfully"
      });
      setFormData({ name: "", role: "", contact: "" });
      setOpen(false);
      fetchTeam();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("project_team")
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
        description: "Team member removed"
      });
      fetchTeam();
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>Add a colleague working on this project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_name">Name</Label>
                <Input
                  id="team_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_role">Role</Label>
                <Input
                  id="team_role"
                  placeholder="Frontend Dev, UI/UX, Project Manager"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_contact">Contact</Label>
                <Input
                  id="team_contact"
                  placeholder="email@example.com"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Add Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {team.map((member) => (
          <div key={member.id} className="p-4 bg-muted rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold">{member.name}</h4>
                <p className="text-sm text-primary">{member.role}</p>
                {member.contact && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {member.contact}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(member.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {team.length === 0 && (
          <div className="col-span-2">
            <p className="text-center text-muted-foreground py-8">No team members yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectTeamTab;
