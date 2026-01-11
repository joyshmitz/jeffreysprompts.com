import Link from "next/link";
import { FileQuestion, Home, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <FileQuestion className="h-20 w-20 mx-auto text-muted-foreground/60" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Page not found
        </h1>

        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/?focus=search" className="gap-2">
              <Search className="h-4 w-4" />
              Search prompts
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            Looking for something specific?
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Link
              href="/"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <Home className="h-3 w-3" />
              Browse prompts
            </Link>
            <Link
              href="/workflows"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <HelpCircle className="h-3 w-3" />
              Workflows
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
