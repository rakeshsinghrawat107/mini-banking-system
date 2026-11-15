# ==============================================================================
# Mini Banking Transaction System - Makefile
# Graphic Era Hill University - Team GHOST
# ==============================================================================

CXX      ?= g++
PG_INC   := $(shell pg_config --includedir 2>/dev/null)
PG_LIB   := $(shell pg_config --libdir 2>/dev/null)

CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -pthread -MMD -MP -Ithird_party -Isrc
ifneq ($(PG_INC),)
  CXXFLAGS += -I$(PG_INC)
endif

LDLIBS   ?= -lpq
ifneq ($(PG_LIB),)
  LDLIBS   := -L$(PG_LIB) $(LDLIBS)
endif

ifeq ($(OS),Windows_NT)
  CXXFLAGS += -D_WIN32_WINNT=0x0A00
  LDLIBS   += -lws2_32
endif

APP_OBJS := $(patsubst src/%.cpp,build/%.o,$(filter-out src/main.cpp,$(wildcard src/*.cpp)))

all: banking

banking: build/main.o $(APP_OBJS)
	$(CXX) $^ -o $@ $(LDLIBS)

build/%.o: src/%.cpp
	@mkdir -p build
	$(CXX) $(CXXFLAGS) -c $< -o $@

run: banking
	./banking

init: banking
	./banking --init

demo-race: banking
	./banking --demo-race

demo-deadlock: banking
	./banking --demo-deadlock

demo-crash: banking
	./banking --demo-crash

clean:
	rm -rf build banking banking.exe wal.log

-include build/*.d
.PHONY: all run init demo-race demo-deadlock demo-crash clean

