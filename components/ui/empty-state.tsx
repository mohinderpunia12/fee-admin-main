import { FileQuestion, Search, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: "no-data" | "no-results" | "error";
}

export function EmptyState({
  title,
  description,
  action,
  type = "no-data",
}: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case "no-results":
        return <Search className="h-12 w-12 text-muted-foreground" />;
      case "error":
        return <FileQuestion className="h-12 w-12 text-muted-foreground" />;
      default:
        return <Inbox className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case "no-results":
        return "No results found";
      case "error":
        return "Something went wrong";
      default:
        return "No data available";
    }
  };

  const getDefaultDescription = () => {
    switch (type) {
      case "no-results":
        return "Try adjusting your search or filters";
      case "error":
        return "Please try again later";
      default:
        return "Get started by creating a new item";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4">{getIcon()}</div>
      <h3 className="text-lg font-semibold mb-2">
        {title || getDefaultTitle()}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
        {description || getDefaultDescription()}
      </p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
