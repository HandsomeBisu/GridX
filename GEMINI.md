# GridX Project Context

## Overview
GridX is a real-time multiplayer online board game inspired by Monopoly and Blue Marble (Burumaru). It is built using **React (Vite)**, **TypeScript**, and **Firebase (Firestore)** for real-time data synchronization. The game features a 40-cell board, economy system, property management, and special events.

## Technology Stack
-   **Frontend:** React 19, TypeScript, Vite
-   **Styling:** Tailwind CSS (with custom colors like `gold`, `luxury-panel`)
-   **Icons:** Lucide React
-   **Backend / Database:** Firebase Firestore (Realtime updates via `onSnapshot`)
-   **State Management:** React Local State + Firestore Subscription

## Game Rules & Mechanics
### Basics
-   **Players:** 2-4 Players.
-   **Board:** 11x11 Grid (40 Cells total).
-   **Movement:** 2x 6-sided dice. Double does not grant extra turn (unless specified).
-   **Currency:** KRW (Won). Starting Balance: 2,500,000.
-   **Winning:** Last player standing (others bankrupt) or highest assets when game ends (if time limit implemented).

### Economy
-   **Lands:** Cities/Countries. Can build Villa, Building, Hotel.
-   **Tolls:** Rent increases with buildings.
    -   Land: 20% of price
    -   Villa: +150%
    -   Building: +250%
    -   Hotel: +450%
-   **Sell:** 100% refund of total investment (Land + Buildings).
-   **Bankruptcy:** Declared manually or automatically when unable to pay. Assets are wiped.

### Special Cells
-   **Start (0):** Salary (+200,000) on passing/landing.
-   **Island (20):** Jail. Stuck for 3 turns. Escape by rolling doubles (if implemented) or paying 200,000.
-   **Space Travel (10):** Teleport to any cell on next turn.
-   **Welfare Fund (30/38):**
    -   **Fund (30):** Donate to the pot.
    -   **Receive (38):** Claim the accumulated pot.
-   **Golden Keys (2, 7, 12, 17, 22, 35):** Random effects (Money +/- , Move +/-).
-   **Vehicles (Concorde, Queen Elizabeth, Columbia):** Fixed toll assets.

## Project Structure
### Core Directories
-   `components/game/`: Core game components.
    -   `GameBoard.tsx`: The 11x11 grid renderer.
    -   `GameCenterPanel.tsx`: Dice, turn controls, center UI.
    -   `GameSidebar.tsx`: Player list, chat, logs.
    -   `GameEventModal.tsx`: Interaction handler (Buy, Sell, Toll).
-   `components/screens/`: Top-level screens.
    -   `GameScreen.tsx`: Main game controller (Subscriptions, Audio, Animations).
    -   `Lobby.tsx`: Room list and creation.
-   `services/gameService.ts`: **CRITICAL**. Contains all game logic and Firestore transactions.
-   `data/`: Static configurations.
    -   `boardData.ts`: Cell definitions (Name, Price, Color).
    -   `goldenKeyData.ts`: Chance card effects.
-   `types.ts`: TypeScript interfaces for `Player`, `GameRoom`, `BoardCell`, `GameAction`.

### Key Data Models
-   **GameRoom:** Stores `players`, `ownership`, `chat`, `status`.
-   **Player:** `position`, `balance`, `assets`, `islandTurns`.
-   **LandOwnership:** Maps `cellId` to `ownerId` and `BuildingState`.

## Development Notes
-   **Styling:** Uses absolute positioning for players on the grid.
-   **Animation:** `visualPositions` state separates render position from logical `position` for smooth movement.
-   **Concurrency:** Firestore Transactions are used for all critical game state changes to prevent race conditions.
-   **Audio:** `utils/sound.ts` manages sound effects.

## Common Tasks
-   **Adding a new Cell Type:** Update `types.ts`, `boardData.ts`, and `GameBoard.tsx` rendering logic.
-   **Modifying Economy:** Adjust `RATIOS` in `gameService.ts`.
-   **New Features:** Add to `GameAction` type and handle in `GameScreen.tsx` effect loop.
