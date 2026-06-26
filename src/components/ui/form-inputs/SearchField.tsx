import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "../input";

interface SearchFieldProps {
  searchQuery: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  setSearchQuery: (value: string) => void;
  setPage: (page: number) => void;
}

const SearchField = ({
  searchQuery,
  setSearchQuery,
  setPage,
  placeholder = "Search ....",
  className = "",
  inputClassName = "",
}: SearchFieldProps) => {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setPage(1);
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-[#F8FAFC] outline-none ring-0 hover:ring-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0  placeholder:text-muted-foreground  ${inputClassName}`}
      />
      {searchQuery?.length > 1 && (
        <button
          onClick={() => {
            setSearchQuery("");
            setPage(1);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 transition-colors hover:text-red-500 cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchField;
