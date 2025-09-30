import { Attorney } from "@/types/user";

export interface GroupedSelectOption {
  group: string;
  items: string[];
}

/**
 * Transforms attorney data into grouped select format
 * Groups attorneys by their practice areas
 *
 * @param attorneys - Array of attorney objects
 * @returns Array of grouped options for select component
 */
export function transformAttorneyDataToGroupedSelect(
  attorneys: Attorney[]
): GroupedSelectOption[] {
  // Create a map to group attorneys by practice area
  const practiceAreaMap = new Map<string, string[]>();

  // Iterate through each attorney
  attorneys.forEach((attorney) => {
    const fullName = `${attorney.first_name} ${attorney.last_name}`;

    // Get practice areas for this attorney
    const practiceAreas = attorney.unsafe_metadata.practiceAreas || [];

    // Add this attorney to each of their practice areas
    practiceAreas.forEach((practiceArea) => {
      if (!practiceAreaMap.has(practiceArea)) {
        practiceAreaMap.set(practiceArea, []);
      }
      practiceAreaMap.get(practiceArea)!.push(fullName);
    });
  });

  // Convert map to array format
  const groupedOptions: GroupedSelectOption[] = [];

  practiceAreaMap.forEach((attorneys, practiceArea) => {
    groupedOptions.push({
      group: practiceArea,
      items: attorneys,
    });
  });

  // Sort groups alphabetically by practice area name
  groupedOptions.sort((a, b) => a.group.localeCompare(b.group));

  // Sort items within each group alphabetically by attorney name
  groupedOptions.forEach((group) => {
    group.items.sort((a, b) => a.localeCompare(b));
  });

  return groupedOptions;
}
