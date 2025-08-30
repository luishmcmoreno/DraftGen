export const formatDate = (d: string | number | Date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));
