export const dateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export const monthKey = (value = new Date()) => dateKey(value).slice(0, 7);
