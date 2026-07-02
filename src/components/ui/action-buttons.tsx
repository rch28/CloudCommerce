"use client";

import {
  Pencil,
  Trash2,
  Copy,
  Eye,
  Archive,
  RotateCcw,
  Globe,
  History,
  Loader2,
  Edit,
} from "lucide-react";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export type ActionType =
  | "edit"
  | "view"
  | "delete"
  | "copy"
  | "archive"
  | "restore"
  | "publish"
  | "unpublish"
  | "preview"
  | "history"
  | "adjust";

export interface ActionButtonConfig {
  type: ActionType;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ActionButtonsProps {
  actions: ActionButtonConfig[];
}

const iconMap: Record<ActionType, React.ReactNode> = {
  edit: <Edit size={14} />,
  view: <Eye size={14} />,
  delete: <Trash2 size={14} />,
  copy: <Copy size={14} />,
  archive: <Archive size={14} />,
  restore: <RotateCcw size={14} />,
  publish: <Globe size={14} />,
  unpublish: <Globe size={14} />,
  preview: <Eye size={14} />,
  history: <History size={14} />,
  adjust: <RotateCcw size={14} />,
};

const hoverColorMap: Record<ActionType, string> = {
  edit: "hover:text-[#F8FAFC]",
  view: "hover:text-blue-400",
  delete: "hover:text-rose-400",
  copy: "hover:text-cyan-400",
  archive: "hover:text-amber-400",
  restore: "hover:text-emerald-400",
  publish: "hover:text-emerald-400",
  unpublish: "hover:text-amber-400",
  preview: "hover:text-blue-400",
  history: "hover:text-[#F8FAFC]",
  adjust: "hover:text-[#F8FAFC]",
};

export default function ActionButtons({ actions }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {actions.map((action, idx) => (
        <Tooltip key={`${action.type}-${idx}`}>
          <TooltipTrigger asChild>
            <button
              onClick={action.onClick}
              disabled={action.disabled}
              className={`rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-[#1E293B] ${hoverColorMap[action.type]} disabled:opacity-30 cursor-pointer`}
            >
              {action.loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                iconMap[action.type]
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {action.tooltip}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
