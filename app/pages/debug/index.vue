<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AgentChatPanel from "~/components/AgentChatPanel.vue";
import { createError } from "h3";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; role: string | null; email: string | null };

const devOnlyGuard = defineNuxtRouteMiddleware(() => {
  if (import.meta.dev) {
    return;
  }

  if (import.meta.server) {
    throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
  }

  return navigateTo("/");
});

definePageMeta({
  middleware: devOnlyGuard
});

type HttpVerb = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";

type PreparedRequest = {
  path?: string;
  method?: HttpVerb;
  body?: Record<string, unknown>;
};

type DebugEndpoint = {
  label: string;
  description: string;
  group: string;
  method: HttpVerb | "LOCAL";
  path: string;
  stream?: boolean;
  prepare?: () => PreparedRequest | Promise<PreparedRequest>;
};

type RequestMeta = {
  label: string;
  method: string;
  path: string;
  timestamp: string;
};

type DebugAuthResponse = {
  authenticated: boolean;
  user?: {
    email?: string | null;
    appMetadata?: Record<string, unknown> | null;
    userMetadata?: Record<string, unknown> | null;
  } | null;
};

const endpoints: DebugEndpoint[] = [
  {
    label: "Ping OpenAI check",
    description: "Calls /api/check/openai to verify streaming bridge.",
    group: "Health",
    method: "GET",
    path: "/api/check/openai",
    stream: true
  },
  {
    label: "Ping Supabase check",
    description: "Calls /api/check/supabase to confirm database connectivity.",
    group: "Health",
    method: "GET",
    path: "/api/check/supabase"
  },
  {
    label: "Preview catalog (mock)",
    description: "Uses current mock composable for quick comparison.",
    group: "Catalog",
    method: "LOCAL",
    path: "mock"
  },
  {
    label: "AI: recommend sample",
    description: "POST /api/ai/recommend with a prompt payload (requires member session)",
    group: "AI",
    method: "POST",
    path: "/api/ai/recommend",
    prepare: () => {
      if (typeof window === "undefined") {
        return {
          body: {
            prompt: "I love space adventures with found families.",
            filters: { mediaType: "book", limit: 4 }
          }
        };
      }

      const promptText = window.prompt(
        "Describe the books or media you want recommendations for",
        "Epic sci-fi with strong female leads"
      );
      if (!promptText || !promptText.trim().length) {
        throw new Error("Recommendation cancelled: prompt text required.");
      }

      const mediaType = window.prompt(
        "Media type filter (book, video, audio, other, optional)",
        ""
      );
      const limit = window.prompt("How many recommendations? (1-12)", "6");

      const filters: Record<string, unknown> = {};
      if (mediaType && mediaType.trim().length) {
        filters.mediaType = mediaType.trim().toLowerCase();
      }
      if (limit && limit.trim().length) {
        const parsed = Number.parseInt(limit, 10);
        if (!Number.isNaN(parsed)) {
          filters.limit = parsed;
        }
      }

      return {
        body: {
          prompt: promptText.trim(),
          filters: Object.keys(filters).length ? filters : undefined
        }
      };
    }
  },
  {
    label: "Admin: list media",
    description: "GET /api/admin/media?page=1 (requires admin session)",
    group: "Admin Media",
    method: "GET",
    path: "/api/admin/media",
    prepare: () => ({ path: "/api/admin/media?page=1" })
  },
  {
    label: "Admin: create media sample",
    description: "POST /api/admin/media with sample payload (requires admin session)",
    group: "Admin Media",
    method: "POST",
    path: "/api/admin/media",
    prepare: () => {
      const timestamp = new Date().toISOString();
      return {
        body: {
          title: `Debug Sample ${timestamp}`,
          creator: "System Debug",
          mediaType: "book",
          mediaFormat: "print",
          genre: "debug",
          subject: "automation",
          description: "Seeded via /debug console",
        },
      };
    },
  },
  {
    label: "Admin: update media title",
    description: "PATCH /api/admin/media/:id to tweak title (requires admin session)",
    group: "Admin Media",
    method: "PATCH",
    path: "/api/admin/media/:id",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const id = window.prompt("Media ID to update?", "");
      if (!id) {
        throw new Error("Update cancelled: media ID required.");
      }

      const newTitle = window.prompt("New title", "");
      const newGenre = window.prompt("Optional genre", "");

      const payload: Record<string, unknown> = {};
      if (newTitle && newTitle.trim().length) {
        payload.title = newTitle.trim();
      }
      if (newGenre && newGenre.trim().length) {
        payload.genre = newGenre.trim();
      }

      if (Object.keys(payload).length === 0) {
        throw new Error("No fields provided for update.");
      }

      return {
        path: `/api/admin/media/${id}`,
        body: payload,
      };
    },
  },
  {
    label: "Admin: delete media",
    description: "DELETE /api/admin/media/:id (requires admin session)",
    group: "Admin Media",
    method: "DELETE",
    path: "/api/admin/media/:id",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const id = window.prompt("Media ID to delete?", "");
      if (!id) {
        throw new Error("Delete cancelled: media ID required.");
      }

      return {
        path: `/api/admin/media/${id}`,
      };
    },
  },
  {
    label: "Loans: list",
    description: "GET /api/loans?page=1 (requires librarian/admin session)",
    group: "Loans",
    method: "GET",
    path: "/api/loans",
    prepare: () => ({ path: "/api/loans?page=1" }),
  },
  {
    label: "Loans: checkout",
    description: "POST /api/loans to checkout media to a member",
    group: "Loans",
    method: "POST",
    path: "/api/loans",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const memberId = window.prompt("Member ID (UUID)", "");
      const mediaId = window.prompt("Media ID (UUID)", "");
      const dueDate = window.prompt("Due date (ISO, optional)", "");
      const note = window.prompt("Checkout note (optional)", "");

      if (!memberId || !mediaId) {
        throw new Error("Checkout cancelled: member and media IDs required.");
      }

      return {
        body: {
          memberId: memberId.trim(),
          mediaId: mediaId.trim(),
          dueDate: dueDate && dueDate.trim().length ? dueDate.trim() : undefined,
          note: note && note.trim().length ? note.trim() : undefined,
        },
      };
    },
  },
  {
    label: "Loans: return",
    description: "POST /api/loans/:id/return with optional condition note",
    group: "Loans",
    method: "POST",
    path: "/api/loans/:id/return",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const loanId = window.prompt("Loan ID", "");
      if (!loanId) {
        throw new Error("Return cancelled: loan ID required.");
      }

      const condition = window.prompt("Condition notes (optional)", "");
      const notes = window.prompt("General notes (optional)", "");

      return {
        path: `/api/loans/${loanId.trim()}/return`,
        body: {
          condition: condition && condition.trim().length ? condition.trim() : undefined,
          notes: notes && notes.trim().length ? notes.trim() : undefined,
        },
      };
    },
  },
  {
    label: "Loans: renew",
    description: "POST /api/loans/:id/renew (member or staff, requires no reservations)",
    group: "Loans",
    method: "POST",
    path: "/api/loans/:id/renew",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const loanId = window.prompt("Loan ID", "");
      if (!loanId) {
        throw new Error("Renew cancelled: loan ID required.");
      }

      const dueDate = window.prompt("New due date (ISO)", "");
      if (!dueDate || !dueDate.trim().length) {
        throw new Error("Renew cancelled: due date required.");
      }

      const note = window.prompt("Renewal note (optional)", "");

      return {
        path: `/api/loans/${loanId.trim()}/renew`,
        body: {
          dueDate: dueDate.trim(),
          note: note && note.trim().length ? note.trim() : undefined,
        },
      };
    },
  }
];

