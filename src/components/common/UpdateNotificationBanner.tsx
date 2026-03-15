import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const UpdateNotificationBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(
          () => {
            void registration.update();
          },
          60 * 60 * 1000
        );
      }
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <span className="update-banner__message">A new version of Codex Arcanum is available.</span>
      <div className="update-banner__actions">
        <button
          type="button"
          className="button button--small"
          onClick={() => void updateServiceWorker(true)}
        >
          Update
        </button>
        <button
          type="button"
          className="button button--ghost button--small"
          onClick={() => setDismissed(true)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
