import { useState } from "react";
import { useDebounce } from "./useDebounce";

export function useSearch(delay = 300) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, delay);
  return { search, setSearch, debouncedSearch };
}
