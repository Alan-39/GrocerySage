import { useEffect, useState } from "react";
import { ENV_VARIABLES } from "../env";

export default function Card(props: any) {
  const [price, setPrice] = useState<number>();

  useEffect(() => {
    setPrice(getLatestPrice());
  }, []);

  const getLatestPrice = () => {
    const dates = Object.keys(props.data.price_history);
    
    const datesArray = dates.map((date) => {
      const newDate = date.split('/')
      return new Date(parseInt(newDate[2]), parseInt(newDate[1]) - 1, parseInt(newDate[0])).getTime()
    });
    
    let latestDate = new Date(Math.max(...datesArray)).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return props.data.price_history[latestDate];
  }

  const getLastChange = () => {};
  const getPercentChange = () => {};

  return (
    <div className=" p-1 w-48">
      <div className="flex flex-col">
      <img className="drop-shadow" src={`${ENV_VARIABLES.CLOUDINARY_ENDPOINT}${props.data.imgName}.jpg`} alt="placeholder" />
        <div></div>
        <div className="flex justify-between">
          <span className="text-lg text-slate-600">S${price}</span>
          <div className="flex flex-col">
            <span className="text-sm text-slate-600">% change</span>
            <span className="text-xs text-slate-400">n days ago</span>
          </div>
        </div>
        <span className="mt-4 text-base truncate text-slate-600">{props.data.name}</span>
      </div>
    </div>
  );
}