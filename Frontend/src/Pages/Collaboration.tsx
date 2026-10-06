function Collaboration() {
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-surface-dim px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-4xl border border-outline bg-white p-10 shadow-sm">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-surface-tint">Collaboration</p>
          <h1 className="text-4xl font-semibold text-on-surface">Collaboration</h1>
          <p className="max-w-2xl text-sm leading-7 text-on-surface-variant">
            Coordonnez vos efforts de recherche, échangez avec vos pairs et découvrez des opportunités communes depuis un espace unifié.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-outline bg-surface-container px-6 py-5">
              <h2 className="text-lg font-semibold text-on-surface">Équipes de recherche</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Découvrez les projets actifs et les membres prêts à collaborer.</p>
            </div>
            <div className="rounded-3xl border border-outline bg-surface-container px-6 py-5">
              <h2 className="text-lg font-semibold text-on-surface">Ressources partagées</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Accédez aux outils collaboratifs, aux documents et aux espaces de discussion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Collaboration;