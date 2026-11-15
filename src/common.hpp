#pragma once
#include <map>
#include <stdexcept>
#include <string>
#include <vector>

namespace banking {

using Row = std::map<std::string, std::string>;
using Rows = std::vector<Row>;

struct HttpError : std::runtime_error {
    int status;
    HttpError(int s, const std::string& m) : std::runtime_error(m), status(s) {}
};

} // namespace banking
