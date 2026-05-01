// dynamicDate.js

const months = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  es: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  pt: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
};

const weekDays = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  pt: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
};

const getLanguage = (language = 'en') => {
  return months[language] ? language : 'en';
};

const formatMonthDay = (date, language = 'en') => {
  const lang = getLanguage(language);
  return `${months[lang][date.getMonth()]} ${date.getDate()}`;
};

const customDayToJsDay = (day) => {
  return (day + 1) % 7;
};

export const getNextMondayDate = () => {
  const d = new Date();
  const currentDay = d.getDay();

  let daysUntilMonday = (8 - currentDay) % 7;
  if (daysUntilMonday === 0) {
    daysUntilMonday = 7;
  }

  const currentMonday = new Date(d);
  currentMonday.setDate(d.getDate() + daysUntilMonday);

  const time1Date = new Date(currentMonday);
  time1Date.setDate(currentMonday.getDate() + 7);

  const time2Date = new Date(currentMonday);
  time2Date.setDate(currentMonday.getDate() + 14);

  const time3Date = new Date(currentMonday);
  time3Date.setDate(currentMonday.getDate() + 21);

  return {
    current: `On Monday ${formatMonthDay(currentMonday)}`,
    time1: formatMonthDay(time1Date),
    time2: formatMonthDay(time2Date),
    time3: formatMonthDay(time3Date),
  };
};

export const getTomorrowDate = () => {
  const d = new Date();

  const tomorrow = new Date(d);
  tomorrow.setDate(d.getDate() + 1);

  const time1Date = new Date(tomorrow);
  time1Date.setDate(tomorrow.getDate() + 7);

  const time2Date = new Date(tomorrow);
  time2Date.setDate(tomorrow.getDate() + 14);

  const time3Date = new Date(tomorrow);
  time3Date.setDate(tomorrow.getDate() + 21);

  return {
    current: `Tomorrow ${formatMonthDay(tomorrow)}`,
    time1: formatMonthDay(time1Date),
    time2: formatMonthDay(time2Date),
    time3: formatMonthDay(time3Date),
  };
};

export const getNextDayDate = ({ day = 0, weeks = 1, language = 'en' } = {}) => {
  const lang = getLanguage(language);
  const d = new Date();

  const targetDay = customDayToJsDay(day);
  const currentDay = d.getDay();

  let daysUntilTarget = (targetDay - currentDay + 7) % 7;

  if (daysUntilTarget === 0) {
    daysUntilTarget = 7;
  }

  daysUntilTarget += (weeks - 1) * 7;

  const targetDate = new Date(d);
  targetDate.setDate(d.getDate() + daysUntilTarget);

  return {
    current: formatMonthDay(targetDate, lang),
    days: targetDate.getDate(),
    week: weekDays[lang][day],
    month: months[lang][targetDate.getMonth()],
  };
};