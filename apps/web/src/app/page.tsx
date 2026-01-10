import { prompts } from "@jeffreysprompts/core/prompts";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">JeffreysPrompts.com</h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          Curated prompts for agentic coding.
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex flex-col border rounded-lg p-6 hover:shadow-lg transition-shadow dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 uppercase tracking-wider">
                {prompt.category}
              </span>
              {prompt.featured && (
                <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
                  Featured
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">{prompt.title}</h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">
              {prompt.description}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {prompt.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {prompt.tags.length > 3 && (
                <span className="text-xs text-zinc-400 px-1 py-1">+{prompt.tags.length - 3}</span>
              )}
            </div>

            <div className="mt-auto pt-4 border-t dark:border-zinc-800">
               <div className="text-xs font-mono bg-zinc-100 dark:bg-black p-3 rounded overflow-hidden h-24 relative group cursor-pointer">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-100 dark:to-black opacity-50 group-hover:opacity-20 transition-opacity" />
                 <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                   {prompt.content}
                 </p>
               </div>
               <div className="mt-2 flex justify-end">
                 <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                   View Prompt &rarr;
                 </button>
               </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="mt-20 text-center text-sm text-zinc-500 pb-8">
        <p>Use the CLI: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">jfp install {`{prompt-id}`}</code></p>
      </footer>
    </div>
  );
}
