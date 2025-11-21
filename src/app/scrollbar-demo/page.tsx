'use client'

/**
 * Scrollbar Demo Page
 *
 * Página de demonstração das variantes de scrollbar customizadas.
 * Acesse via: http://localhost:3000/scrollbar-demo
 *
 * Esta página pode ser removida em produção.
 */

export default function ScrollbarDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Scrollbar Customizada
          </h1>
          <p className="text-slate-400 text-lg">
            Demonstração das diferentes variantes de scrollbar
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm text-slate-300">Sistema adaptável ao tema claro/escuro</span>
          </div>
        </header>

        {/* Grid de demonstrações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Scrollbar Padrão */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">Scrollbar Padrão</h2>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 text-xs rounded-full border border-sky-500/30">
                Global
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Aplicada automaticamente em toda a aplicação. Largura: 12px
            </p>
            <div className="h-64 overflow-y-auto bg-slate-950/50 rounded-xl p-4 border border-slate-800">
              <div className="space-y-3">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-400 flex items-center justify-center text-white font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-200 font-medium">Item #{i + 1}</p>
                        <p className="text-xs text-slate-500">Exemplo de conteúdo rolável</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <code className="block text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {`<div className="overflow-y-auto h-64">`}
            </code>
          </div>

          {/* Scrollbar Overlay */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">Scrollbar Overlay</h2>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
                Modal
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Para modais e dropdowns. Transparente e discreta. Largura: 8px
            </p>
            <div className="scrollbar-overlay h-64 overflow-y-auto bg-slate-950/50 rounded-xl p-4 border border-slate-800">
              <div className="space-y-4">
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-sky-500/50 transition-colors"
                  >
                    <h3 className="text-slate-200 font-medium mb-2">Jogador #{i + 1}</h3>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-sky-500/20 text-sky-400 rounded">
                        Atacante
                      </span>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                        R$ {(Math.random() * 1000000).toFixed(0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <code className="block text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {`<div className="scrollbar-overlay overflow-y-auto">`}
            </code>
          </div>

          {/* Scrollbar Thin */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">Scrollbar Thin</h2>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                Compact
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Versão mais fina para espaços compactos. Largura: 6px
            </p>
            <div className="scrollbar-thin h-64 overflow-y-auto bg-slate-950/50 rounded-xl p-4 border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-3 text-slate-400 font-medium">Time</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Jogadores</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Budget</th>
                    <th className="text-left p-3 text-slate-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 20 }, (_, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-3 text-slate-200">Time {i + 1}</td>
                      <td className="p-3 text-slate-300">{Math.floor(Math.random() * 15)}</td>
                      <td className="p-3 text-emerald-400">R$ {(Math.random() * 10000000).toFixed(0)}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-sky-500/20 text-sky-400 text-xs rounded">
                          Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <code className="block text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {`<div className="scrollbar-thin overflow-y-auto">`}
            </code>
          </div>

          {/* Scrollbar None */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">Scrollbar None</h2>
              <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-xs rounded-full border border-rose-500/30">
                Hidden
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Scrollbar invisível. Útil para carrosséis e galerias.
            </p>
            <div className="scrollbar-none h-64 overflow-y-auto bg-slate-950/50 rounded-xl p-4 border border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-gradient-to-br from-sky-500/20 to-emerald-500/20 border border-slate-700 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">🏆</div>
                      <p className="text-slate-300 text-sm font-medium">Card {i + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <code className="block text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {`<div className="scrollbar-none overflow-y-auto">`}
            </code>
          </div>

          {/* Scroll Horizontal */}
          <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">Scroll Horizontal</h2>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                Horizontal
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Scrollbar horizontal com altura reduzida: 10px
            </p>
            <div className="overflow-x-auto bg-slate-950/50 rounded-xl p-4 border border-slate-800">
              <div className="flex gap-4 pb-2" style={{ width: '2000px' }}>
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-64 p-4 bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl border border-slate-700"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-emerald-400"></div>
                      <div>
                        <p className="text-slate-200 font-medium">Item {i + 1}</p>
                        <p className="text-xs text-slate-500">Scroll horizontal</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">
                      Conteúdo do card que demonstra o scroll horizontal
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <code className="block text-xs text-emerald-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {`<div className="overflow-x-auto">`}
            </code>
          </div>

        </div>

        {/* Info de Estados */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-slate-100">Estados Interativos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <div className="text-3xl mb-2">👆</div>
              <h3 className="text-slate-200 font-medium mb-1">Normal</h3>
              <p className="text-sm text-slate-400">Estado padrão com cor base</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <div className="text-3xl mb-2">🖱️</div>
              <h3 className="text-slate-200 font-medium mb-1">Hover</h3>
              <p className="text-sm text-slate-400">Cor mais clara ao passar o mouse</p>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <div className="text-3xl mb-2">✊</div>
              <h3 className="text-slate-200 font-medium mb-1">Active</h3>
              <p className="text-sm text-slate-400">Destaque em sky-500 ao arrastar</p>
            </div>
          </div>
        </div>

        {/* Info Adicional */}
        <div className="text-center space-y-3">
          <p className="text-slate-500 text-sm">
            📚 Consulte o <a href="/SCROLLBAR_GUIDE.md" className="text-sky-400 hover:text-sky-300 underline">SCROLLBAR_GUIDE.md</a> para documentação completa
          </p>
          <p className="text-slate-600 text-xs">
            Esta página é apenas para demonstração e pode ser removida em produção
          </p>
        </div>

      </div>
    </div>
  )
}
