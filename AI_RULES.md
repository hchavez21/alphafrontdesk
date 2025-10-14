# AI Studio Application Rules

This document outlines the technical stack and guidelines for using libraries within this application.

## Tech Stack

*   **React**: For building the user interface with a component-based architecture.
*   **TypeScript**: Ensures type safety and improves code maintainability.
*   **Vite**: The build tool for a fast development experience.
*   **Tailwind CSS**: Utility-first CSS framework for styling components efficiently and responsively.
*   **shadcn/ui**: A collection of re-usable components built with Radix UI and Tailwind CSS.
*   **Radix UI**: Low-level UI primitives for building accessible design systems.
*   **lucide-react**: A library for beautiful and customizable open-source icons.
*   **React Router**: For declarative routing within the application (currently handled by conditional rendering, but ready for `react-router-dom` if needed).
*   **Local Storage**: Used for client-side data persistence, such as user authentication and log entries.
*   **Date/Time Formatting**: Utilizes `Intl.DateTimeFormat` for internationalized date and time display.

## Library Usage Rules

*   **UI Components**: Always prioritize using components from `shadcn/ui`. If a specific component is not available or requires significant deviation from its design, create a new, small, and focused component.
*   **Styling**: All styling should be done using **Tailwind CSS** classes. Avoid writing custom CSS in `index.css` or other `.css` files unless absolutely necessary for global styles not covered by Tailwind.
*   **Icons**: Use icons from the `lucide-react` library.
*   **Routing**: For navigation between different views/pages, the application currently uses conditional rendering. If more complex routing is required, `react-router-dom` should be integrated, and routes should be maintained in `src/App.tsx`.
*   **State Management**: React's built-in `useState`, `useEffect`, and `useMemo` hooks are preferred for managing component and application state.
*   **Data Persistence**: For client-side data storage, `localStorage` is used. For server-side data or authentication, consider integrating Supabase.
*   **File Structure**:
    *   Source code resides in the `src` folder.
    *   Pages are located in `src/pages/`.
    *   Reusable components are in `src/components/`.
    *   New components should always be created in their own dedicated files.