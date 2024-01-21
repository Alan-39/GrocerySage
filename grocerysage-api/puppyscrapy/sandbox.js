const dates = ["01/01/2024", "02/01/2024", "03/01/2024", "04/01/2024", "06/01/2024", "08/01/2024", "29/12/2023", "30/12/2023"]



const datesArray = dates.map((date) => {
  const newDate = date.split('/')
  return new Date(parseInt(newDate[2]), parseInt(newDate[1]) - 1, parseInt(newDate[0]))
});

let latestDate = new Date(Math.max(...datesArray)).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

console.log(latestDate);