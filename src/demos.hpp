#pragma once
// Live Demonstration Modules for Presentations & Viva
// Graphic Era Hill University - Team GHOST

namespace banking {

// Live Demo 1: Race conditions under concurrent balance modifications
int run_race_demo();

// Live Demo 2: Circular wait deadlocks and sorted lock prevention
int run_deadlock_demo();

// Live Demo 3: Simulated crash mid-transfer and WAL ARIES recovery
int run_crash_demo();

} // namespace banking
