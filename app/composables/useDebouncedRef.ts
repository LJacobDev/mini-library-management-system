import { onScopeDispose, ref, watch } from "vue";
import type { Ref } from "vue";

export function useDebouncedRef<T>(source: Ref<T>, delay = 300) {
  const debounced = ref(source.value) as Ref<T>;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  watch(
    source,
    (value) => {
      if (delay <= 0) {
        clear();
        debounced.value = value;
        return;
      }

      clear();
      timeout = setTimeout(() => {
        debounced.value = value;
        timeout = null;
      }, delay);
    },
    { immediate: true }
  );

  onScopeDispose(clear);

  return debounced;
}
