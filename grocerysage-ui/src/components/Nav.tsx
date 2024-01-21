import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <div className="flex grow items-center text-slate-600 border border-slate-200 px-6 py-3">
      <Link to="/">
      <span className="mr-6 text-2xl">GrocerySage</span>
      </Link>
      <Link to="/">
        <span className="mx-2">Home</span>
      </Link>
    </div>
  );
}