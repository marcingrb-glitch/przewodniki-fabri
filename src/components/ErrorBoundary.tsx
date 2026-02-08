import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="text-center max-w-md space-y-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">Coś poszło nie tak</h1>
            <p className="text-muted-foreground">
              Przepraszamy za kłopot. Aplikacja napotkała nieoczekiwany błąd.
            </p>
            {this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded-md overflow-auto max-h-32 text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={() => (window.location.href = "/")}>
              Wróć do strony głównej
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
