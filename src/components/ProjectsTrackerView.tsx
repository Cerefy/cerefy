import React from 'react';
import { Calendar, CheckCircle2, DollarSign, FolderKanban, UserCheck } from 'lucide-react';
import { useProjects } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';
import { useI18n } from '../lib/i18n';

function formatDueDate(value: string | undefined, locale: 'en' | 'ar', fallback: string): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'medium' }).format(date);
}

/**
 * Read-only project directory backed exclusively by GET /api/v1/projects.
 * Project creation remains unavailable on this route until an authorized,
 * API-backed workflow is exposed in the workspace.
 */
export const ProjectsTrackerView: React.FC = () => {
  const { data: projects = [], isLoading, isError, error, refetch } = useProjects();
  const { locale, t } = useI18n();

  if (isLoading) {
    return <LoadingState label={t('common.loading')} rows={3} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t('projects.errorTitle')}
        message={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
        variant="backend-unavailable"
      />
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="projects-heading">
      <header className="bento-card rounded-xl p-6 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
            <FolderKanban className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 id="projects-heading" className="font-headline text-xl font-semibold text-on-surface">
              {t('projects.title')}
            </h1>
            <p className="text-sm text-on-surface-variant font-body">{t('projects.description')}</p>
          </div>
        </div>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon="folder_off"
          title={t('projects.emptyTitle')}
          description={t('projects.emptyDescription')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <article key={project.id} className="bento-card rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                    {t('projects.code')}: {project.code || '—'}
                  </p>
                  <h2 className="font-headline text-base font-semibold text-on-surface">
                    {project.title || project.name}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-xs font-label text-on-surface-variant">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {project.status || '—'}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <dt className="font-label text-xs">{t('projects.department')}</dt>
                    <dd className="font-body text-on-surface">{project.department || '—'}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <DollarSign className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <dt className="font-label text-xs">{t('projects.progress')}</dt>
                    <dd className="font-body text-on-surface">{new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(project.progress)}%</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant sm:col-span-2">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <div>
                    <dt className="font-label text-xs">{t('projects.dueDate')}</dt>
                    <dd className="font-body text-on-surface">
                      {formatDueDate(project.dueDate, locale, t('projects.notScheduled'))}
                    </dd>
                  </div>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProjectsTrackerView;
