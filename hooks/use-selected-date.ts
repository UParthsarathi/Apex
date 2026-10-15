import { useEffect, useRef, useState } from 'react';
import { isSameDay, startOfToday } from 'date-fns';

// The selected day starts as today. A phone can keep the app open overnight; when it becomes
// visible again on a new day, a user who was still on "today" moves to the new today.
export function useSelectedDate() {
  const [selectedDate, setSelectedDate] = useState(startOfToday);
  const today = useRef(selectedDate);

  useEffect(() => {
    const onVisible = () => {
      const now = startOfToday();
      if (document.visibilityState !== 'visible' || isSameDay(now, today.current)) return;
      const previous = today.current;
      today.current = now;
      setSelectedDate(prev => (isSameDay(prev, previous) ? now : prev));
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  return [selectedDate, setSelectedDate] as const;
}
