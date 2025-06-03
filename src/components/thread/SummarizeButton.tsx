
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
import { useTranslation } from '@/hooks/useTranslation';

interface SummarizeButtonProps {
  threadContent: string;
  threadTitle: string;
}

export function SummarizeButton({ threadContent, threadTitle }: SummarizeButtonProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSummarize = async () => {
    if (!threadContent) {
        toast({ 
          title: t('toast.summarizeCannotSummarizeTitle', "Cannot Summarize"), 
          description: t('toast.summarizeCannotSummarizeDescription', "Thread content is empty."), 
          variant: "destructive"
        });
        return;
    }
    setIsLoading(true);
    setSummary(null); 
    try {
      const result = await summarizeThread({ threadContent });
      setSummary(result.summary);
      setIsDialogOpen(true); 
    } catch (error) {
      console.error('Error summarizing thread:', error);
      toast({ 
        title: t('toast.summarizeFailedTitle', "Summarization Failed"), 
        description: t('toast.summarizeFailedDescription', "Could not generate summary for this thread."), 
        variant: "destructive"
      });
      setSummary('Failed to generate summary.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button onClick={handleSummarize} disabled={isLoading} variant="outline" size="sm">
        <TextSearch className="mr-2 h-4 w-4" />
        {isLoading ? t('summarizeButton.buttonLoadingText', 'Summarizing...') : t('summarizeButton.buttonText', 'Summarize Thread')}
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="sm:max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">{`${t('summarizeButton.dialogTitlePrefix', 'Summary of:')} ${threadTitle}`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('summarizeButton.dialogDescription', 'AI-generated summary of the key points:')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {summary ? (
                <p className="text-sm whitespace-pre-wrap">{summary}</p>
            ) : (
                <p className="text-sm text-muted-foreground">{t('summarizeButton.dialogLoadingSummary', 'Loading summary...')}</p>
            )}
          </ScrollArea>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDialogOpen(false)}>{t('summarizeButton.dialogCloseButton', 'Close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    