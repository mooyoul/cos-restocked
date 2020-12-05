import { AvailabilityLevel, COSClient, Product, Region, Variant } from "./cos-client";

export type LookupResult = Omit<Product, "variants"> & {
  alert: boolean;
  inStock: boolean;
  variants: (Variant & {
    regionAvailability: [Region, AvailabilityLevel][];
  })[];
};

export class Target {
  public static readonly ALL_REGIONS: Set<Region> = new Set(["europe", "us", "global"]);

  public constructor(
    public readonly url: string,
    public readonly variants?: string[],
    public readonly regions?: Region[],
    public readonly alert = true,
  ) {}

  public async lookup(): Promise<LookupResult> {
    const product = await COSClient.describeProduct(this.url);

    let inStock = false;
    const skuAvailability: Record<string, [Region, AvailabilityLevel][]> = Object.fromEntries(
      product.variants.map((variant) => [variant.sku, []]),
    );

    const selectedRegions = this.regions ?? Target.ALL_REGIONS;
    const selectedVariations = product.variants.filter((variant) => {
      return this.variants
        ? this.variants.some((selector) =>
          variant.code === selector || variant.name === selector || variant.sku === selector,
        )
        : true;
    });

    for (const region of selectedRegions) {
      const client = new COSClient(region);
      const availability = await client.getAvailability(product.id);

      for (const { sku } of selectedVariations) {
        const level = availability[sku] ?? AvailabilityLevel.UNAVAILABLE;
        skuAvailability[sku].push([region, level]);
        if (level > AvailabilityLevel.UNAVAILABLE) {
          inStock = true;
        }
      }
    }

    return {
      alert: this.alert,
      inStock,
      ...product,
      variants: selectedVariations.map((variant) => ({
        ...variant,
        regionAvailability: skuAvailability[variant.sku],
      })),
    };
  }
}
