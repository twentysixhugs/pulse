'use client';

import { useState } from 'react';
import {
  Trader,
  AlertPost,
  traders as initialTraders,
  alerts as initialAlerts,
} from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PostEditor } from './post-editor';
import { Button } from '../ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';

export function TraderDashboard() {
  // In a real app, this would be the logged-in trader
  const [currentTrader, setCurrentTrader] = useState<Trader>(initialTraders[0]);
  const [alerts, setAlerts] = useState<AlertPost[]>(initialAlerts);
  const [editingPost, setEditingPost] = useState<AlertPost | undefined>(undefined);
  
  const { toast } = useToast();

  const handleStatusChange = (isActive: boolean) => {
    const newStatus = isActive ? 'active' : 'inactive';
    setCurrentTrader({ ...currentTrader, status: newStatus });
    toast({
      title: 'Status Updated',
      description: `Your status is now ${newStatus}.`,
    });
  };
  
  const handleSavePost = (postData: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string}) => {
    if (postData.id) { // Editing
      setAlerts(alerts.map(a => a.id === postData.id ? {...a, text: postData.text} : a));
      setEditingPost(undefined);
    } else { // Creating
      const newPost: AlertPost = {
        ...postData,
        id: `alert-${Date.now()}`,
        timestamp: new Date().toISOString(),
        likes: [],
        dislikes: [],
        comments: [],
      };
      setAlerts([newPost, ...alerts]);
    }
  };

  const deletePost = (postId: string) => {
    setAlerts(alerts.filter(a => a.id !== postId));
    toast({ variant: 'destructive', title: 'Post Deleted' });
  }

  const traderAlerts = alerts.filter(a => a.traderId === currentTrader.id)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <PostEditor traderId={currentTrader.id} onSave={handleSavePost} postToEdit={editingPost} />
        <div>
            <h2 className="text-2xl font-headline font-bold mb-4">Your Posts</h2>
            <div className="space-y-4">
                {traderAlerts.map(alert => (
                    <Card key={alert.id}>
                        <CardHeader className="flex flex-row justify-between items-start">
                           <div>
                             <p className="text-sm text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                             <p className="mt-2">{alert.text}</p>
                           </div>
                           <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingPost(alert)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will permanently delete your post. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deletePost(alert.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
      </div>
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Your Status</CardTitle>
            <CardDescription>
              Set your profile to active to be visible to users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="trader-status"
                checked={currentTrader.status === 'active'}
                onCheckedChange={handleStatusChange}
              />
              <Label htmlFor="trader-status" className={currentTrader.status === 'active' ? 'text-primary' : ''}>
                {currentTrader.status === 'active' ? 'Active' : 'Inactive'}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
