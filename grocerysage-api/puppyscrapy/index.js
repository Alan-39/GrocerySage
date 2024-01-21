const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');
const dotenv = require('dotenv');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


const retailers = [
  {
    name: "Fairprice",
    src: "https://www.fairprice.com.sg",
    hits: [
      { category: "rice", target: "https://www.fairprice.com.sg/category/rice" },
      { category: "bread", target: "https://www.fairprice.com.sg/category/breads--1" },
      { category: "eggs", target: "https://www.fairprice.com.sg/category/eggs" },
      { category: "milk", target: "https://www.fairprice.com.sg/category/fresh-milk--1" },
      { category: "soft drinks", target: "https://www.fairprice.com.sg/category/carbonated" },
      { category: "chocolate malt", target: "https://www.fairprice.com.sg/category/chocolate-malted" },
      { category: "asian drinks", target: "https://www.fairprice.com.sg/category/asian-drinks" },
      { category: "frozen seafood", target: "https://www.fairprice.com.sg/category/frozen-seafood" },
      { category: "pasta", target: "https://www.fairprice.com.sg/category/pasta--1" },
      { category: "noodles", target: "https://www.fairprice.com.sg/category/noodles--1" },
      { category: "oil", target: "https://www.fairprice.com.sg/category/oil" },
      { category: "paper & tissue", target: "https://www.fairprice.com.sg/category/paper-tissue" },
      { category: "instant cup noodles", target: "https://www.fairprice.com.sg/category/instant-cups" },
      { category: "instant noodles", target: "https://www.fairprice.com.sg/category/instant-noodles" },
      { category: "dumplings", target: "https://www.fairprice.com.sg/category/dumplings-gyoza" },
      { category: "chicken delights", target: "https://www.fairprice.com.sg/category/chicken-delights" },
      { category: "paper & tissue", target: "https://www.fairprice.com.sg/category/paper-tissue" },
      { category: "dishwashing", target: "https://www.fairprice.com.sg/category/dishwashing" },
    ],
    selectors: {
      productContainer: ".sc-2a85da88-0.fhLHEV.product-container",
      productName: ".sc-aa673588-1.iCYFVg",
      productPrice: ".sc-aa673588-1.sc-65bf849-1.kdTuLI.cXCGWM",
      productSrc: ".sc-2a85da88-3.kvyuCT",
      productImg: "img.sc-aca6d870-0.janHcI"
    },
  },
  {
    name: "Sheng Siong",
    src: "https://shengsiong.com.sg",
    hits: [
      { category: "rice", target: "https://shengsiong.com.sg/rice-noodles-pasta/rice" },
      { category: "bread", target: "https://shengsiong.com.sg/breakfast-spreads/bakery" },
      { category: "eggs", target: "https://shengsiong.com.sg/dairy-chilled-eggs/eggs" },
      { category: "milk", target: "https://shengsiong.com.sg/dairy-chilled-eggs/fresh-milk" },
      { category: "soft drinks", target: "https://shengsiong.com.sg/beverages/soft-drinks" },
      { category: "instant beverages", target: "https://shengsiong.com.sg/beverages/instant-beverages" },
      { category: "asian drinks", target: "https://shengsiong.com.sg/beverages/asian-drinks" },
      { category: "frozen seafood", target: "https://shengsiong.com.sg/meat-poultry-seafood/frozen-seafood-31" },
      { category: "pasta", target: "https://shengsiong.com.sg/rice-noodles-pasta/pasta" },
      { category: "noodles", target: "https://shengsiong.com.sg/rice-noodles-pasta/noodles" },
      { category: "oil", target: "https://shengsiong.com.sg/cooking-baking-needs/cooking-oil" },
      { category: "paper & tissue", target: "https://shengsiong.com.sg/household/paper-tissue" },
      { category: "instant cup noodles", target: "https://shengsiong.com.sg/convenience-food-113/instant-noodles/cup-bowl-noodles" },
      { category: "instant noodles", target: "https://shengsiong.com.sg/convenience-food-113/instant-noodles/packet-noodles" },
      { category: "dumplings", target: "https://shengsiong.com.sg/frozen-goods/pastries-dumplings-buns" },
      { category: "frozen meat", target: "https://shengsiong.com.sg/frozen-goods/frozen-meat-105" },
      { category: "paper & tissue", target: "https://shengsiong.com.sg/household/paper-tissue" },
      { category: "cleaning supplies", target: "https://shengsiong.com.sg/household/cleaning-supplies" }
    ],
    selectors: {
      productContainer: ".col-lg-2",
      productName: ".product-name",
      productPrice: ".product-price",
      productSrc: ".product-preview",
      productImg: ".product-img"
    },
  }
];

