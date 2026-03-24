// Curated block list presets by focus type.
// User can add/remove domains from each via settings.

export const PRESETS = {
  deepWork: {
    label: 'Deep Work',
    description: 'Kill everything that pulls you away from your craft.',
    domains: [
      'twitter.com', 'x.com',
      'facebook.com', 'instagram.com',
      'reddit.com', 'tiktok.com',
      'youtube.com', 'twitch.tv',
      'linkedin.com', 'pinterest.com',
      'snapchat.com', 'discord.com',
      'slack.com', 'news.ycombinator.com',
      'theverge.com', 'techcrunch.com',
      'buzzfeed.com', 'huffpost.com',
      'cnn.com', 'bbc.com', 'nytimes.com',
    ],
  },
  study: {
    label: 'Study',
    description: 'Block noise. Let knowledge in.',
    domains: [
      'twitter.com', 'x.com',
      'facebook.com', 'instagram.com',
      'reddit.com', 'tiktok.com',
      'youtube.com', 'twitch.tv',
      'netflix.com', 'hulu.com',
      'discord.com', 'snapchat.com',
      'pinterest.com', 'buzzfeed.com',
    ],
  },
  creative: {
    label: 'Creative',
    description: 'No feeds. No opinions. Just you and the work.',
    domains: [
      'twitter.com', 'x.com',
      'instagram.com', 'facebook.com',
      'tiktok.com', 'reddit.com',
      'pinterest.com', 'linkedin.com',
      'news.ycombinator.com',
    ],
  },
  detox: {
    label: 'Full Detox',
    description: 'Step back from all of it.',
    domains: [
      'twitter.com', 'x.com',
      'facebook.com', 'instagram.com',
      'reddit.com', 'tiktok.com',
      'youtube.com', 'twitch.tv',
      'netflix.com', 'hulu.com',
      'disneyplus.com', 'primevideo.com',
      'linkedin.com', 'pinterest.com',
      'snapchat.com', 'discord.com',
      'slack.com', 'whatsapp.com',
      'news.ycombinator.com', 'theverge.com',
      'techcrunch.com', 'cnn.com',
      'bbc.com', 'nytimes.com',
      'buzzfeed.com', 'huffpost.com',
    ],
  },
};

export const PRESET_KEYS = Object.keys(PRESETS);

// Merge user customizations (stored in chrome.storage.local) with preset defaults
export async function getBlockList(presetKey) {
  const base = PRESETS[presetKey]?.domains || [];
  const result = await chrome.storage.local.get(`blocklist_custom_${presetKey}`);
  const custom = result[`blocklist_custom_${presetKey}`] || { add: [], remove: [] };
  const merged = [...new Set([...base, ...custom.add])].filter(
    (d) => !custom.remove.includes(d)
  );
  return merged;
}

export async function saveCustomization(presetKey, { add = [], remove = [] }) {
  await chrome.storage.local.set({ [`blocklist_custom_${presetKey}`]: { add, remove } });
}
