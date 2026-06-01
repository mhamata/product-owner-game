import type { SizingDrill } from './types';

/**
 * T-shirt sizing drill — de-specialized to generic SaaS stories.
 * Relative sizing XS → XXL. Anything past M should be broken down before a
 * sprint commitment.
 */
export const tshirtDrill: SizingDrill = {
  scenario: 'SaaS · roadmap sizing',
  prompt: 'Size each story relative to the others. No absolute hours — relative effort only.',
  legend:
    'XS ≈ 1 day · S ≈ 2–3 days · M ≈ 1 sprint · L ≈ 2 sprints · XL ≈ 1 quarter · XXL = break it down first',
  stories: [
    {
      id: 'locale-toggle',
      title: 'Locale / timezone preference toggle',
      description: 'Let users set their locale so dates and times render correctly.',
      correct: 'S',
      why: 'Small in concept, but it touches every date/time component. 2–3 days of careful work.',
    },
    {
      id: 'sso',
      title: 'Enterprise SSO (SAML)',
      description:
        'Add SAML single sign-on: identity-provider integration, just-in-time provisioning, admin config.',
      correct: 'L',
      why: 'Third-party integration plus several flows and edge cases. Roughly two sprints.',
    },
    {
      id: 'copy-fix',
      title: 'Fix incorrect empty-state copy',
      description: 'A dashboard empty state shows the wrong message. Update the string and test.',
      correct: 'XS',
      why: 'Copy change plus a quick test. About a day.',
    },
    {
      id: 'billing-platform',
      title: 'Usage-based billing platform',
      description:
        'Full metering pipeline, invoicing, proration, tax handling, and a customer billing portal.',
      correct: 'XXL',
      why: 'Multi-quarter. Break it down before any sprint commitment — metering alone is an L.',
    },
    {
      id: 'activity-feed',
      title: 'Team activity feed (v1)',
      description: 'A scoped feed with posts and comments, plus basic moderation controls.',
      correct: 'M',
      why: 'One sprint of focused work. Moderation adds a little scope over a plain feed.',
    },
  ],
  insight:
    'Rule of thumb: anything bigger than M should be broken down before it enters a sprint. XXL isn’t an estimate — it’s a flag that says "decompose me first."',
};
