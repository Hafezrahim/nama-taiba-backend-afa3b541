import { usePageView } from '@/hooks/usePageView';

/** Invisible tracker that records visits to public pages. */
const PageViewTracker = () => {
  usePageView();
  return null;
};

export default PageViewTracker;
