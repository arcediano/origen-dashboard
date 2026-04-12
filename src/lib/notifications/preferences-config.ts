export type PreferenceEventType =
  | 'NEW_ORDER'
  | 'NEW_REVIEW'
  | 'REVIEW_REPLY'
  | 'PRODUCT_LOW_STOCK'
  | 'PROMOTION_CREATED';

export type PreferenceKey =
  | 'orders'
  | 'newReview'
  | 'reviewReply'
  | 'stock'
  | 'marketing';

export interface ChannelState {
  orders: boolean;
  newReview: boolean;
  reviewReply: boolean;
  stock: boolean;
  marketing: boolean;
}

export interface NotificationPreferenceDto {
  eventType: PreferenceEventType;
  email?: boolean;
  push?: boolean;
}

export const DEFAULT_EMAIL_SETTINGS: ChannelState = {
  orders: true,
  newReview: true,
  reviewReply: true,
  stock: true,
  marketing: false,
};

export const DEFAULT_PUSH_SETTINGS: ChannelState = {
  orders: false,
  newReview: false,
  reviewReply: false,
  stock: false,
  marketing: false,
};

export const EVENT_BY_KEY: Record<PreferenceKey, PreferenceEventType> = {
  orders: 'NEW_ORDER',
  newReview: 'NEW_REVIEW',
  reviewReply: 'REVIEW_REPLY',
  stock: 'PRODUCT_LOW_STOCK',
  marketing: 'PROMOTION_CREATED',
};

function resolveBooleanValue(
  preference: NotificationPreferenceDto | undefined,
  channel: 'email' | 'push',
  fallback: boolean,
): boolean {
  const value = preference?.[channel];
  return typeof value === 'boolean' ? value : fallback;
}

export function buildChannelStateFromPreferences(
  preferences: NotificationPreferenceDto[],
  channel: 'email' | 'push',
): ChannelState {
  const byEvent = new Map<PreferenceEventType, NotificationPreferenceDto>(
    preferences.map((item) => [item.eventType, item]),
  );

  const defaults = channel === 'email' ? DEFAULT_EMAIL_SETTINGS : DEFAULT_PUSH_SETTINGS;

  return {
    orders: resolveBooleanValue(byEvent.get('NEW_ORDER'), channel, defaults.orders),
    newReview: resolveBooleanValue(byEvent.get('NEW_REVIEW'), channel, defaults.newReview),
    reviewReply: resolveBooleanValue(byEvent.get('REVIEW_REPLY'), channel, defaults.reviewReply),
    stock: resolveBooleanValue(byEvent.get('PRODUCT_LOW_STOCK'), channel, defaults.stock),
    marketing: resolveBooleanValue(byEvent.get('PROMOTION_CREATED'), channel, defaults.marketing),
  };
}

export function buildPreferencesPayload(
  emailSettings: ChannelState,
  pushSettings: ChannelState,
) {
  return (Object.keys(EVENT_BY_KEY) as PreferenceKey[]).map((key) => ({
    eventType: EVENT_BY_KEY[key],
    email: emailSettings[key],
    inApp: true,
    push: pushSettings[key],
    frequency: 'INSTANT' as const,
  }));
}
