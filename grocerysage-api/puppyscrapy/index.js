const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
const { v2: cloudinary } = require('cloudinary');
const dotenv = require('dotenv');
const retailers = require('./retailers.json');
const express = require('express')

const app = express()
const port = 9000
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());


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

app.get('/scrape', async (req, res) => {
  // todo authorization check

  let results = { dateStarted: new Date() };

  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let totalItems = 0;


  async function extractData(retailer) {
    let scrapeResult = [];

    for (let h = 0; h < retailer.hits.length; h++) {
      try {
        await page.goto(retailer.hits[h].target, { waitUntil: "networkidle0", timeout: 60000 });
        await scrollToBottom(page);
        //await page.waitForSelector(retailer.selectors.productContainer, { timeout: 60000 });
      } catch (e) {
        scrapeResult.push({ category: retailer.hits[h].category, status: e });
        return e;
      }

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

      scrapeResult.push({ category: retailer.hits[h].category, count: products.length, status: "success" });
    }
    return scrapeResult;
  }

  for (let r = 0; r < retailers.length; r++) {
    const scrapedResult = await extractData(retailers[r]);
    results[retailers[r].name] = scrapedResult;
  }

  console.log("scrape completed");
  console.log("total items: ", totalItems);
  results["total"] = totalItems;
  browser.close()

  res.json(results);
});

app.listen(port, () => {
  console.log(`scraper service running at port ${port}`);
});
