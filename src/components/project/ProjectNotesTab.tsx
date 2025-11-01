import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Props {
  projectId: string;
}

const ProjectNotesTab = ({ projectId }: Props) => {
  const [notes, setNotes] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("project_notes")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive"
      });
    } else if (data) {
      setNotes(data.content || "");
      setNoteId(data.id);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (noteId) {
      const { error } = await supabase
        .from("project_notes")
        .update({ content: notes })
        .eq("id", noteId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success!",
          description: "Notes saved successfully"
        });
      }
    } else {
      const { data, error } = await supabase
        .from("project_notes")
        .insert({ project_id: projectId, content: notes })
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setNoteId(data.id);
        toast({
          title: "Success!",
          description: "Notes saved successfully"
        });
      }
    }
  };

  if (loading) {
    return <p className="text-muted-foreground py-4">Loading notes...</p>;
  }

  return (
    <div className="space-y-4 py-4">
      <Textarea
        placeholder="Add your development notes, thoughts, and code snippets here..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={15}
        className="font-mono text-sm"
      />
      <Button onClick={handleSave}>
        <Save className="mr-2 h-4 w-4" />
        Save Notes
      </Button>
    </div>
  );
};

export default ProjectNotesTab;
