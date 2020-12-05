import * as cheerio from "cheerio";
import * as cookie from "cookie";
import * as esprima from "esprima";
import got from "got";
import * as traverse from "traverse";
import * as vm from "vm";

export type Region = "europe" | "us" | "global";
export type Variant = {
  sku: string;
  code: string;
  name: string;
};
export type Product = {
  id: string;
  url: string;
  name: string;
  category: string;
  price: string;
  image: string | null;
  variants: Variant[];
};
export enum AvailabilityLevel {
  UNAVAILABLE = 0,
  LOW_IN_STOCK = 1,
  AVAILABLE = 2,
}
export type Availability = Record<string, AvailabilityLevel>;

export class COSClient {
  private readonly client = got.extend({
    prefixUrl: `https://www.cosstores.com/webservices_cos/service/product/cos-${this.region}/`,
    headers: {
      // @note COS automatically redirects to regional COS online store except "GoogleBot"
      "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });

  public constructor(
    public readonly region: Region = "global",
  ) {}

  public static async describeProduct(url: string): Promise<Product> {
    const res = await got.get<string>(url, {
      headers: {
        Cookie: cookie.serialize("HMCORP_locale", "en_WW"),
      },
    });

    const $ = cheerio.load(res.body);
    const scripts = $("script").map((index, element) => $(element).html()).get() as string[];

    const found = (() => {
      for (const script of scripts) {
        try {
          const program = esprima.parseScript(script, { range: true });

          for (const node of traverse(program.body).nodes()) {
            const isProductDataDecl = node.type === "VariableDeclarator"
              && node.id?.name === "productArticleDetails"
              && node.init?.type === "ObjectExpression";

            if (isProductDataDecl) {
              const [start, end] = node.init.range;
              const source = `value = ${script.slice(start, end)}`;
              return vm.runInNewContext(source, {}, {
                displayErrors: true,
              });
            }
          }
        } catch (e) { /* swallow error */ }
      }
    })();

    if (!found) {
      throw new Error("Could not find required data from requested page");
    }

    const product = found[found.articleCode];
    return {
      id: found.ancestorProductCode,
      url,
      name: [product.title, product.name.toUpperCase()].filter((v) => v).join(" / "),
      category: found.mainCategorySummary,
      price: product.price,
      variants: product.variants.map((variant: Record<string, any>) => ({
        sku: variant.variantCode,
        code: variant.sizeCode,
        name: variant.sizeName,
      })),
      image: (() => {
        const imageUrl =
          product.thumbnailImages?.[0]?.thumbnail ||
          product.normalImages?.[0]?.thumbnail ||
          product.otherImages?.[0]?.thumbnail;

        return imageUrl && imageUrl.startsWith("//")
          ? `https:${imageUrl}`
          : imageUrl ?? null;
      })(),
    };
  }

  public async getAvailability(id: string): Promise<Availability> {
    const res = await this.client.get(`availability/${id}.json`)
      .json<{
        availability: string[];
        fewPieceLeft: string[];
      }>();

    const availability: Record<string, AvailabilityLevel> = {};

    res.availability?.forEach?.((sku) => {
      availability[sku] = AvailabilityLevel.AVAILABLE;
    });
    res.fewPieceLeft?.forEach?.((sku) => {
      availability[sku] = AvailabilityLevel.LOW_IN_STOCK;
    });

    return availability;
  }
}
