import { describe, expect, it } from 'vitest';
import {
  buildChannelStateFromPreferences,
  buildPreferencesPayload,
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_PUSH_SETTINGS,
} from '@/lib/notifications/preferences-config';

describe('preferences-config mapping', () => {
  it('uses channel defaults when preferences are missing', () => {
    const emailState = buildChannelStateFromPreferences([], 'email');
    const pushState = buildChannelStateFromPreferences([], 'push');

    expect(emailState).toEqual(DEFAULT_EMAIL_SETTINGS);
    expect(pushState).toEqual(DEFAULT_PUSH_SETTINGS);
  });

  it('keeps NEW_REVIEW and REVIEW_REPLY independent per channel', () => {
    const preferences = [
      { eventType: 'NEW_REVIEW' as const, email: true, push: false },
      { eventType: 'REVIEW_REPLY' as const, email: false, push: true },
    ];

    const emailState = buildChannelStateFromPreferences(preferences, 'email');
    const pushState = buildChannelStateFromPreferences(preferences, 'push');

    expect(emailState.newReview).toBe(true);
    expect(emailState.reviewReply).toBe(false);
    expect(pushState.newReview).toBe(false);
    expect(pushState.reviewReply).toBe(true);
  });

  it('builds payload preserving per-event and per-channel values', () => {
    const emailSettings = {
      orders: true,
      newReview: true,
      reviewReply: false,
      stock: true,
      marketing: false,
    };

    const pushSettings = {
      orders: false,
      newReview: true,
      reviewReply: true,
      stock: false,
      marketing: false,
    };

    const payload = buildPreferencesPayload(emailSettings, pushSettings);

    expect(payload).toHaveLength(5);
    expect(payload.find((item) => item.eventType === 'NEW_REVIEW')).toEqual({
      eventType: 'NEW_REVIEW',
      email: true,
      inApp: true,
      push: true,
      frequency: 'INSTANT',
    });
    expect(payload.find((item) => item.eventType === 'REVIEW_REPLY')).toEqual({
      eventType: 'REVIEW_REPLY',
      email: false,
      inApp: true,
      push: true,
      frequency: 'INSTANT',
    });
  });
});
