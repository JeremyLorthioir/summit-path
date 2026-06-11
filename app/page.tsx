export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <h1 className="text-display-metrics text-primary font-bold mb-4">Summit Path</h1>
      <p className="text-body-lg text-on-surface-variant mb-8">
        Connectez-vous pour commencer
      </p>
      <a
        href="/login"
        className="px-8 py-4 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container text-body-md"
      >
        Vers la connexion
      </a>
    </main>
  );
}
