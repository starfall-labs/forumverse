'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TextSearch } from 'lucide-react';
import { summarizeThread } from '@/ai/flows/summarize-thread';
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
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface SummarizeButtonProps {
  threadContent: string;
  threadTitle: string;
}

export function SummarizeButton({ threadContent, threadTitle }: SummarizeButtonProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!threadContent) {
        toast({ title: "Cannot Summarize", description: "Thread content is empty.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    setSummary(null); // Clear previous summary
    try {
      const result = await summarizeThread({ threadContent });
      setSummary(result.summary);
      setIsDialogOpen(true); // Open dialog once summary is ready
    } catch (error) {
      console.error('Error summarizing thread:', error);
      toast({ title: "Summarization Failed", description: "Could not generate summary for this thread.", variant: "destructive"});
      setSummary('Failed to generate summary.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleSummarize} disabled={isLoading} variant="outline" size="sm">
        <TextSearch className="mr-2 h-4 w-4" />
        {isLoading ? 'Summarizing...' : 'Summarize Thread'}
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Summary of: {threadTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              AI-generated summary of the key points:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {summary ? (
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
            ) : (
                <p className="text-sm text-muted-foreground">Loading summary...</p>
            )}
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
