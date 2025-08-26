interface HeaderProps {
  activityName?: string;
}

export function Header({ activityName }: HeaderProps) {
  return (
    <div className="border-b border-gray-100 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-sm font-medium text-gray-700">Trace</h1>
        </div>
        <div className="text-xs text-gray-400">
          {activityName || ''}
        </div>
      </div>
    </div>
  );
}
