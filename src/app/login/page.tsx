import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <form className="relative z-10 w-full max-w-sm flex flex-col gap-6 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col gap-2 text-center mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Client Portal</h1>
          <p className="text-sm text-white/50">
            Sign in to access your project dashboard.
          </p>
        </div>

        {resolvedParams?.error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            Invalid email or password
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/70" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="client@company.com"
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all placeholder:text-white/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium text-white/70"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white/30 focus:ring-1 focus:ring-white/30 outline-none transition-all"
            />
          </div>
        </div>

        <button
          formAction={login}
          className="mt-2 w-full px-4 py-3 text-sm font-semibold bg-white text-black rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
