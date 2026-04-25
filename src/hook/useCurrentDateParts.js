// src/hook/useCurrentDateParts.js
import { useEffect, useState } from "react";

const DATE_TRANSLATIONS = {
  en: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    days: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  },

  es: {
    months: [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ],
    days: [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ],
  },

  pt: {
    months: [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ],
    days: [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ],
  },
};

const getNowParts = ({ daysForward = 0, language = "en" } = {}) => {
  const lang = DATE_TRANSLATIONS[language] ? language : "en";

  const now = new Date();
  const targetDate = new Date(now);

  targetDate.setDate(targetDate.getDate() + daysForward);

  return {
    date: targetDate,
    year: targetDate.getFullYear(),

    monthNumber: targetDate.getMonth() + 1,
    monthText: DATE_TRANSLATIONS[lang].months[targetDate.getMonth()],

    dayNumber: targetDate.getDate(),
    dayText: DATE_TRANSLATIONS[lang].days[targetDate.getDay()],
    dayWeekNumber: targetDate.getDay(),

    hour: targetDate.getHours(),
    minute: targetDate.getMinutes(),
    second: targetDate.getSeconds(),
  };
};

const useCurrentDateParts = ({ daysForward = 0, language = "en" } = {}) => {
  const [time, setTime] = useState(
    getNowParts({
      daysForward,
      language,
    })
  );

  useEffect(() => {
    const update = () => {
      setTime(
        getNowParts({
          daysForward,
          language,
        })
      );
    };

    update();

    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [daysForward, language]);

  return time;
};

export default useCurrentDateParts;