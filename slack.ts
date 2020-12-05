import { SectionBlock } from "@slack/types";
import { IncomingWebhook, IncomingWebhookSendArguments } from "@slack/webhook";
import { LookupResult } from "./target";

import { AvailabilityLevel } from "./cos-client";

export class Slack {
  private webhook: IncomingWebhook;

  public constructor(
    private readonly products: LookupResult[],
    private readonly title: string = "Alert",
    webhookUrl: string,
  ) {
    this.webhook = new IncomingWebhook(webhookUrl);
  }

  public async send() {
    if (this.products.length > 0) {
      await this.webhook.send(this.format());
    }
  }

  private format(): IncomingWebhookSendArguments {
    return {
      blocks: [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: this.title,
        },
      }, {
        type: "divider",
      }, ...this.products.map((product): SectionBlock => ({
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `<${product.url}|${product.name}>`,
            `*${product.price}* | ${product.category}`,
            ...product.variants.map((variant) => {
              const summary = variant.regionAvailability.map(([region, level]) => {
                const label = {
                  global: "🌏",
                  europe: "🇪🇺",
                  us: "🇺🇸",
                }[region];

                const status = {
                  [AvailabilityLevel.UNAVAILABLE]: "❌",
                  [AvailabilityLevel.LOW_IN_STOCK]: "⚠️️",
                  [AvailabilityLevel.AVAILABLE]: "✅",
                }[level];

                return `${label} - ${status}`;
              }).join(" | ");

              return `*${variant.name}* -${summary}`;
            }),
          ].join("\n"),
        },
        accessory: product.image ? {
          type: "image",
          image_url: product.image,
          alt_text: "Product Image",
        } : undefined,
      }))],
    };
  }
}
