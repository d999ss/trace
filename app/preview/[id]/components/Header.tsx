interface HeaderProps {
  activityName?: string;
}

export function Header({ activityName }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Trace Prints</h1>
        </div>
        <div className="text-sm text-gray-500">
          {activityName || 'Loading activity...'}
        </div>
      </div>
    </div>
  );
}
