import { useState } from "react";
import dayjs from "dayjs";
import "../assets/css/Calendar.css";

export default function Calendar() {
  //statefuntion
  const [currentDate, setCurrentDate] = useState(dayjs());

  //set day in than month
  const daysInMonth: number = currentDate.daysInMonth();

  //set than the firestday is the date one ,what day is it on
  const firestDayOfMonth: number = currentDate.startOf("month").day();

  //set empty value from the beginning of the month
  const emptyfirstDays: Array<null> = Array(firestDayOfMonth).fill(null);

  //set empty value form the end of the month
  const emtyLastDays: Array<null> = Array(
    6 - currentDate.endOf("month").day(),
  ).fill(null);

  //set the day of the month as an array
  const days: Array<number> = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1,
  );
const isCurrentMonth = currentDate.isSame(dayjs(), "month");
const todayDate = dayjs().date();

console.log(isCurrentMonth,todayDate);
  //set the month name
  const MonthName = currentDate.format("MMMM");
 

  //set next month
  function nextMonth() {
    const nextMonthDate = currentDate.add(1, "month");
    setCurrentDate(nextMonthDate);
  }

  //set prav month
  function prevMonth() {
    const prevMonthData = currentDate.subtract(1, "month");
    setCurrentDate(prevMonthData);
  }

  return (
    <>
      <section>
        <button onClick={() => console.log(currentDate)}>test</button>
        <button onClick={nextMonth}>nexttest</button>
        <button onClick={prevMonth}>pervtest</button>
        <div>{MonthName}</div>
        <div className="calendar">
          {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
          {emptyfirstDays.map((_, index) => (
            <div key={index} />
          ))}

          {days.map((day) => (
            <div key={day}style={isCurrentMonth && day === todayDate? { backgroundColor: "lightblue" }: {}}>
              {day}
            </div>
          ))}
          {emtyLastDays.map((_, index) => (
            <div key={index} />
          ))}
        </div>
      </section>
    </>
  );
}
