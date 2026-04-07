import { wealthManagementData } from '../data/wealthManagement';
import { getUpcomingTimelineItems } from './DashboardPage';

test('generates forward-looking business-day dates for the upcoming timeline', () => {
  const baseDate = new Date(2026, 3, 7, 12, 0, 0, 0);
  const sourceItems = (wealthManagementData.activityTimeline ?? []).slice(0, 6);

  const timelineItems = getUpcomingTimelineItems(sourceItems, baseDate);

  expect(timelineItems.map((item) => item.date.slice(0, 10))).toEqual([
    '2026-04-08',
    '2026-04-09',
    '2026-04-10',
    '2026-04-13',
    '2026-04-14',
    '2026-04-15',
  ]);
  expect(timelineItems.map((item) => item.description)).toEqual(sourceItems.map((item) => item.description));
});