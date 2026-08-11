// src/features/platform/PlannedModule.tsx
// Honest "module on the roadmap" surface for routes whose backend capability
// is not_implemented or planned. It always renders an EmptyState — never a
// placeholder that fakes a feature. Page-level copy is sourced from the real
// capability note in capabilities.ts.

import React from 'react';
import { EmptyState } from '../../components/design-system';
import { CapabilityKey, getCapability } from '../../lib/capabilities';
import { useI18n } from '../../lib/i18n';

export const PlannedModule: React.FC<{
  capability: CapabilityKey;
  title?: string;
  description?: string;
  icon?: string;
}> = ({ capability, title, description, icon = 'hourglass_empty' }) => {
  const { t } = useI18n();
  const entry = getCapability(capability);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-[28px] md:text-[32px] font-semibold tracking-tight text-on-surface leading-[1.3] mb-1">
          {title ?? entry.note}
        </h2>
        <p className="text-on-surface-variant text-[16px] font-body">
          {t('common.plannedRoadmap')}
        </p>
      </div>

      <EmptyState
        icon={icon}
        title={description ?? entry.note}
        description={
          entry.status === 'planned'
            ? 'This module is sequenced later in the roadmap, after the wedge proves out with paying customers.'
            : 'The backend for this module is not shipped yet. The page has been wired to the target architecture so it lights up the moment the capability ships.'
        }
      />
    </div>
  );
};