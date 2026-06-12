import React from 'react';
import { createRoot } from 'react-dom/client';
import Map from './map';

/**
 * Initialize the QuestFlow Map.
 *
 * @param {string} elementId The ID of the element to mount the map into.
 * @param {object} config Configuration for the map.
 */
export const init = (elementId: string, config: object) => {
    const container = document.getElementById(elementId);
    if (container) {
        const root = createRoot(container);
        root.render(<Map />);
    }
};
