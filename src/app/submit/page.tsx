
'use client';
import { CreateThreadForm } from '@/components/thread/CreateThreadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

export default function SubmitPage() {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{t('submitPage.title', 'Create a new post')}</CardTitle>
          <CardDescription>{t('submitPage.description', 'Share your thoughts with the ForumVerse community.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateThreadForm />
        </CardContent>
      </Card>
    </div>
  );
}

    