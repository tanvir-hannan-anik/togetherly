import { Leaf, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Loading({
  label = "Loading your community…",
}: {
  label?: string;
}) {
  return (
    <div className="feedback" role="status">
      <LoaderCircle size={24} className="animate-spin" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorMessage({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="icon-circle">
        <Leaf size={26} />
      </span>
      <h2>{title}</h2>
      <div className="muted">{children}</div>
    </div>
  );
}
