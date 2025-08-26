interface HeaderProps {
  activityName?: string;
}

export function Header({ activityName }: HeaderProps) {
  return (
    <div className="border-b border-border px-4 py-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-sm font-semibold">Trace</h1>
        </div>
        <div className="text-xs text-muted-foreground">
          {activityName || ''}
        </div>
      </div>
    </div>
  );
}
