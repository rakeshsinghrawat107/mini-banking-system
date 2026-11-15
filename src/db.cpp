// Module: Database Abstraction Implementation (Sumit Singh Mahar - DBMS Developer)
#include "db.hpp"

#include <cstdlib>
#include <fstream>
#include <iostream>
#include <sstream>

namespace banking {

Db::Db(const std::string& connection_string) {
    conn_ = PQconnectdb(connection_string.c_str());
    if (PQstatus(conn_) != CONNECTION_OK) {
        std::string err = PQerrorMessage(conn_);
        PQfinish(conn_);
        conn_ = nullptr;
        throw DbError("Cannot connect to PostgreSQL / Supabase: " + err, "");
    }
    // Set default schema search path to banking
    run_script("SET search_path = banking, public, extensions");
    const char* tz = std::getenv("BANK_TZ");
    run_script(std::string("SET TIME ZONE '") + (tz ? tz : "Asia/Kolkata") + "'");
}

Db::~Db() {
    if (conn_) {
        PQfinish(conn_);
    }
}

static void throw_if_failed(PGresult* res) {
    ExecStatusType status = PQresultStatus(res);
    if (status == PGRES_TUPLES_OK || status == PGRES_COMMAND_OK) return;
    const char* state = PQresultErrorField(res, PG_DIAG_SQLSTATE);
    const char* text  = PQresultErrorField(res, PG_DIAG_MESSAGE_PRIMARY);
    DbError error(text ? text : "Database query error", state ? state : "");
    PQclear(res);
    throw error;
}

Rows Db::query(const std::string& sql, const std::vector<std::string>& params) {
    std::vector<const char*> values;
    values.reserve(params.size());
    for (const auto& p : params) {
        values.push_back(p.c_str());
    }

    PGresult* res = PQexecParams(conn_, sql.c_str(), static_cast<int>(values.size()), nullptr,
                                 values.data(), nullptr, nullptr, 0);
    throw_if_failed(res);

    Rows rows;
    int num_rows = PQntuples(res);
    int num_fields = PQnfields(res);
    rows.reserve(num_rows);

    for (int i = 0; i < num_rows; ++i) {
        Row row;
        for (int j = 0; j < num_fields; ++j) {
            const char* col_name = PQfname(res, j);
            row[col_name] = PQgetisnull(res, i, j) ? "" : PQgetvalue(res, i, j);
        }
        rows.push_back(std::move(row));
    }
    PQclear(res);
    return rows;
}

void Db::run_script(const std::string& sql) {
    PGresult* res = PQexec(conn_, sql.c_str());
    throw_if_failed(res);
    PQclear(res);
}

static std::string g_connection_string;

void set_connection_string(const std::string& conn_str) {
    g_connection_string = conn_str;
}

const std::string& db_connection_string() {
    return g_connection_string;
}

Db& db() {
    thread_local std::unique_ptr<Db> connection;
    if (!connection) {
        connection = std::make_unique<Db>(g_connection_string);
    }
    return *connection;
}

void audit(Db& d, const std::string& op, const std::string& action, const std::string& details) {
    try {
        d.query("INSERT INTO audit_log (operator, action, details) VALUES ($1, $2, $3)",
                {op, action, details});
    } catch (...) {}
}

static std::string read_file(const std::string& path) {
    std::ifstream file(path);
    if (!file) throw std::runtime_error("Cannot open file: " + path);
    std::stringstream buffer;
    buffer << file.rdbuf();
    return buffer.str();
}

void init_database() {
    db().run_script(read_file("sql/schema.sql"));
    db().run_script(read_file("sql/seed.sql"));
    try {
        db().run_script(read_file("sql/roles.sql"));
    } catch (...) {}
}

} // namespace banking
