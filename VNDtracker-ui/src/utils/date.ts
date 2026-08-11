import dayjs from 'dayjs';

/** Local-time "YYYY-MM-DD" — never use new Date().toISOString() for dates. */
export const localToday = (): string => dayjs().format('YYYY-MM-DD');

/** Local-time "YYYY-MM" */
export const localCurrentMonth = (): string => dayjs().format('YYYY-MM');
