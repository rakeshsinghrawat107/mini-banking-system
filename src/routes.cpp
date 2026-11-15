// Module: HTTP REST API Implementation (Rohit Negi - Team Lead & Integration)
#include "routes.hpp"

#include <iostream>
#include <httplib.h>
#include <nlohmann/json.hpp>

#include "banking.hpp"
#include "recovery.hpp"

using json = nlohmann::json;

namespace banking {

static json to_json_rows(const Rows& rows) {
    json arr = json::array();
    for (const auto& r : rows) {
        arr.push_back(r);
    }
    return arr;
}

static json parse_body(const httplib::Request& req) {
    json body = json::parse(req.body, nullptr, false);
    if (body.is_discarded() || !body.is_object()) {
        throw HttpError(400, "Request body must be a valid JSON object");
    }
    return body;
}

void run_server(int port) {
    httplib::Server server;

    // OS Concept: Thread Pool pattern allocating 8 concurrent worker threads
    server.new_task_queue = [] { return new httplib::ThreadPool(8); };

    server.set_default_headers({
        {"Access-Control-Allow-Origin", "*"},
        {"Access-Control-Allow-Methods", "GET, POST, OPTIONS"},
        {"Access-Control-Allow-Headers", "Content-Type, Authorization"},
        {"Content-Type", "application/json"}
    });

    server.Options(R"(/api/.*)", [](const httplib::Request&, httplib::Response& res) {
        res.status = 204;
    });

    // Helper wrapper for standardized error handling
    auto api_handler = [](auto func) {
        return [func](const httplib::Request& req, httplib::Response& res) {
            try {
                json result = func(req);
                res.status = 200;
                res.set_content(result.dump(), "application/json");
            } catch (const HttpError& e) {
                res.status = e.status;
                res.set_content(json{{"error", e.what()}}.dump(), "application/json");
            } catch (const std::exception& e) {
                res.status = 500;
                res.set_content(json{{"error", e.what()}}.dump(), "application/json");
            }
        };
    };

    // 1. Health check & System info
    server.Get("/", [](const httplib::Request&, httplib::Response& res) {
        json info = {
            {"system", "Mini Banking Transaction System"},
            {"version", "1.0.0"},
            {"institution", "Graphic Era Hill University"},
            {"team", "GHOST"},
            {"status", "online"}
        };
        res.set_content(info.dump(2), "application/json");
    });

    // 2. Create Account
    server.Post("/api/accounts", api_handler([](const httplib::Request& req) {
        json body = parse_body(req);
        std::string name = body.value("holder_name", "");
        double initial = body.value("initial_deposit", 0.0);
        std::string email = body.value("email", "");

        AccountInfo acc = create_account(db(), name, initial, email);
        return json{
            {"account_number", acc.account_number},
            {"holder_name", acc.holder_name},
            {"balance", acc.balance},
            {"status", acc.status},
            {"created_at", acc.created_at}
        };
    }));

    // 3. Get Account Information
    server.Get(R"(/api/accounts/([^/]+))", api_handler([](const httplib::Request& req) {
        std::string acc_no = req.matches[1];
        AccountInfo acc = get_account(db(), acc_no);
        return json{
            {"account_number", acc.account_number},
            {"holder_name", acc.holder_name},
            {"email", acc.email},
            {"balance", acc.balance},
            {"status", acc.status},
            {"created_at", acc.created_at}
        };
    }));

    // 4. Deposit Money
    server.Post("/api/accounts/deposit", api_handler([](const httplib::Request& req) {
        json body = parse_body(req);
        std::string acc_no = body.value("account_number", "");
        double amount = body.value("amount", 0.0);

        TransactionRecord rec = deposit(db(), acc_no, amount);
        return json{
            {"status", "success"},
            {"txn_ref", rec.txn_ref},
            {"account", rec.to_account},
            {"amount", rec.amount},
            {"current_balance", get_balance(db(), acc_no)}
        };
    }));

    // 5. Withdraw Money
    server.Post("/api/accounts/withdraw", api_handler([](const httplib::Request& req) {
        json body = parse_body(req);
        std::string acc_no = body.value("account_number", "");
        double amount = body.value("amount", 0.0);

        TransactionRecord rec = withdraw(db(), acc_no, amount);
        return json{
            {"status", "success"},
            {"txn_ref", rec.txn_ref},
            {"account", rec.from_account},
            {"amount", rec.amount},
            {"current_balance", get_balance(db(), acc_no)}
        };
    }));

    // 6. Fund Transfer (Atomic, Concurrency-controlled, Deadlock-safe)
    server.Post("/api/accounts/transfer", api_handler([](const httplib::Request& req) {
        json body = parse_body(req);
        std::string from_acc = body.value("from_account", "");
        std::string to_acc = body.value("to_account", "");
        double amount = body.value("amount", 0.0);

        TransactionRecord rec = transfer(db(), from_acc, to_acc, amount);
        return json{
            {"status", "success"},
            {"txn_ref", rec.txn_ref},
            {"from_account", rec.from_account},
            {"to_account", rec.to_account},
            {"amount", rec.amount},
            {"from_balance", get_balance(db(), from_acc)},
            {"to_balance", get_balance(db(), to_acc)}
        };
    }));

    // 7. Transaction History
    server.Get("/api/transactions", api_handler([](const httplib::Request&) {
        auto history = get_transaction_history(db(), 100);
        json list = json::array();
        for (const auto& h : history) {
            list.push_back({
                {"txn_ref", h.txn_ref},
                {"from_account", h.from_account},
                {"to_account", h.to_account},
                {"type", h.type},
                {"amount", h.amount},
                {"status", h.status},
                {"created_at", h.created_at}
            });
        }
        return list;
    }));

    // 8. Write-Ahead Log (WAL) Inspection
    server.Get("/api/wal", api_handler([](const httplib::Request&) {
        Rows logs = db().query("SELECT lsn, txn_ref, action, account_id, old_balance, new_balance, logged_at "
                               "FROM wal_logs ORDER BY lsn DESC LIMIT 50");
        return to_json_rows(logs);
    }));

    // 9. Trigger Crash Recovery
    server.Post("/api/recovery/run", api_handler([](const httplib::Request&) {
        RecoveryStats stats = run_crash_recovery(db());
        return json{
            {"status", "completed"},
            {"records_analyzed", stats.total_records_analyzed},
            {"committed_transactions", stats.committed_txns},
            {"uncommitted_undone", stats.uncommitted_txns_undone},
            {"rolled_back_refs", stats.rolled_back_refs}
        };
    }));

    std::cout << "[Banking Server] Listening on http://0.0.0.0:" << port << " (8 worker threads ready)\n";
    server.listen("0.0.0.0", port);
}

} // namespace banking

