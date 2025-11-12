import { computed } from "vue";

export type MockMediaStatus = "available" | "checked_out" | "reserved";

export interface MockMediaItem {
  id: number;
  title: string;
  author: string;
  mediaType: "book" | "magazine" | "dvd" | "audiobook";
  coverUrl: string;
  status: MockMediaStatus;
  callNumber: string;
  publishedAt: string;
  tags: string[];
}

type UseCatalogMockOptions = {
  take?: number;
};

const baseItems: MockMediaItem[] = [
  {
    id: 1,
    title: "The Midnight Library",
    author: "Matt Haig",
    mediaType: "book",
    coverUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=512&q=80",
    status: "available",
    callNumber: "FIC HAI",
    publishedAt: "2020-08-13",
    tags: ["Fiction", "Philosophy"]
  },
  {
    id: 2,
    title: "National Geographic: Oceans",
    author: "National Geographic",
    mediaType: "magazine",
    coverUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=512&q=80",
    status: "reserved",
    callNumber: "MAG NAT",
    publishedAt: "2024-05-01",
    tags: ["Science", "Nature"]
  },
  {
    id: 3,
    title: "Interstellar",
    author: "Christopher Nolan",
    mediaType: "dvd",
    coverUrl: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=512&q=80",
    status: "checked_out",
    callNumber: "DVD INT",
    publishedAt: "2014-11-07",
    tags: ["Sci-fi", "Drama"]
  },
  {
    id: 4,
    title: "Becoming",
    author: "Michelle Obama",
    mediaType: "audiobook",
    coverUrl: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=512&q=80",
    status: "available",
    callNumber: "AUDIO OBA",
    publishedAt: "2018-11-13",
    tags: ["Biography", "Inspiration"]
  },
  {
    id: 5,
    title: "Project Hail Mary",
    author: "Andy Weir",
    mediaType: "book",
    coverUrl: "https://images.unsplash.com/photo-1526313199968-70e399ffe791?auto=format&fit=crop&w=512&q=80",
    status: "available",
    callNumber: "SF WEI",
    publishedAt: "2021-05-04",
    tags: ["Sci-fi", "Adventure"]
  },
  {
    id: 6,
    title: "The Economist",
    author: "The Economist",
    mediaType: "magazine",
    coverUrl: "https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&w=512&q=80",
    status: "available",
    callNumber: "MAG ECO",
    publishedAt: "2025-10-15",
    tags: ["Economics", "Politics"]
  }
];

export function useCatalogMock(options: UseCatalogMockOptions = {}) {
  const take = options.take ?? 24;
  const catalog = computed(() => {
    if (take <= baseItems.length) {
      return baseItems.slice(0, take);
    }

    const loops = Math.ceil(take / baseItems.length);
    const expanded = Array.from({ length: loops }, (_, loopIndex) =>
      baseItems.map((item) => ({
        ...item,
        id: item.id + loopIndex * baseItems.length,
        status: shiftStatus(item.status, loopIndex)
      }))
    ).flat();

    return expanded.slice(0, take);
  });

  return {
    items: catalog
  };
}

function shiftStatus(status: MockMediaStatus, offset: number): MockMediaStatus {
  const statuses: MockMediaStatus[] = ["available", "checked_out", "reserved"];
  const index = statuses.indexOf(status);
  const next = (index + offset) % statuses.length;
  return statuses[next] ?? "available";
}
