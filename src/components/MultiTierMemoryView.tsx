import React, { FormEvent, useState } from 'react';
import { Database, FileText, Search, Sparkles } from 'lucide-react';
import { useMemoryDocuments, useMemoryQuery } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';
import { useI18n } from '../lib/i18n';

export const MultiTierMemoryView: React.FC = () => {
  const { data: documents = [], isLoading, isError, error, refetch } = useMemoryDocuments();
  const memoryQuery = useMemoryQuery();
  const { locale } = useI18n();
  const [query, setQuery] = useState('');
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setHasSubmittedSearch(true);
    memoryQuery.mutate({ query: trimmed, type: 'hybrid', limit: 8 });
  };

  if (isLoading) return <LoadingState label="Loading memory documents" rows={3} />;

  if (isError) {
    return (
      <ErrorState
        title="Unable to load memory documents"
        message={error instanceof Error ? error.message : undefined}
        variant="backend-unavailable"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="memory-heading">
      <header className="bento-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <Database className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 id="memory-heading" className="font-headline text-xl font-semibold text-on-surface">Enterprise Memory</h1>
            <p className="mt-1 text-sm text-on-surface-variant font-body">
              Search results and document records returned by the memory APIs.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-2">
            <Search className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
            <span className="sr-only">Search enterprise memory</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search enterprise memory"
              className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
            />
          </label>
          <button
            type="submit"
            disabled={!query.trim() || memoryQuery.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {memoryQuery.isPending ? 'Searching…' : 'Search'}
          </button>
        </form>
      </header>

      {memoryQuery.isPending && <LoadingState label="Searching memory" rows={2} />}

      {memoryQuery.isError && (
        <ErrorState
          title="Memory search failed"
          message={memoryQuery.error instanceof Error ? memoryQuery.error.message : undefined}
          variant="backend-unavailable"
        />
      )}

      {hasSubmittedSearch && !memoryQuery.isPending && !memoryQuery.isError && (memoryQuery.data?.length ?? 0) === 0 && (
        <EmptyState
          icon="search_off"
          title="No memory matches"
          description="The memory query completed without returning matching records."
        />
      )}

      {(memoryQuery.data?.length ?? 0) > 0 && (
        <section className="space-y-3" aria-labelledby="memory-results-heading">
          <h2 id="memory-results-heading" className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Memory search results
          </h2>
          <div className="space-y-3">
            {memoryQuery.data?.map((result) => (
              <article key={result.id} className="bento-card rounded-xl p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-label text-primary">
                      <Sparkles className="h-4 w-4" aria-hidden="true" /> {result.source}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface">{result.content}</p>
                  </div>
                  <span className="rounded-full bg-surface-container px-2 py-1 text-xs font-label text-on-surface-variant">
                    {result.type}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3" aria-labelledby="memory-documents-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="memory-documents-heading" className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
            Memory documents
          </h2>
          <span className="rounded-full bg-surface-container px-2 py-1 text-xs font-label text-on-surface-variant">
            {documents.length} returned
          </span>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            icon="description"
            title="No memory documents"
            description="The memory documents API returned no documents for this workspace."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {documents.map((document) => {
              const updatedAt = new Date(document.updatedAt);
              const readableDate = Number.isNaN(updatedAt.getTime())
                ? document.updatedAt
                : new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium' }).format(updatedAt);
              return (
                <article key={document.id} className="bento-card rounded-xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-headline text-base font-semibold text-on-surface">{document.title}</h3>
                      <p className="mt-1 text-xs text-on-surface-variant">{document.source}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{document.summary || '—'}</p>
                  <p className="text-xs text-on-surface-variant">Updated: {readableDate}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
};

export default MultiTierMemoryView;