async function updateItem(itemName, retailer, src, price, imgSrc, imgName) {
  let date = new Date();
  let formattedDate = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  let { data, error } = await supabase
    .from('items')
    .select('price_history')
    .eq('name', itemName);

  if (error) return error;

  // if not exist insert, else update price_history col
  if (data.length == 0) {
    try {
      const response = await fetch(imgSrc);
      const data = Buffer.from(await response.arrayBuffer())
      cloudinary.uploader.upload_stream({
        public_id: imgName,
        resource_type: "image",
        overwrite: false
      }, (error, result) => {

      }).end(data);
    } catch (e) {
      console.log(e)
      return e;
    }

    let insertRes = await supabase
      .from('items')
      .insert({ name: itemName, retailer: retailer, src: src, price_history: { [formattedDate]: price }, imgName: imgName });
    return insertRes
  }

  data[0]['price_history'][formattedDate] = price;
  let updateRes = await supabase
    .from('items')
    .update({ price_history: data[0]['price_history'], imgName: imgName })
    .eq('name', itemName);
  return updateRes
}

async function scrollToBottom(page) {
  return await page.evaluate(async () => {
    await new Promise((resolve) => {
      try {
        let totalHeight = 0;
        let distance = 800;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
      } catch (e) {
        console.log('scrollToBottom error: ', e);
        reject(e)
      }
    });
  });
}

puppeteer.use(StealthPlugin())
puppeteer.launch({ headless: true }).then(async (browser) => {
  const page = await browser.newPage();
  let totalItems = 0;

  async function extractData(retailer) {
    for (let h = 0; h < retailer.hits.length; h++) {
      await page.goto(retailer.hits[h].target, { waitUntil: "domcontentloaded", timeout: 60000 });
      await scrollToBottom(page);
      await page.waitForSelector(retailer.selectors.productContainer, { timeout: 60000 });

      const products = await page.$$eval(retailer.selectors.productContainer, (elements, retailer) => {
        let productList = [];

        elements.forEach((element) => {
          const productName = element.querySelector(retailer.selectors.productName).textContent.trim();
          const productPrice = element.querySelector(retailer.selectors.productPrice).textContent.trim();
          const productSrc = element.querySelector(retailer.selectors.productSrc).getAttribute('href');
          const productImg = element.querySelector(retailer.selectors.productImg)?.getAttribute('src') ?? '';

          productList.push({
            name: productName,
            price: parseFloat(productPrice.split('$')[1]),
            src: retailer.src + productSrc,
            imgName: productImg.split('/').pop().split('?')[0],
            imgSrc: productImg,
          });
        });

        return productList;
      }, retailer);
      for (let i = 0; i < products.length; i++) {
        updateItem(products[i].name, retailer.name, products[i].src, products[i].price, products[i].imgSrc, products[i].imgName);
      }

      totalItems += products.length;
      console.log('retailer: ', retailer.name);
      console.log("category: ", retailer.hits[h].category);
      console.log("total items: ", products.length);
      console.log('======================');
    }
  }

  for (let r = 0; r < retailers.length; r++) {
    await extractData(retailers[r]);
  }

  console.log("scrape completed");
  console.log("total items: ", totalItems);
  browser.close()
});

