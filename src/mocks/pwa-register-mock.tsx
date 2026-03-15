export const useRegisterSW = () => ({
  needRefresh: [true, () => {}] as [boolean, (v: boolean) => void],
  offlineReady: [false, () => {}] as [boolean, (v: boolean) => void],
  updateServiceWorker: async (_reloadPage?: boolean) => {},
});