const groupOrder = ["Health", "Catalog", "AI", "Loans", "Admin Media"];

const groupedEndpoints = computed(() => {
  const bucket = new Map<string, DebugEndpoint[]>();

  for (const endpoint of endpoints) {
    const collection = bucket.get(endpoint.group) ?? [];
    collection.push(endpoint);
    bucket.set(endpoint.group, collection);
  }

  const orderedKeys = [
    ...groupOrder.filter((group) => bucket.has(group)),
    ...Array.from(bucket.keys()).filter((key) => !groupOrder.includes(key))
  ];

  return orderedKeys.map((key) => ({
    key,
    endpoints: bucket.get(key) ?? []
  }));
});

const result = ref<string>("Press a button to run a check.");
const loadingKey = ref<string | null>(null);
const sessionState = ref<SessionState>({ status: "loading" });
const lastRequestMeta = ref<RequestMeta | null>(null);
const showGuidelines = ref(false);
const manualTestingGuidelines = ref(`
Manual testing guidelines placeholder — replace with the official checklist when available.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer porta mi in velit varius, sit amet ultrices mi sodales. Pellentesque ut dui luctus, egestas lacus sed, pellentesque massa. Donec mattis, felis at tempor vulputate, velit erat pulvinar metus, sed hendrerit lorem erat eu risus. Etiam mattis tincidunt mi, nec venenatis nisl pharetra a. Vestibulum eget ligula dui. Vivamus nec neque dignissim, tincidunt lorem id, venenatis nunc. Nullam cursus, ligula vitae tristique facilisis, mauris lectus porttitor libero, vel varius neque ipsum vitae enim. Sed porttitor hendrerit orci id malesuada. Cras vitae diam vitae nisi fringilla maximus. Nulla non libero sed orci suscipit tristique. Duis luctus, ligula at sagittis posuere, neque sapien dignissim ante, at condimentum mi mauris vel nunc.

Curabitur sollicitudin libero eget posuere ultrices. Praesent finibus purus at ligula porta, eget tristique leo vehicula. Sed venenatis urna et metus congue varius. Pellentesque imperdiet sollicitudin tortor vitae tincidunt. Nulla pretium bibendum felis eget blandit. Sed nec risus eros. Phasellus interdum nisl sit amet molestie pretium. Vivamus ut luctus massa, at rhoncus elit. Cras nec arcu eget quam vulputate maximus. Nulla facilisi. Aliquam erat volutpat. Sed hendrerit, massa non condimentum accumsan, sem libero aliquet justo, non faucibus urna justo id nunc. Fusce facilisis id leo a semper. Donec feugiat fringilla iaculis. Ut aliquet tortor leo, in commodo eros porttitor vitae.

Suspendisse interdum sem sit amet erat volutpat posuere. Suspendisse potenti. Maecenas rhoncus risus nec augue vehicula, sit amet accumsan nibh tempus. Quisque non orci a lectus fermentum placerat. Sed eros lectus, lacinia eget lectus quis, pharetra consequat magna. Proin sed volutpat arcu. Nam finibus lorem libero, eget interdum nibh vehicula sit amet. Nullam ut pretium magna. Vivamus vestibulum ex id risus interdum pulvinar. Nulla et eros semper, molestie lorem ac, finibus quam.

In rhoncus, nunc ut fermentum ornare, mi massa condimentum dui, quis dignissim enim nunc nec ipsum. Phasellus vitae urna id leo consectetur fermentum. Sed condimentum arcu mi, in tristique ligula viverra sit amet. Sed ultrices porta sem, congue mollis mauris lobortis et. Mauris pulvinar accumsan nisl. Sed congue hendrerit ipsum in accumsan. Fusce velit urna, dapibus id dolor id, pharetra posuere metus. Pellentesque eget risus ac dolor pretium fringilla. Integer elementum, dui in sollicitudin cursus, ex velit aliquet sem, sed vestibulum nunc elit sed nisi. Maecenas scelerisque erat vel magna scelerisque rhoncus. Duis sed mi at sapien pretium iaculis. Nulla dignissim pretium cursus. Pellentesque consequat, tortor id tristique hendrerit, nisl eros venenatis purus, non condimentum magna ligula eu erat. Etiam congue lacus vitae turpis fermentum sagittis.

Morbi faucibus urna ac ante dapibus, eget faucibus orci ultrices. Etiam cursus, sem ac condimentum porttitor, massa turpis pretium mauris, a convallis nibh lacus a erat. Duis auctor nisi eget eleifend fringilla. Donec et sollicitudin neque. Vestibulum rhoncus, nulla non venenatis facilisis, tellus justo eleifend nunc, sed vestibulum nisi nunc in orci. In aliquet, ligula sed condimentum consequat, arcu magna finibus purus, ac pharetra mi risus vel metus. Sed nec ligula et ipsum volutpat venenatis ac at mi.

Integer vel auctor dui. Maecenas malesuada sapien non turpis molestie, at aliquam nulla placerat. Etiam efficitur ultricies nibh et ultricies. Aliquam erat volutpat. Vivamus auctor tellus sit amet rutrum iaculis. Suspendisse odio tortor, aliquam vel quam at, efficitur fermentum erat. Proin at imperdiet lorem. Pellentesque sit amet nibh non nunc pretium pharetra. Curabitur maximus arcu at lorem dignissim, id tincidunt risus fringilla. Pellentesque et ultrices dui. Sed suscipit, diam quis tincidunt laoreet, massa sem lacinia nisi, non sagittis enim velit id ligula. Suspendisse tristique urna nisl, quis fringilla nibh imperdiet aliquam. Mauris gravida sodales mi, sit amet imperdiet velit.

Aliquam feugiat nibh ut erat auctor ultricies. Duis eget orci erat. Vivamus et egestas erat, consectetur tincidunt orci. Vestibulum tempor dapibus pretium. Integer pharetra ornare sollicitudin. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Cras vestibulum erat sed tincidunt sodales. Donec tristique turpis ac mauris maximus consequat. Donec sed convallis dolor, at venenatis massa. Cras ipsum erat, gravida non nisl non, pellentesque dictum sapien. Aliquam erat volutpat. Cras nec enim ut odio maximus pellentesque sed at erat. Pellentesque non bibendum turpis.

Mauris hendrerit vulputate metus, sit amet ornare felis. Praesent porta lectus id justo malesuada, sed congue sem ornare. Aliquam volutpat feugiat justo, sit amet vulputate ligula consectetur ut. Fusce porttitor felis ac nibh consequat, ac dapibus risus venenatis. Donec id maximus nisl. Integer nec dapibus neque. Sed condimentum justo at mauris finibus, sed feugiat elit facilisis. Vestibulum egestas turpis vitae eros facilisis, in accumsan leo placerat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam tempor elit a malesuada cursus. Nam at turpis malesuada, faucibus sapien ac, feugiat orci. Sed ullamcorper dolor eu justo pulvinar, ut porta nisl tempus. Donec facilisis lorem vitae velit fringilla, eget pretium libero iaculis.
`);

