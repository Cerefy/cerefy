import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from './design-system';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest p-6">
      <ErrorState
        variant="404"
        message="The route you opened does not exist in the workspace."
        action={<button onClick={() => navigate('/workspace/dashboard')} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-on-surface text-surface px-4 py-2 text-sm font-medium hover:bg-inverse-surface transition-colors">Go to Dashboard</button>}
      />
    </div>
  );
};

export default NotFound;