// ==============================================================================
// Mini Banking Transaction System with Concurrency Control & Crash Recovery
// Graphic Era Hill University - Team GHOST
// Lead: Rohit Negi | DBMS: Sumit | Ops: Priyanka | OS/Recovery: Mohd Faiz
// ==============================================================================

#include <cstdlib>
#include <iostream>
#include <string>

#include "db.hpp"
#include "demos.hpp"
#include "routes.hpp"

int main(int argc, char** argv) {
    std::string mode = argc > 1 ? argv[1] : "";

    // Self-contained demos that do not require external DB setup
    if (mode == "--demo-race") {
        return banking::run_race_demo();
    }
    if (mode == "--demo-deadlock") {
        return banking::run_deadlock_demo();
    }

    const char* url = std::getenv("DATABASE_URL");
    if (!url) {
        std::cerr << "========================================================\n";
        std::cerr << "Notice: DATABASE_URL environment variable is not set.\n";
        std::cerr << "To connect to PostgreSQL / Supabase, run:\n";
        std::cerr << "  export DATABASE_URL='postgresql://...'\n";
        std::cerr << "\nYou can still run standalone OS demos:\n";
        std::cerr << "  ./banking --demo-race\n";
        std::cerr << "  ./banking --demo-deadlock\n";
        std::cerr << "========================================================\n";
        return 1;
    }
    banking::set_connection_string(url);

    try {
        if (mode == "--init") {
            banking::init_database();
            std::cout << "Database successfully initialized! (Schema 'banking' + demo accounts ready)\n";
            return 0;
        }

        if (mode == "--demo-crash") {
            return banking::run_crash_demo();
        }

        const char* port_str = std::getenv("PORT");
        int port = port_str ? std::atoi(port_str) : 8080;

        std::cout << "========================================================\n";
        std::cout << "Mini Banking Transaction System Server\n";
        std::cout << "Institution: Graphic Era Hill University | Team: GHOST\n";
        std::cout << "Connecting to database...\n";
        std::cout << "========================================================\n";

        banking::run_server(port);
    } catch (const std::exception& e) {
        std::cerr << "Fatal Error: " << e.what() << "\n";
        return 1;
    }

    return 0;
}
