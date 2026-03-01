export default function StatCard({ icon: Icon, label, value, color, sub }) {
  const colors = {
    blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-600',    text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600', text: 'text-emerald-700' },
    violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-600',  text: 'text-violet-700' },
    amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-700' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 ${c.icon} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}
