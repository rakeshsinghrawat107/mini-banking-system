#pragma once
// Module: Database Abstraction Layer (Sumit Singh Mahar - DBMS Developer)
// Wraps PostgreSQL client library (libpq) with prepared statements and RAII transactions.

#include <libpq-fe.h>
#include <memory>
#include <string>
#include <vector>

#include "common.hpp"

namespace banking {

struct DbError : std::runtime_error {
    std::string sqlstate;
    DbError(const std::string& msg, const std::string& state)
        : std::runtime_error(msg), sqlstate(state) {}
};

class Db {
public:
    explicit Db(const std::string& connection_string);
    ~Db();
    Db(const Db&) = delete;
    Db& operator=(const Db&) = delete;

    // Runs a parameterized query with $1, $2 placeholders (prevents SQL injection)
    Rows query(const std::string& sql, const std::vector<std::string>& params = {});

    // Runs multiple raw SQL statements (for schema & seed scripts)
    void run_script(const std::string& sql);

private:
    PGconn* conn_{nullptr};
};

// RAII Transaction: BEGIN on creation, COMMIT on commit(), ROLLBACK in destructor if uncommitted
class Transaction {
public:
    explicit Transaction(Db& db) : db_(db) { db_.query("BEGIN"); }
    ~Transaction() {
        if (!done_) {
            try { db_.query("ROLLBACK"); } catch (...) {}
        }
    }
    void commit() { db_.query("COMMIT"); done_ = true; }
    void rollback() { db_.query("ROLLBACK"); done_ = true; }

private:
    Db& db_;
    bool done_{false};
};

void set_connection_string(const std::string& conn_str);
const std::string& db_connection_string();
Db& db(); // Thread-local connection per thread

void init_database();
void audit(Db& d, const std::string& op, const std::string& action, const std::string& details = "");

} // namespace banking
