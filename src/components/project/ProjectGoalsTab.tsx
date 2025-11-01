import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Goal {
  id: string;
  goal: string;
  completed: boolean;
}

interface Props {
  projectId: string;
}

const ProjectGoalsTab = ({ projectId }: Props) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, [projectId]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from("project_goals")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive"
      });
    } else {
      setGoals(data || []);
    }
  };

  const handleCreate = async () => {
    if (!newGoal.trim()) return;

    const { error } = await supabase
      .from("project_goals")
      .insert({
        project_id: projectId,
        goal: newGoal,
        completed: false
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
        description: "Goal added successfully"
      });
      setNewGoal("");
      fetchGoals();
    }
  };

  const handleToggle = async (goal: Goal) => {
    const { error } = await supabase
      .from("project_goals")
      .update({ completed: !goal.completed })
      .eq("id", goal.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      fetchGoals();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("project_goals")
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
        description: "Goal deleted"
      });
      fetchGoals();
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a future goal or roadmap item..."
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
        />
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {goals.map((goal) => (
          <div key={goal.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Checkbox
              checked={goal.completed}
              onCheckedChange={() => handleToggle(goal)}
            />
            <p className={`flex-1 ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
              {goal.goal}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(goal.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {goals.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No goals yet. Add your first roadmap item!</p>
        )}
      </div>
    </div>
  );
};

export default ProjectGoalsTab;
