export type BotProvider = "whatsapp_cloud" | "twilio" | "telegram" | "n8n";

export type BotIntent =
  | "check_availability"
  | "create_booking"
  | "cancel_booking"
  | "check_prices"
  | "human_handoff"
  | "unknown";

export type BotInboundMessage = {
  provider: BotProvider;
  externalMessageId: string;
  channelPhoneNumberId: string;
  fromPhone: string;
  senderName?: string;
  text: string;
  receivedAt: string;
};

export type BotReply = {
  text: string;
  intent: BotIntent;
  handoffToHuman?: boolean;
  metadata?: Record<string, unknown>;
};

export type BotWebhookResult = {
  ok: boolean;
  duplicate?: boolean;
  complexId?: string | null;
  reply?: BotReply;
};
