import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Input } from "./input";

const SearchInput = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      <Input
        ref={ref}
        className={cn("pl-12", className)}
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
