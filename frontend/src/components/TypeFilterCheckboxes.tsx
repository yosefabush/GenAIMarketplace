import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type ContentTypeValue = "agent" | "prompt" | "mcp" | "workflow" | "docs" | "skill"

export interface TypeFilterCheckboxesProps {
  selectedTypes: ContentTypeValue[]
  onTypesChange: (types: ContentTypeValue[]) => void
  className?: string
}

const contentTypes: { value: ContentTypeValue; label: string }[] = [
  { value: "agent", label: "Agents" },
  { value: "prompt", label: "Prompts" },
  { value: "mcp", label: "MCPs" },
  { value: "workflow", label: "Workflows" },
  { value: "docs", label: "Docs" },
  { value: "skill", label: "Skills" },
]

export function TypeFilterCheckboxes({
  selectedTypes,
  onTypesChange,
  className,
}: TypeFilterCheckboxesProps) {
  const handleCheckChange = (type: ContentTypeValue, checked: boolean) => {
    if (checked) {
      onTypesChange([...selectedTypes, type])
    } else {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">Type</h3>
      <div className="space-y-2">
        {contentTypes.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type.value}`}
              checked={selectedTypes.includes(type.value)}
              onCheckedChange={(checked) =>
                handleCheckChange(type.value, checked === true)
              }
            />
            <Label
              htmlFor={`type-${type.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {type.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
