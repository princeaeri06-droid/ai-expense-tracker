export const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-800 bg-slate-900/40 p-6 ${className}`.trim()}>
    {children}
  </div>
)

export const CardHeader = ({ children }) => (
  <div className="space-y-1 border-b border-slate-800 pb-4">{children}</div>
)

export const CardTitle = ({ children }) => <h3 className="text-xl font-semibold">{children}</h3>

export const CardDescription = ({ children }) => (
  <p className="text-sm text-slate-400">{children}</p>
)

export const CardContent = ({ children, className = '' }) => (
  <div className={`pt-4 ${className}`.trim()}>{children}</div>
)






