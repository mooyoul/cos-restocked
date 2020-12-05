import { html } from "common-tags";
import { promises as fs } from "fs";
import * as he from "he";
import * as moment from "moment-timezone";
import { LookupResult } from "./target";

import { AvailabilityLevel } from "./cos-client";

export class Markdown {
  public constructor(
    private readonly products: LookupResult[],
    private destination: string,
  ) {}

  public async emit() {
    await fs.writeFile(this.destination, this.render());
  }

  private render(): string {
    const inStockProducts = this.products.filter((product) => product.inStock);
    const inStock = inStockProducts.length;
    const outOfStock = this.products.length - inStockProducts.length;

    // tslint:disable:max-line-length
    return html`
      # cos-restocked

      > Personal In-Stock Tracker for [COS Online Store](https://www.cosstores.com/)

      ![workflow](https://github.com/mooyoul/dynamodb-actions/workflows/workflow/badge.svg)
      ![Tracking](${this.getBadgeUrl("Total", this.products.length.toString(), this.products.length > 0 ? "brightgreen" : "yellow")})
      ![Updated](${this.getBadgeUrl("Updated", moment(new Date()).tz("Asia/Seoul").format("MMM D YYYY, h:m a"), "blue")})

      # 🧥 Contents

      ![In Stock](${this.getBadgeUrl("In Stock", inStock.toString(), "brightgreen")})
      ![Out of Stock](${this.getBadgeUrl("Out of Stock", outOfStock.toString(), "red")})

      <table>
      <thead>
      <tr>
        <th>Image</th>
        <th>Name</th>
      </tr>
      </thead>
      ${this.renderList(this.products)}
      </table>

      **[⬆ Back to Index](#-contents)**

      ## Slack Support

      ![Screenshot](assets/screenshot.png)

      ## Configuration / Deployment

      See [workflow.yml](/.github/workflows/main.yml)

      ## License

      [MIT](LICENSE)

      See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)

    `;
    // tslint:enable:max-line-length
  }

  private renderList(products: LookupResult[]) {
    if (products.length === 0) {
      return html`
        <tbody>
        <tr>
        <td colspan="2" align="center">(empty)</td>
        </tr>
        </tbody>
      `;
    }

    return html`
      <tbody>
      ${this.products.map((product) => {
        const image = product.image ?
          `<img src="${he.encode(product.image)}" width="200" alt="Product Image" />`
          : "No Image";
        const variants = product.variants.map((variant) => {
          const summary = variant.regionAvailability.map(([region, level]) => {
            const label = {
              global: "🌏",
              europe: "🇪🇺",
              us: "🇺🇸",
            }[region];

            const value = {
              [AvailabilityLevel.UNAVAILABLE]: "unavailable",
              [AvailabilityLevel.LOW_IN_STOCK]: "low in stock",
              [AvailabilityLevel.AVAILABLE]: "available",
            }[level];

            const color = {
              [AvailabilityLevel.UNAVAILABLE]: "red",
              [AvailabilityLevel.LOW_IN_STOCK]: "yellow",
              [AvailabilityLevel.AVAILABLE]: "green",
            }[level];

            return `<img src="${he.encode(this.getBadgeUrl(label, value, color))}" alt="Stock Image" />`;
          }).join(" ");

          return `<strong>${variant.name}</strong><br />${summary}<br />`;
        }).join("\n");

        return html`
          <tr>
            <td valign="top">${image}</td>
            <td valign="top">
              <strong><a href="${he.encode(product.url)}">${product.name}</a></strong><br />
              <strong>${product.price}</strong> ${product.category}<br/>
              <br />
              ${variants}
            </td>
          </tr>
        `;
      }).join("\n")}
      </tbody>
    `;
  }

  private getBadgeUrl(label: string, message: string, color: string): string {
    const params = [label, message, color]
      .map((param) => encodeURIComponent(param.replace(/-/g, "--")))
      .join("-");

    return `https://img.shields.io/badge/${params}.svg`;
  }
}
