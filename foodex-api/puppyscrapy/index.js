const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const retailers = [
  {
    name: "fairprice",
    src: "https://www.fairprice.com.sg",
    hits: [
      { category: "fruits", target: "https://www.fairprice.com.sg/category/fruits" },
      { category: "shampoo", target: "https://www.fairprice.com.sg/category/shampoo" },
    ],
    selectors: {
      productContainer: ".sc-2a85da88-0.fhLHEV.product-container",
      productName: ".sc-aa673588-1.iCYFVg",
      productPrice: ".sc-aa673588-1.sc-65bf849-1.kdTuLI.cXCGWM",
      productSrc: ".sc-2a85da88-3.kvyuCT",
    },
  },
  {
    name: "shengsiong",
    src: "https://shengsiong.com.sg",
    hits: [
      { category: "eggs", target: "https://shengsiong.com.sg/dairy-chilled-eggs/eggs" },
      { category: "rice", target: "https://shengsiong.com.sg/rice-noodles-pasta/rice" },
    ],
    selectors: {
      productContainer: ".col-lg-2",
      productName: ".product-name",
      productPrice: ".product-price",
      productSrc: ".product-preview",
    },
  }
];

async function scrollToBottom(page) {
  return await page.evaluate(async () => {
    await new Promise((resolve) => {
      try {
        let totalHeight = 0;
        let distance = 1500;
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

  async function extract(retailer) {
    for (let h = 0; h < retailer.hits.length; h++) {
      await page.goto(retailer.hits[h].target, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(retailer.selectors.productContainer);
      await scrollToBottom(page);


      const products = await page.$$eval(retailer.selectors.productContainer, (elements, retailer) => {
        let productList = [];

        elements.forEach((element) => {
          const productName = element.querySelector(retailer.selectors.productName).textContent.trim();
          const productPrice = element.querySelector(retailer.selectors.productPrice).textContent.trim();
          const productSrc = element.querySelector(retailer.selectors.productSrc).getAttribute('href');

          productList.push({ name: productName, price: productPrice, src: retailer.src + productSrc });
        });

        return productList;
      }, retailer);

      console.log('retailer: ', retailer.name);
      console.log("category: ", retailer.hits[h].category);
      console.log("items: ", products.length);
      console.log(products);
      console.log('======================');
    }
  }

  for (let r = 0; r < retailers.length; r++) {
    await extract(retailers[r]);
  }

  browser.close()
});