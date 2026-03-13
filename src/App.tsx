import { Bot, Shield, Swords, Factory } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12 border-b border-zinc-800 pb-6">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <Bot className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Telegram Bot Dashboard</h1>
            <p className="text-zinc-400 mt-1">Status: Online and listening for commands</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold">Clans</h2>
            </div>
            <p className="text-zinc-400 text-sm">
              Manage clans, members, and roles. Use /создать клан or /вступить in Telegram.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Swords className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-semibold">Warfare</h2>
            </div>
            <p className="text-zinc-400 text-sm">
              Declare wars, attack enemies, and launch rockets. Use /объявить войну or /атака.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Factory className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold">Economy</h2>
            </div>
            <p className="text-zinc-400 text-sm">
              Build factories, produce goods, and trade. Use /строй завод or /работа.
            </p>
          </div>
        </div>

        <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
              <div>
                <p className="font-medium text-zinc-200">Firebase Private Key</p>
                <p className="text-sm text-zinc-500">Required for database access</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                Configured
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800/50">
              <div>
                <p className="font-medium text-zinc-200">Telegram Bot Token</p>
                <p className="text-sm text-zinc-500">Required for Telegram API</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium">
                Configured
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
