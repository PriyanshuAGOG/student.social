"use client"

/**
 * VaultTab Component
 * 
 * Resource library with advanced filtering by type, tags, and search.
 * Supports downloading and organizing learning materials.
 */

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Download, FolderOpen } from "lucide-react"
import { VaultTabProps } from "../types"

export function VaultTab({
  resources,
  resourceFilter,
  setResourceFilter,
  selectedTag,
  setSelectedTag,
  resourceSearch,
  setResourceSearch,
  filteredResources,
  availableTypes,
  availableTags,
  handleOpenVault,
}: VaultTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pod Resources</h3>
          <p className="text-sm text-muted-foreground">Filter by type, tag, or search</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search titles or descriptions"
            value={resourceSearch}
            onChange={(e) => setResourceSearch(e.target.value)}
            className="h-9 w-56"
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Type:</span>
            {availableTypes.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={resourceFilter === f ? "secondary" : "outline"}
                className="h-8 px-3"
                onClick={() => setResourceFilter(f)}
              >
                {f === "all" ? "All" : f.toUpperCase()}
              </Button>
            ))}
          </div>
          {availableTags.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Tags:</span>
              {availableTags.slice(0, 6).map((tag) => (
                <Button
                  key={tag}
                  size="sm"
                  variant={selectedTag === tag ? "secondary" : "outline"}
                  className="h-8 px-3"
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag === "all" ? "All" : tag}
                </Button>
              ))}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setResourceFilter("all")
              setSelectedTag("all")
              setResourceSearch("")
            }}
          >
            Clear
          </Button>
          <Button onClick={handleOpenVault} variant="outline" className="bg-transparent">
            <FolderOpen className="w-4 h-4 mr-2" />
            View All
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.length === 0 && <div className="text-sm text-muted-foreground">No resources yet. Add some in the vault.</div>}
        {filteredResources.map((resource) => (
          <Card key={resource.$id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <img
                  src={resource.thumbnail || resource.fileUrl || "/placeholder.svg"}
                  alt={resource.title}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{resource.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By {resource.authorId || ""}</span>
                    <span>{resource.type || resource.category || ""}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(Array.isArray(resource.tags)
                      ? resource.tags
                      : typeof resource.tags === "string"
                        ? resource.tags.split(",")
                        : []
                    ).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px]">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{resource.downloads || 0} downloads</span>
                    <Button size="sm" variant="outline" className="bg-transparent">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
