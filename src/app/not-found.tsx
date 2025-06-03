import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center px-4">
      <FileQuestion className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-4xl font-bold font-headline mb-3">Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Oops! The page you&apos;re looking for doesn&apos;t seem to exist.
      </p>
      <Link href="/" passHref>
        <Button size="lg">Return Home</Button>
      </Link>
    </div>
  )
}