const httpMethods: HttpVerb[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
  "HEAD"
];

const customMethod = ref<HttpVerb>("GET");
const customPath = ref<string>("/api/check/openai");
const customHeaders = ref<string>("Accept: application/json\nContent-Type: application/json");
const customBody = ref<string>(`{
  "example": "value"
}`);
const customExpectStream = ref<boolean>(false);
const customLoading = ref<boolean>(false);
const customError = ref<string | null>(null);

const sessionLabel = computed(() => {
  if (sessionState.value.status === "loading") {
    return "Loading session…";
  }

  if (sessionState.value.status === "guest") {
    return "Signed out";
  }

  const { role, email } = sessionState.value;
  const roleLabel = typeof role === "string" && role.length ? role.toUpperCase() : "UNKNOWN ROLE";
  return `${roleLabel} — ${email ?? "unknown email"}`;
});

function updateRequestMeta(meta: RequestMeta) {
  lastRequestMeta.value = meta;
}

function parseHeaderInput(raw: string) {
  const headers: Record<string, string> = {};
  raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (!key || !rest.length) {
        return;
      }
      headers[key.trim()] = rest.join(":").trim();
    });
  return headers;
}

async function runEndpoint(endpoint: DebugEndpoint) {
  let activePath = endpoint.path;
  let body: Record<string, unknown> | undefined;
  let method = endpoint.method;

  if (endpoint.prepare) {
    try {
      const prepared = await endpoint.prepare();
      if (prepared.path) {
        activePath = prepared.path;
      }
      if (prepared.body) {
        body = prepared.body;
      }
      if (prepared.method) {
        method = prepared.method;
      }
    } catch (error) {
      result.value = error instanceof Error ? `Cancelled: ${error.message}` : "Cancelled";
      return;
    }
  }

  loadingKey.value = endpoint.label;

  updateRequestMeta({
    label: endpoint.label,
    method,
    path: activePath,
    timestamp: new Date().toLocaleTimeString()
  });

  if (method === "LOCAL") {
    const { items } = useCatalogMock({ take: 3 });
    result.value = JSON.stringify(items.value, null, 2);
    loadingKey.value = null;
    return;
  }

  try {
    if (endpoint.stream) {
      const response = await fetch(activePath, {
        method,
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json"
        },
        body: method === "GET" || !body ? undefined : JSON.stringify(body),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.text();
      const parsed = parseSSEPayload(payload);
      result.value = JSON.stringify(parsed, null, 2);
    } else {
      const res = await $fetch(activePath, {
        method,
        body: method === "GET" ? undefined : body
      });
      result.value = JSON.stringify(res, null, 2);
    }
  } catch (error) {
    if (error instanceof Error) {
      result.value = `Error: ${error.message}`;
    } else {
      result.value = `Unknown error: ${JSON.stringify(error)}`;
    }
  } finally {
    loadingKey.value = null;
  }
}

async function runCustomRequest() {
  const trimmedPath = customPath.value.trim();
  customError.value = null;

  if (!trimmedPath.length) {
    customError.value = "Request path is required.";
    return;
  }

  const method = customMethod.value;
  const headers = parseHeaderInput(customHeaders.value);

  if (customExpectStream.value && !headers.Accept) {
    headers.Accept = "text/event-stream";
  }

  const supportsBody = method !== "GET" && method !== "HEAD";
  let parsedBody: Record<string, unknown> | undefined;

  if (supportsBody && customBody.value.trim().length) {
    try {
      parsedBody = JSON.parse(customBody.value);
    } catch (error) {
      customError.value = error instanceof Error ? `Body must be valid JSON: ${error.message}` : "Body must be valid JSON.";
      return;
    }
  }

  customLoading.value = true;
  loadingKey.value = "Custom request";

  updateRequestMeta({
    label: "Custom request",
    method,
    path: trimmedPath,
    timestamp: new Date().toLocaleTimeString()
  });

  try {
    if (customExpectStream.value) {
      const response = await fetch(trimmedPath, {
        method,
        headers,
        body: supportsBody && parsedBody ? JSON.stringify(parsedBody) : undefined,
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.text();
      const parsed = parseSSEPayload(payload);
      result.value = JSON.stringify(parsed, null, 2);
    } else {
      const data = await $fetch(trimmedPath, {
        method,
        headers,
        body: supportsBody ? parsedBody : undefined
      });
      result.value = JSON.stringify(data, null, 2);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    customError.value = message;
    result.value = `Error: ${message}`;
  } finally {
    customLoading.value = false;
    loadingKey.value = null;
  }
}

async function fetchSessionState() {
  try {
    const data = await $fetch<DebugAuthResponse>("/api/debug/auth-check");
    const user = data?.user;

    if (!data || !user) {
      sessionState.value = { status: "guest" };
      return;
    }

    const role = (user.appMetadata?.role ?? user.userMetadata?.role ?? null) as string | null;

    sessionState.value = {
      status: "authenticated",
      role,
      email: (user.email ?? null) as string | null,
    };
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null ? (error as { statusCode?: number }).statusCode : undefined;
    if (statusCode === 401) {
      sessionState.value = { status: "guest" };
      return;
    }

    console.error("Failed to load debug session state", error);
    sessionState.value = { status: "guest" };
  }
}

onMounted(() => {
  fetchSessionState();
});

function parseSSEPayload(payload: string) {
  const blocks = payload
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const tokens: string[] = [];
  const metadata: Record<string, unknown> = {};

  for (const block of blocks) {
    const lines = block.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLine = lines.find((line) => line.startsWith("data:"));

    if (!eventLine || !dataLine) {
      continue;
    }

    const eventName = eventLine.replace("event:", "").trim();
    const dataRaw = dataLine.replace("data:", "").trim();
    let parsedData: unknown = dataRaw;

    try {
      parsedData = JSON.parse(dataRaw);
    } catch (error) {
      console.debug("Non-JSON SSE data", { eventName, dataRaw, error });
    }

    if (eventName === "token") {
      const delta = (parsedData as { delta?: string })?.delta;
      if (typeof delta === "string") {
        tokens.push(delta);
      }
      continue;
    }

    metadata[eventName] = parsedData;
  }

  if (tokens.length) {
    return {
      message: tokens.join(""),
      metadata
    };
  }

  return {
    raw: payload,
    metadata
  };
}
</script>

<template>
  <main class="bg-slate-950 text-slate-100">
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-3">
            <p class="text-sm uppercase tracking-widest text-primary-300">Developer Console</p>
            <div class="flex flex-wrap items-center gap-4">
              <h1 class="text-3xl font-bold text-white">Debug controls</h1>
              <NuxtButton size="lg" color="primary" @click="showGuidelines = true">
                Manual testing guidelines
              </NuxtButton>
            </div>
          </div>
          <NuxtCard class="border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 rounded-full"
                :class="{
                  'bg-amber-400 animate-pulse': sessionState.status === 'loading',
                  'bg-emerald-400': sessionState.status === 'authenticated',
                  'bg-slate-500': sessionState.status !== 'authenticated'
                }"
              />
              <span>{{ sessionLabel }}</span>
            </div>
          </NuxtCard>
        </div>
        <p class="text-sm text-slate-400">
          Quick buttons for hitting Nuxt server endpoints while we wire Supabase-backed catalog + circulation routes.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button
            class="text-xs font-medium uppercase tracking-wide text-primary-300 underline-offset-4 hover:underline"
            type="button"
            @click="fetchSessionState"
          >
            Refresh session
          </button>
        </div>
      </header>

      <ClientOnly>
        <NuxtCard class="border border-white/10 bg-slate-900/70 p-6">
          <template #header>
            <div class="flex items-center justify-between gap-2 text-white">
              <div>
                <p class="text-xs uppercase tracking-widest text-primary-300">Live stream</p>
                <h2 class="text-lg font-semibold">AI recommendation console</h2>
              </div>
              <NuxtBadge color="primary" variant="soft">Streaming SSE</NuxtBadge>
            </div>
          </template>

          <AgentChatPanel />
        </NuxtCard>
      </ClientOnly>

      <div class="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div class="flex w-full max-w-2xl flex-col gap-4 md:max-w-full md:h-[78vh] md:overflow-y-auto md:pr-2 lg:h-[80vh]">
          <div
            v-for="group in groupedEndpoints"
            :key="group.key"
            class="flex flex-col gap-2"
          >
            <div class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>{{ group.key }}</span>
              <span class="text-slate-500">{{ group.endpoints.length }} endpoints</span>
            </div>
            <NuxtCard
              v-for="endpoint in group.endpoints"
              :key="endpoint.label"
              class="flex w-full flex-col gap-2 rounded-lg border border-white/5 bg-slate-900/70 px-4 py-3"
            >
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-white">{{ endpoint.label }}</h2>
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {{ endpoint.method }}
                </span>
              </div>
              <p class="text-sm text-slate-400">
                {{ endpoint.description }}
              </p>
              <NuxtButton
                size="sm"
                color="primary"
                :loading="loadingKey === endpoint.label"
                :disabled="loadingKey !== null"
                @click="runEndpoint(endpoint)"
              >
                Run
              </NuxtButton>
            </NuxtCard>
          </div>

        </div>

        <div class="flex flex-col gap-6 md:sticky md:top-8 md:h-[calc(100vh-6rem)] lg:top-16">
          <NuxtCard class="border border-white/10 bg-slate-900/80 p-4 md:flex-[0_0_auto]">
            <template #header>
              <div class="flex items-center justify-between text-white">
                <div>
                  <p class="text-xs uppercase tracking-widest text-primary-300">Manual testing</p>
                  <h2 class="text-base font-semibold">Custom HTTP request</h2>
                </div>
                <NuxtBadge color="primary" variant="soft">Advanced</NuxtBadge>
              </div>
            </template>

            <form class="space-y-4" @submit.prevent="runCustomRequest">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Method & path</label>
                <div class="flex flex-col gap-2 sm:flex-row">
                  <select
                    v-model="customMethod"
                    class="w-full rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white sm:max-w-[120px]"
                  >
                    <option v-for="method in httpMethods" :key="method" :value="method">
                      {{ method }}
                    </option>
                  </select>
                  <input
                    v-model="customPath"
                    type="text"
                    class="flex-1 rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white"
                    placeholder="/api/loans"
                  >
                </div>
              </div>

              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">Headers</label>
                  <button
                    type="button"
                    class="text-xs text-primary-300 hover:underline"
                    @click="customHeaders = 'Accept: application/json\nContent-Type: application/json'"
                  >
                    Reset defaults
                  </button>
                </div>
                <textarea
                  v-model="customHeaders"
                  rows="3"
                  class="rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white"
                  placeholder="Header: value"
                />
              </div>

              <div class="flex flex-col gap-2">
                <label class="text-xs font-semibold uppercase tracking-wide text-slate-400">JSON body</label>
                <textarea
                  v-model="customBody"
                  rows="5"
                  class="rounded-md border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white font-mono"
                  placeholder="{ }"
                />
                <p class="text-xs text-slate-500">Only used for non-GET/HEAD requests. Must be valid JSON.</p>
              </div>

              <label class="inline-flex items-center gap-2 text-sm text-slate-300">
                <input v-model="customExpectStream" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-slate-900">
                Expect Server-Sent Events (SSE)
              </label>

              <div class="flex flex-wrap items-center gap-3">
                <NuxtButton type="submit" color="primary" :loading="customLoading" :disabled="customLoading">
                  Send request
                </NuxtButton>
                <button
                  type="button"
                  class="text-xs uppercase tracking-wide text-slate-400 hover:text-white"
                  @click="customPath = '/api/loans'; customMethod = 'GET'; customExpectStream = false"
                >
                  Quick preset: Loans list
                </button>
              </div>

              <p v-if="customError" class="text-xs text-rose-300">{{ customError }}</p>
            </form>
          </NuxtCard>

          <NuxtCard class="border border-white/5 bg-slate-900/70 md:flex-1 md:overflow-y-auto">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-white">Result</h2>
                <NuxtButton size="xs" variant="ghost" color="neutral" @click="result = 'Press a button to run a check.'">
                  Clear
                </NuxtButton>
              </div>
              <div v-if="lastRequestMeta" class="mt-2 text-xs text-slate-400">
                Last: {{ lastRequestMeta.method }} {{ lastRequestMeta.path }} ({{ lastRequestMeta.label }} · {{ lastRequestMeta.timestamp }})
              </div>
            </template>

            <pre class="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-950/70 p-4 text-sm text-slate-200">
{{ result }}
            </pre>
          </NuxtCard>
        </div>
      </div>
    </section>

    <NuxtModal
      v-model:open="showGuidelines"
      title="Debug panel guidelines"
      description="Reference notes for manual endpoint testing in this console."
      class="max-w-3xl"
    >
      <template #body>
        <div class="max-h-[70vh] overflow-y-auto rounded-xl bg-slate-950/60 p-4 text-sm text-slate-200">
          <pre class="whitespace-pre-wrap font-sans leading-relaxed">
{{ manualTestingGuidelines }}
          </pre>
        </div>
      </template>
    </NuxtModal>
  </main>
</template>
