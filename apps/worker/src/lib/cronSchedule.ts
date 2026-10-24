// One cron trigger for the whole worker (owner decision 24.10.2026): the account is at the free plan's 5 cron
// triggers, and the freed slot goes to the RELACON lead worker. The hourly trigger ("7 * * * *") runs the daily
// sweeps in the 08 UTC hour instead of the hourly ones; running both in one invocation would put the daily
// fan-out on top of the hourly smoke/email batch within the same subrequest and CPU budget.

/** UTC hour in which the hourly trigger runs the daily sweeps (was the separate "22 8 * * *" trigger). */
export const DAILY_SWEEP_UTC_HOUR = 8;

export function isDailySweepHour(scheduledTime: number): boolean {
  return new Date(scheduledTime).getUTCHours() === DAILY_SWEEP_UTC_HOUR;
}
