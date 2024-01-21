import SearchBar from '../components/SearchBar';
import Card from '../components/Card';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface Item {
  name: string,
  retailer: string,
  price_history: object,
  imgName: string,
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    let { data } = await supabase
      .from("items")
      .select("name, retailer, price_history, imgName")
      .limit(18);
    setItems(data || []);
  }
  return (
    <div>
      <div className="flex justify-center m-4">
        <SearchBar />
      </div>
      <div className="flex justify-center m-4">
        <div className="grid 2xl:grid-cols-7 xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card key={item.name} data={item} />
          ))}
        </div>
      </div>
    </div>

  );
}