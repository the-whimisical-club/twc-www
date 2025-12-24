import { requireAuth } from '@/app/utils/auth'
import Navbar from '@/app/components/navbar'
import { ERROR_REGISTRY, getErrorsByCategory } from '@/app/utils/errors'

export default async function ErrorsPage() {
  const { user } = await requireAuth()

  // Group errors by category
  const errorsByCategory = {
    authentication: getErrorsByCategory('authentication'),
    authorization: getErrorsByCategory('authorization'),
    validation: getErrorsByCategory('validation'),
    processing: getErrorsByCategory('processing'),
    request: getErrorsByCategory('request'),
    network: getErrorsByCategory('network'),
    timeout: getErrorsByCategory('timeout'),
    file: getErrorsByCategory('file'),
    database: getErrorsByCategory('database'),
    storage: getErrorsByCategory('storage'),
    server: getErrorsByCategory('server'),
  }

  // Category display names
  const categoryNames: Record<string, string> = {
    authentication: 'Authentication',
    authorization: 'Authorization',
    validation: 'Validation',
    processing: 'Processing',
    request: 'Request',
    network: 'Network',
    timeout: 'Timeout',
    file: 'File',
    database: 'Database',
    storage: 'Storage',
    server: 'Server',
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex justify-center align-middle text-4xl md:text-8xl text-foreground font-dark-london px-8 py-16 md:p-20 md:py-40">errors</div>
      
      <div className="flex flex-col text-lg md:text-xl p-8 md:p-25 gap-8 text-foreground font-stack-sans-notch">
        <p>if you're seeing an error code, look it up below to understand what went wrong.</p>
        
        <div className="flex flex-col gap-12 mt-8">
          {/* Dynamically render errors by category */}
          {Object.entries(errorsByCategory).map(([category, errors]) => {
            if (errors.length === 0) return null
            
            return (
              <section key={category}>
                <h2 className="text-2xl md:text-3xl font-stack-sans-notch mb-4 font-bold">
                  {categoryNames[category]} Errors
                </h2>
                <div className="flex flex-col gap-6">
                  {errors.map((errorDef) => (
                    <div key={errorDef.code}>
                      <h3 className="text-xl font-stack-sans-notch font-semibold">
                        {errorDef.code} - {errorDef.name}
                      </h3>
                      <p className="text-base opacity-90">{errorDef.message}</p>
                      {errorDef.troubleshooting.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold opacity-80 mb-1">Troubleshooting:</p>
                          <ul className="text-sm opacity-70 list-disc list-inside">
                            {errorDef.troubleshooting.map((step, idx) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}

