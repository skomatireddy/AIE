import { cn } from '../../lib/cn'

const NAV_GROUPS = [
  {
    group: 'Vision',
    color: 'text-violet-400',
    items: [
      { id: 'depth',    icon: '🌐', label: '2D → 3D Depth' },
      { id: 'img3d',   icon: '🧊', label: '2D → 3D Viewer' },
      { id: 'classify', icon: '🏷️', label: 'Classification' },
      { id: 'detect',   icon: '🔍', label: 'Object Detection' },
      { id: 'segment',  icon: '✂️', label: 'Segmentation' },
      { id: 'caption',  icon: '💬', label: 'Image Caption' },
    ],
  },
  {
    group: 'Language',
    color: 'text-sky-400',
    items: [
      { id: 'sentiment',  icon: '😊', label: 'Sentiment' },
      { id: 'ner',        icon: '🏷', label: 'Entities (NER)' },
      { id: 'summarize',  icon: '📝', label: 'Summarize' },
      { id: 'translate',  icon: '🌍', label: 'Translation' },
      { id: 'qa',         icon: '❓', label: 'Question Answering' },
    ],
  },
  {
    group: 'Audio',
    color: 'text-emerald-400',
    items: [
      { id: 'asr',         icon: '🎙️', label: 'Speech → Text' },
      { id: 'audioclassify', icon: '🔊', label: 'Audio Classification' },
    ],
  },
  {
    group: 'Multimodal',
    color: 'text-amber-400',
    items: [
      { id: 'similarity', icon: '🔗', label: 'Similarity & Search' },
      { id: 'gemma4',     icon: '✨', label: 'Gemma 4 Explorer' },
    ],
  },
]

export function Sidebar({ active, onSelect }) {
  return (
    <nav className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-zinc-800">
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">AI Labs</p>
      </div>
      <div className="flex flex-col gap-0 py-2 flex-1">
        {NAV_GROUPS.map(group => (
          <div key={group.group} className="mb-2">
            <p className={cn('px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest', group.color)}>
              {group.group}
            </p>
            {group.items.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left',
                  active === item.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                )}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          Powered by Transformers.js — all inference runs locally in your browser. No data is sent to any server.
        </p>
      </div>
    </nav>
  )
}
