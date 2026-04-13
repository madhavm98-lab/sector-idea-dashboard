import { IdeaView } from "@/types/idea";

export function IdeaCard({ idea }: { idea: IdeaView }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{idea.sector}</p>
          <h2 className="text-lg font-semibold text-white">{idea.title}</h2>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          {idea.sentiment}
        </span>
      </div>

      <p className="mb-3 text-sm text-slate-300">{idea.summary}</p>
      <p className="mb-4 text-sm text-slate-400">{idea.thesis}</p>

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-300">
        <span className="rounded-full bg-slate-800 px-2 py-1">{idea.sourceType}</span>
        <span className="rounded-full bg-slate-800 px-2 py-1">{idea.sourceName}</span>
        <span className="rounded-full bg-slate-800 px-2 py-1">confidence {Math.round(idea.confidence * 100)}%</span>
        {idea.tickers.map((ticker) => (
          <span key={ticker} className="rounded-full bg-slate-800 px-2 py-1">${ticker}</span>
        ))}
      </div>

      <a href={idea.sourceUrl} target="_blank" className="text-sm text-cyan-400 hover:text-cyan-300">
        Open source
      </a>
    </article>
  );
}
