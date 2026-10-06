function AxesdeRecherche() {
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-surface-dim px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-4xl border border-outline bg-white p-10 shadow-sm">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-surface-tint">Axes scientifiques</p>
          <h1 className="text-4xl font-semibold text-on-surface">Axes de recherche</h1>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
            Découvrez les grandes orientations scientifiques du laboratoire et la manière dont chaque axe contribue à l’innovation et à la découverte.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-outline bg-surface-container px-6 py-5">
              <h2 className="text-lg font-semibold text-on-surface">Systèmes intelligents</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Concevoir des algorithmes adaptatifs pour répondre aux défis scientifiques et industriels.</p>
            </div>
            <div className="rounded-3xl border border-outline bg-surface-container px-6 py-5">
              <h2 className="text-lg font-semibold text-on-surface">Recherche sur les matériaux</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Explorer des matériaux avancés pour les technologies de demain.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AxesdeRecherche;