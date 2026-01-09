/**
 * Returns a data URI for a placeholder image
 * This prevents infinite loops when images fail to load
 * and avoids needing files in the public folder
 */
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg==';

/**
 * Handler for image onError events that prevents infinite loops
 * Hides the image if it fails to load
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>): void {
    const target = e.target as HTMLImageElement;
    // If already using data URI or placeholder failed, hide the image
    if (target.src.includes('data:image') || target.dataset.errorHandled === 'true') {
        target.style.display = 'none';
        return;
    }
    // Mark as handled and hide to prevent infinite loop
    target.dataset.errorHandled = 'true';
    target.style.display = 'none';
}
