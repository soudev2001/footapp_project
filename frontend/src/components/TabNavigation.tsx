import clsx from 'clsx'

interface TabItem {
  id: string
  label: string
  icon?: string
}

interface TabNavigationProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabNavigationProps) {
  return (
    <div
      className={clsx(
        'flex border-b border-gray-700 bg-gray-900/50 rounded-t-lg overflow-x-auto',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'px-4 py-3 whitespace-nowrap font-medium transition-colors border-b-2 flex items-center gap-2',
            activeTab === tab.id
              ? 'border-green-500 text-green-400 bg-gray-800/50'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
          )}
        >
          {tab.icon && <span className="text-lg">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
