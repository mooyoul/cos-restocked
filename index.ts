import * as mapSeries from "p-map-series";
import { Markdown } from "./markdown";
import { Slack } from "./slack";
import { LookupResult, Target } from "./target";

// tslint:disable:max-line-length
const SLACK_REPORT_ENABLED = new Set([1, 9]).has(new Date().getHours()); // KST 10AM OR 6PM
const Targets: Target[] = [
  new Target("https://www.cosstores.com/en_de/men/menswear/knitwear/jumpers/product.knitted-cotton-merino-jumper-blue.0911266001.html"),
  new Target("https://www.cosstores.com/en_de/men/accessories/shoes/boots/product.chunky-sole-chelsea-boots-black.0784114002.html", ["0784114002005"]),
  new Target("https://www.cosstores.com/en_usd/women/womenswear/coats-and-jackets/coats/product.long-hooded-puffer-coat-yellow.0916508002.html"),
];
// tslint:enable:max-line-length

(async () => {
  const products: LookupResult[] = (await mapSeries(Targets, async (target) => {
    try {
      return await target.lookup();
    } catch (e) {
      return null;
    }
  })).filter((v): v is LookupResult => Boolean(v));

  const inStockProducts = products.filter((product) => product.inStock);

  await new Slack(inStockProducts, "💸 RESTOCK ALERT 💸", process.env.SLACK_INCOMING_WEBHOOK_URL!).send();

  if (SLACK_REPORT_ENABLED) {
    await new Slack(products, "📊 Stock Report", process.env.SLACK_INCOMING_WEBHOOK_URL!).send();
  }

  await new Markdown(products, "README.md").emit();
})().catch((e) => {
  console.error(e.stack); // tslint:disable-line
  process.exitCode = 1;
});
