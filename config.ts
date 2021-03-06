import { Target } from "./target";

// tslint:disable:max-line-length
export const SLACK_REPORT_ENABLED = new Set([1, 9]).has(new Date().getHours()); // KST 10AM OR 6PM
export const Targets: Target[] = [
  // alert enabled products
  new Target("https://www.cosstores.com/en_de/men/menswear/t-shirts/product.ribbed-roll-neck-top-grey.0920521001.html", ["S", "M"], ["europe"]),
  new Target("https://www.cosstores.com/en_de/men/accessories/shoes/boots/product.chunky-sole-chelsea-boots-black.0784114002.html", ["0784114002005"]),
  new Target("https://www.cosstores.com/en_de/men/accessories/shoes/product.square-toe-derby-shoes-black.0784122001.html", ["41"]),
  // purchased now - alert disabled
  new Target("https://www.cosstores.com/en_de/men/menswear/knitwear/product.yak-mix-roll-neck-jumper-grey.0537856016.html", ["S", "M"], ["europe"], false),
  new Target("https://www.cosstores.com/en_de/men/menswear/knitwear/jumpers/product.knitted-cotton-merino-jumper-blue.0911266001.html", ["S", "M"], undefined, false),
  // example purpose
  new Target("https://www.cosstores.com/en_usd/women/womenswear/coats-and-jackets/coats/product.long-hooded-puffer-coat-yellow.0916508002.html", undefined, undefined, false),
];
// tslint:enable:max-line-length
