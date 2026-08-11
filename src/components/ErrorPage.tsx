import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState, ErrorVariant } from './design-system';

const ErrorPage: React.FC<{ variant: ErrorVariant }> = ({ variant }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-6">
      <ErrorState
        variant={variant}
        action={
          <button
            onClick={() => navigate('/workspace/dashboard')}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-on-surface text-surface px-4 py-2 text-sm font-medium hover:bg-inverse-surface transition-colors"
          >
            Back to Dashboard
          </button>
        }
      />
    </div>
  );
};

export default ErrorPage;