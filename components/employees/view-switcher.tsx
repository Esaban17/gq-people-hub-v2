"use client";

import { LayoutGrid, List, Network } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type ViewMode = "grid" | "list" | "chart";

interface ViewSwitcherProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
}

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    return (
        <ToggleGroup
            type="single"
            value={currentView}
            onValueChange={(value: string) => value && onViewChange(value as ViewMode)}
            className="justify-start border rounded-lg p-1"
        >
            <ToggleGroupItem value="grid" aria-label="Vista Cuadricula" size="sm">
                <LayoutGrid className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium">Tarjetas</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista Lista por Área" size="sm">
                <List className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium">Por Área</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="chart" aria-label="Vista Organigrama" size="sm">
                <Network className="h-4 w-4 mr-2" />
                <span className="text-xs font-medium">Organigrama</span>
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
