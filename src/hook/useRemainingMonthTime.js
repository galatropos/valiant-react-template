// src/hooks/useRemainingMonthTime.js
import { useEffect, useState } from 'react';

const getRemainingMonthTime = () => {
  const now = new Date();

  const nextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );

  const diff = Math.max(0, nextMonth.getTime() - now.getTime());

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
};

const useRemainingMonthTime = () => {
  const [time, setTime] = useState(getRemainingMonthTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getRemainingMonthTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return time;
};

export default useRemainingMonthTime;