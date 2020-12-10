import * as mapSeries from "p-map-series";
import { SLACK_REPORT_ENABLED, Targets } from "./config";
import { Markdown } from "./markdown";
import { Slack } from "./slack";
import { LookupResult } from "./target";

(async () => {
  const products: LookupResult[] = (await mapSeries(Targets, async (target) => {
    try {
      return await target.lookup();
    } catch (e) {
      return null;
    }
  })).filter((v): v is LookupResult => Boolean(v));

  const inStockAlertProducts = products
    .filter((product) => product.inStock && product.alert);

  await new Slack(inStockAlertProducts, "💸 RESTOCK ALERT 💸", process.env.SLACK_INCOMING_WEBHOOK_URL!).send();

  if (SLACK_REPORT_ENABLED) {
    await new Slack(products, "📊 Stock Report", process.env.SLACK_INCOMING_WEBHOOK_URL!).send();
  }

  await new Markdown(products, "README.md").emit();
})().catch((e) => {
  console.error(e.stack); // tslint:disable-line
  process.exitCode = 1;
});
