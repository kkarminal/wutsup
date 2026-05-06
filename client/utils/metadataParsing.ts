export interface MenuInfo {
  items: { name: string; price?: string }[];
}

export interface EventInfo {
  events: { name: string; date?: string; description?: string }[];
}

/**
 * Parses menu metadata from the item's metadata field.
 * Returns undefined if no valid menu data is found.
 */
export function parseMenuMetadata(metadata: Record<string, unknown> | null): MenuInfo | undefined {
  if (!metadata) return undefined;

  const menuItems = metadata['menuItems'];
  if (!Array.isArray(menuItems) || menuItems.length === 0) return undefined;

  const items = menuItems
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map((item) => ({
      name: typeof item['name'] === 'string' ? item['name'] : '',
      price: typeof item['price'] === 'string' ? item['price'] : undefined,
    }))
    .filter((item) => item.name.length > 0);

  if (items.length === 0) return undefined;

  return { items };
}

/**
 * Parses event metadata from the item's metadata field.
 * Returns undefined if no valid event data is found.
 */
export function parseEventMetadata(metadata: Record<string, unknown> | null): EventInfo | undefined {
  if (!metadata) return undefined;

  const events = metadata['events'];
  if (!Array.isArray(events) || events.length === 0) return undefined;

  const parsed = events
    .filter((event): event is Record<string, unknown> => event !== null && typeof event === 'object')
    .map((event) => ({
      name: typeof event['name'] === 'string' ? event['name'] : '',
      date: typeof event['date'] === 'string' ? event['date'] : undefined,
      description: typeof event['description'] === 'string' ? event['description'] : undefined,
    }))
    .filter((event) => event.name.length > 0);

  if (parsed.length === 0) return undefined;

  return { events: parsed };
}
