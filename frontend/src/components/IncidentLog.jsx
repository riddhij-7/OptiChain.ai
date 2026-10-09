export default function IncidentLog({ incidents }) {
  const recent = incidents.slice(0, 3);
  if (!recent.length) return <div className="text-xs text-gray-500 mt-2">No incidents</div>;

  return (
    <div className="mt-4">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">
        Recent Incidents
      </div>
      <div className="flex flex-col gap-2">
        {recent.map((inc) => (
          <div key={inc.id} className="bg-gray-950/50 border border-gray-800/80 rounded-lg p-2 text-xs hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-gray-500">{inc.id}</span>
              {inc.vendor_fault && <span className="bg-rose-500/10 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20">FAULT</span>}
              <span className="ml-auto text-rose-400 font-bold">+{inc.delay_hours}h</span>
            </div>
            <div className="text-[10px] text-gray-400 truncate">{inc.leg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
