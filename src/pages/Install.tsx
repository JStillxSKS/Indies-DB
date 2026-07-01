export function Install() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">How to install maps</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3 text-accent">Meta Quest</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted text-sm leading-relaxed">
          <li>Connect your Quest to your PC via USB or use the Quest file browser.</li>
          <li>Download the <code className="text-text bg-surface2 px-1 rounded">.indies</code> file from this site.</li>
          <li>Copy it to:
            <pre className="mt-2 p-4 rounded-lg bg-surface border border-border text-text text-xs overflow-x-auto">
              Internal shared storage / SmashDrums / Indies /
            </pre>
          </li>
          <li>Launch Smash Drums — your map appears in the Indies song list.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-accent">PC (Steam / Rift)</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted text-sm leading-relaxed">
          <li>Download the <code className="text-text bg-surface2 px-1 rounded">.indies</code> file.</li>
          <li>Copy it to your Smash Drums Indies folder, typically:
            <pre className="mt-2 p-4 rounded-lg bg-surface border border-border text-text text-xs overflow-x-auto">
              %USERPROFILE%\Documents\SmashDrums\Indies\
            </pre>
          </li>
          <li>Launch the game and find the map under Indies.</li>
        </ol>
      </section>

      <p className="mt-10 text-sm text-muted">
        Each .indies file contains all difficulties (Easy, Normal, Hard, Extreme) in one package.
      </p>
    </div>
  )
}