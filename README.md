# Calder Creator

An interactive web application for designing balanced kinetic mobiles, inspired by the sculptures of Alexander Calder.

https://github.com/user-attachments/assets/365a1b5c-30de-4057-a5a4-0cac66e094fd

**[Try the live demo](https://calder-creator.vercel.app/)**

---

## Overview

Calder Creator lets you design, visualize, and balance hanging mobile sculptures in real-time 3D. The physics engine simulates torque and tilt, giving you instant visual feedback as you adjust weights, arm lengths, and pivot positions. When you're happy with your design, export the build specifications to construct a real mobile.

---

## Features

- **Interactive 3D Canvas** — Orbit, zoom, and pan around your mobile with intuitive camera controls
- **Multiple Weight Shapes** — Choose from spheres, cubes, cylinders, disks, organic blobs, or 3D models (Earth, Jupiter, House)
- **Tree-Based Structure** — Expand any weight into a balanced arm with two new weights, building complexity layer by layer
- **Draggable Pivot Points** — Fine-tune balance by dragging the yellow ring on any arm
- **Auto-Balance** — One-click algorithm that calculates optimal pivot positions for perfect equilibrium
- **Real-Time Physics** — Arms tilt based on torque imbalance with color-coded feedback (green = balanced, red = unbalanced)
- **Export/Import** — Save your designs as JSON files and load them later
- **Build Specifications** — Get real-world measurements, wire gauge recommendations, and material suggestions
- **Unit Toggle** — Switch between metric (cm/g) and imperial (in/oz) units
- **Preset Templates** — Start from curated designs like "Calder Pastels," "Cosmic Dance," or "Rainbow Cascade"

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/calder-creator.git
cd calder-creator

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## How to Use

### Camera Controls

| Action | Control |
|--------|---------|
| Orbit | Left-click and drag |
| Zoom | Scroll wheel |
| Pan | Right-click and drag |

Lock the camera using the toolbar button when you need precise pivot dragging.

### Building Your Mobile

1. **Select** — Click any weight or arm to select it and edit its properties in the side panel
2. **Expand** — Double-click a weight to transform it into an arm with two new weights
3. **Adjust Pivot** — Drag the yellow ring on any arm to shift the balance point
4. **Delete** — Select an element and press `Delete` or `Backspace` to remove it

### Tips

- Use the **Auto-Balance** button to instantly find optimal pivot positions
- Switch between **Flat View** and **3D View** to see your mobile from different perspectives
- Load a **Preset** to explore different design possibilities
- Export your design as JSON to save and share your creations

---

## Physics

The balance simulation is based on classical mechanics, specifically the principle of torque equilibrium.

### Torque Balance

A balanced mobile arm requires equal torque on both sides of the pivot point. Torque is calculated as:

```
τ = m × d
```

Where:
- `τ` (tau) is the torque
- `m` is the mass (including all weights in that subtree)
- `d` is the distance from the pivot point

For an arm to hang level:

```
m_left × d_left = m_right × d_right
```

### Tilt Calculation

When torques are unequal, the arm tilts. The simulation calculates tilt angle as follows:

```javascript
netTorque = leftTorque - rightTorque
totalTorque = leftTorque + rightTorque
imbalance = netTorque / totalTorque  // ranges from -1 to 1
tiltAngle = imbalance × MAX_TILT × 2  // capped at ±30°
```

A positive net torque tilts the left side down; negative tilts the right side down.

### Balance Ratio

The balance ratio provides visual feedback on how close an arm is to equilibrium:

```javascript
balanceRatio = 1 - |leftTorque - rightTorque| / totalTorque
```

| Balance Ratio | Visual Color | Meaning |
|---------------|--------------|---------|
| > 90% | Green | Nearly perfect balance |
| 50% - 90% | Yellow | Moderate imbalance |
| < 50% | Red | Severe imbalance |

### Auto-Balance Algorithm

The auto-balance feature calculates optimal pivot positions using a bottom-up traversal of the mobile tree. For each arm, the optimal pivot position is:

```
pivotPosition = m_right / (m_left + m_right)
```

This formula positions the pivot such that:
- Heavier side gets a shorter lever arm
- Lighter side gets a longer lever arm
- Torques balance exactly

The algorithm processes child arms before parent arms, ensuring accurate mass calculations for each subtree.

### Subtree Mass

Each arm supports the total mass of everything hanging below it. The subtree mass is calculated recursively:

```javascript
function calculateSubtreeMass(node) {
  if (node is a weight) return node.mass
  if (node is an arm) return mass(leftChild) + mass(rightChild)
}
```

---

## Building a Real Mobile

The Build Specs panel provides everything you need to construct a physical version of your design.

### Unit Conversions

| Scene Unit | Real World |
|------------|------------|
| 1 length unit | 10 cm |
| 1 mass unit | 50 g |

### Wire Gauge Recommendations

| Total Weight | Recommended Wire |
|--------------|------------------|
| < 100g | 24 AWG (0.5mm) |
| 100-250g | 22 AWG (0.6mm) |
| 250-500g | 20 AWG (0.8mm) |
| 500g-1kg | 18 AWG (1.0mm) |
| > 1kg | 16 AWG (1.3mm) |

### Arm Material Suggestions

| Arm Length | Material | Diameter |
|------------|----------|----------|
| ≤ 30cm | Wooden dowel or brass rod | 3-4mm |
| 30-60cm | Wooden dowel or aluminum rod | 5-6mm |
| > 60cm | Wooden dowel or aluminum tube | 8-10mm |

---

## Tech Stack

- **React 18** — UI framework
- **Three.js** — 3D graphics library
- **React Three Fiber** — React renderer for Three.js
- **Drei** — Useful helpers for React Three Fiber
- **Zustand** — Lightweight state management
- **Vite** — Build tool and dev server

---

## Project Structure

```
src/
├── components/       # 3D scene components (Arm, Weight, Mobile, etc.)
├── config/           # Configuration files (presets, models, units)
├── models/           # Data structures and tree operations
├── physics/          # Balance solver and torque calculations
├── store/            # Zustand state management
├── styles/           # CSS styles
└── ui/               # 2D UI components (panels, modals)
```

### Key Files

| File | Description |
|------|-------------|
| `src/physics/balanceSolver.js` | Torque calculations and tilt physics |
| `src/models/mobileTree.js` | Tree data structure and operations |
| `src/store/mobileStore.js` | Global state and actions |
| `src/config/units.js` | Unit conversions and recommendations |
| `src/config/presets.js` | Pre-built mobile templates |

---

## License

MIT

