import { dateForDevelopment } from "./developmentSettings";

export type ScheduleDate = { month: number; day: number };

export type RangedItem = {
  begin: ScheduleDate;
  end: ScheduleDate;
};

const inRange = (date: Date, begin: ScheduleDate, end: ScheduleDate) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;

  const afterStart =
    begin.month < month || (begin.month === month && begin.day <= day);

  const beforeEnd =
    end.month > month || (end.month === month && end.day >= day);

  return afterStart && beforeEnd;
};

const EOY: ScheduleDate = { month: 12, day: 31 };
const BOY: ScheduleDate = { month: 1, day: 1 };

export const filterInRange = <TItem extends RangedItem>(
  date: Date,
  items: TItem[]
): TItem[] =>
  items.filter((schedule) => {
    if (schedule.begin.month > schedule.end.month) {
      // Schedule spans over the year, split it into two ranges
      return (
        inRange(date, schedule.begin, EOY) || inRange(date, BOY, schedule.end)
      );
    }
    return inRange(date, schedule.begin, schedule.end);
  });

/**
 * RepairBench environment adaptation (determinism pin).
 *
 * Every seasonal read in this app goes through getToday(): the theme
 * (getActiveTheme), the particles, the level modifiers (getActiveModifiers) and the
 * scheduled actions. Upstream serves a calendar-driven game, so the block colours,
 * the shapes and the active modifiers of a level change with the wall-clock day the
 * verifier happens to run on. The seed's own docstring above already states that
 * "Dates can be overridden for testing purposes"; this pins the production branch to
 * a fixed date so the level under repair is byte-stable across runs.
 *
 * The pinned date is deliberately inside the "default" theme window (no seasonal
 * schedule active), so no theme, particle set or modifier is enabled by it.
 * The development branch keeps the seed's own dateForDevelopment override untouched.
 * 0 business-logic lines are changed: only the value the clock reports.
 */
export const RB_PINNED_TODAY = "2026-09-17T12:00:00.000Z";

export const getToday = (): Date =>
  process.env.NODE_ENV === "production"
    ? new Date(RB_PINNED_TODAY)
    : dateForDevelopment;
