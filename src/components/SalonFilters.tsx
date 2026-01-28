import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Clock, 
  Star, 
  ArrowUpDown,
  Search,
  SlidersHorizontal
} from "lucide-react";
import type { Salon } from "@/hooks/useSalons";

type SortOption = "distance" | "rating" | "wait_time" | "open";

interface SalonFiltersProps {
  onSortChange: (sort: SortOption) => void;
  onRadiusChange: (radius: number) => void;
  onSearchChange: (search: string) => void;
  currentSort: SortOption;
  currentRadius: number;
}

export function SalonFilters({
  onSortChange,
  onRadiusChange,
  onSearchChange,
  currentSort,
  currentRadius,
}: SalonFiltersProps) {
  const [search, setSearch] = useState("");

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search salons..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Sort By */}
        <Select value={currentSort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">
              <span className="flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Nearest
              </span>
            </SelectItem>
            <SelectItem value="rating">
              <span className="flex items-center gap-2">
                <Star className="w-3 h-3" /> Highest Rated
              </span>
            </SelectItem>
            <SelectItem value="wait_time">
              <span className="flex items-center gap-2">
                <Clock className="w-3 h-3" /> Shortest Wait
              </span>
            </SelectItem>
            <SelectItem value="open">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-3 h-3" /> Open Now
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Radius */}
        <Select value={currentRadius.toString()} onValueChange={(v) => onRadiusChange(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <MapPin className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Within 3 km</SelectItem>
            <SelectItem value="5">Within 5 km</SelectItem>
            <SelectItem value="10">Within 10 km</SelectItem>
            <SelectItem value="25">Within 25 km</SelectItem>
            <SelectItem value="50">Within 50 km</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
