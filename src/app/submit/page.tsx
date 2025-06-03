import { CreateThreadForm } from '@/components/thread/CreateThreadForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create a new post</CardTitle>
          <CardDescription>Share your thoughts with the ForumVerse community.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateThreadForm />
        </CardContent>
      </Card>
    </div>
  );
}
