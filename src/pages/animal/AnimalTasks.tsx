import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, Plus, CheckSquare, Loader2, Calendar, Edit, Trash2,
  AlertTriangle, Clock, Tag, BarChart3, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { fetchAnimal } from '@/services/animalService';
import { fetchTasks, deleteTask, Task } from '@/services/taskApi';
import { Animal } from '@/types/AnimalTypes';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';

const AnimalTasks: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (!id) {
      navigate('/animals');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const animalData = await fetchAnimal(id);
        setAnimal(animalData);
        
        // Fetch tasks from the API
        const tasksData = await fetchTasks(id);
        setTasks(tasksData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load animal data or tasks');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete || !id) return;
    
    try {
      await deleteTask(id, taskToDelete.task_id);
      setTasks(tasks.filter(task => task.task_id !== taskToDelete.task_id));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const getFormattedDateTime = (date: string, time: string) => {
    try {
      return format(new Date(`${date}T${time}`), 'PPP hh:mm a');
    } catch {
      return `${date} ${time}`;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'in progress':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 mr-1" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  const isPastDue = (date: string, time: string) => {
    try {
      return isPast(new Date(`${date}T${time}`));
    } catch {
      return false;
    }
  };

  const filteredTasks = () => {
    if (activeTab === 'all') return tasks;
    if (activeTab === 'completed') return tasks.filter(task => task.status?.toLowerCase() === 'completed');
    if (activeTab === 'pending') return tasks.filter(task => task.status?.toLowerCase() === 'pending');
    if (activeTab === 'overdue') return tasks.filter(task => 
      isPastDue(task.start_date, task.start_time) && task.status?.toLowerCase() !== 'completed'
    );
    return tasks;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading animal data...</span>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          <h2 className="text-lg font-medium">Error</h2>
          <p>Animal not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/animals')}>
            Back to Animals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Button variant="ghost" className="mr-2 p-2" onClick={() => navigate(`/animals/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Avatar className="h-12 w-12 mr-4">
              
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{animal.name}'s Tasks</h1>
              <p className="text-sm text-muted-foreground">
                
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/animals/${id}/tasks/new`)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {filteredTasks().length === 0 ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No {activeTab !== 'all' ? activeTab : ''} Tasks</h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'all' 
                      ? "No tasks have been recorded for this animal yet." 
                      : `No ${activeTab} tasks found for this animal.`}
                  </p>
                  <Button onClick={() => navigate(`/animals/${id}/tasks/new`)}>
                    Add Task
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredTasks().map((task) => {
                const isPastDueTask = isPastDue(task.start_date, task.start_time) && 
                  task.status?.toLowerCase() !== 'completed';
                
                return (
                  <Card 
                    key={task.task_id} 
                    className={`overflow-hidden ${isPastDueTask ? 'border-red-300' : ''}`}
                  >
                    {isPastDueTask && (
                      <div className="bg-red-100 px-4 py-1 flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-700 mr-2" />
                        <span className="text-sm text-red-700 font-medium">Past due</span>
                      </div>
                    )}
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div>
                        <CardTitle className="text-xl">{task.title}</CardTitle>
                        <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-x-3 gap-y-1">
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Due: {getFormattedDateTime(task.start_date, task.start_time)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                     
<Button
  variant="ghost"
  size="icon"
  onClick={() => {
    if (task.task_id) {
      navigate(`/animals/${id}/tasks/${task.task_id}/edit`);
    } else {
      toast.error('Task ID is missing');
    }
  }}
>
  <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(task)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                      <p className="whitespace-pre-line mb-4 text-sm">
                        {task.description || 'No description provided'}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {task.task_type && (
                          <Badge variant="outline" className="flex items-center">
                            <Tag className="h-3 w-3 mr-1" />
                            {task.task_type}
                          </Badge>
                        )}
                        
                        {task.priority && (
                          <Badge variant="outline" className={`flex items-center ${getPriorityColor(task.priority)}`}>
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {task.priority}
                          </Badge>
                        )}
                        
                        {task.status && (
                          <Badge variant="outline" className={`flex items-center ${getStatusColor(task.status)}`}>
                            {getStatusIcon(task.status)}
                            {task.status}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnimalTasks;